#!/usr/bin/env python3
"""
Extract letters from Omeka SQL dump and convert to JSON flat files
Uses SQLite to parse MySQL dump
"""

import json
import sqlite3
import re
import os

def convert_mysql_to_sqlite_line(line):
    """Convert MySQL syntax to SQLite compatible syntax"""
    # Remove MySQL-specific commands
    if any(cmd in line for cmd in ['LOCK TABLES', 'UNLOCK TABLES', 'SET ', 'DROP TABLE']):
        return ''

    # Convert AUTO_INCREMENT
    line = re.sub(r'AUTO_INCREMENT=\d+', '', line)

    # Convert character set and collation
    line = re.sub(r'CHARACTER SET \w+', '', line)
    line = re.sub(r'COLLATE \w+', '', line)
    line = re.sub(r'DEFAULT CHARSET=\w+', '', line)

    # Convert ENGINE
    line = re.sub(r'ENGINE=\w+', '', line)

    # Convert KEY to INDEX
    line = re.sub(r'KEY `(\w+)`', r'INDEX \1', line)
    line = re.sub(r'UNIQUE KEY `(\w+)`', r'UNIQUE INDEX \1', line)

    # Remove backticks around table and column names (SQLite doesn't need them)
    # line = line.replace('`', '"')

    return line

print("Reading SQL file...")
sql_file = '../huginn_shoebox.sql'

# Create in-memory SQLite database
conn = sqlite3.connect(':memory:')
conn.text_factory = str  # Use UTF-8
cursor = conn.cursor()

# Read and execute SQL
print("Loading data into SQLite...")
with open(sql_file, 'r', encoding='utf-8') as f:
    sql_commands = []
    current_command = []

    for line in f:
        line = line.strip()

        # Skip comments and empty lines
        if not line or line.startswith('--') or line.startswith('/*') or line.startswith('*/'):
            continue

        # Convert MySQL to SQLite syntax
        line = convert_mysql_to_sqlite_line(line)
        if not line:
            continue

        current_command.append(line)

        # Check if command is complete
        if line.endswith(';'):
            command = ' '.join(current_command)
            try:
                cursor.execute(command)
            except sqlite3.Error as e:
                # Skip errors for unsupported commands
                if 'syntax error' not in str(e).lower():
                    print(f"Warning: {e}")
            current_command = []

conn.commit()

print("\nQuerying database...")

# Get all letter items
cursor.execute("""
    SELECT id, added, modified, public
    FROM omeka_items
    WHERE item_type_id = 1
    ORDER BY id
""")
items = cursor.fetchall()

print(f"Found {len(items)} letters\n")

count = 0
for item in items:
    item_id, added, modified, public = item

    letter = {
        'id': item_id,
        'added': added,
        'modified': modified,
        'public': bool(public),
        'metadata': {}
    }

    # Get element texts
    cursor.execute("""
        SELECT e.name, et.text
        FROM omeka_element_texts et
        JOIN omeka_elements e ON et.element_id = e.id
        WHERE et.record_id = ?
        ORDER BY e.name
    """, (item_id,))

    for element_name, text in cursor.fetchall():
        if element_name not in letter['metadata']:
            letter['metadata'][element_name] = []
        letter['metadata'][element_name].append(text)

    # Get tags
    cursor.execute("""
        SELECT t.name
        FROM omeka_taggings tg
        JOIN omeka_tags t ON tg.tag_id = t.id
        WHERE tg.relation_id = ? AND tg.type = 'Item'
        ORDER BY t.name
    """, (item_id,))

    letter['tags'] = [row[0] for row in cursor.fetchall()]

    # Get files
    cursor.execute("""
        SELECT original_filename, filename, mime_type
        FROM omeka_files
        WHERE item_id = ?
        ORDER BY id
    """, (item_id,))

    letter['files'] = [
        {
            'original': row[0],
            'filename': row[1],
            'mime_type': row[2]
        }
        for row in cursor.fetchall()
    ]

    # Write to JSON file
    filename = f'letters/{item_id:04d}.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(letter, f, indent=2, ensure_ascii=False)

    count += 1
    if count % 10 == 0:
        print(f"Processed {count} letters...")

print(f"\n✓ Extracted {count} letters to JSON files in explore/letters/")
print(f"✓ Each letter saved as XXXX.json (e.g., 0001.json, 0002.json)")

conn.close()
