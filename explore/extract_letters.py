#!/usr/bin/env python3
"""
Extract letters from Omeka SQL dump and convert to JSON flat files
"""

import json
import re
import os

def parse_sql_inserts(sql_file, table_name):
    """Extract INSERT statements for a specific table"""
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find INSERT statements for this table
    pattern = rf"INSERT INTO `{table_name}` VALUES (.+?);"
    matches = re.findall(pattern, content, re.DOTALL)

    rows = []
    for match in matches:
        # Parse the values - handle multiple rows in one INSERT
        # This regex splits on ),( but keeps the parentheses
        row_pattern = r'\(([^)]+(?:\([^)]*\)[^)]*)*)\)'
        for row_match in re.finditer(row_pattern, match):
            row_data = row_match.group(1)
            rows.append(parse_row_values(row_data))

    return rows

def parse_row_values(row_str):
    """Parse a single row's values"""
    values = []
    current = []
    in_quotes = False
    escape_next = False

    for char in row_str:
        if escape_next:
            current.append(char)
            escape_next = False
            continue

        if char == '\\':
            escape_next = True
            current.append(char)
            continue

        if char == "'" and not escape_next:
            in_quotes = not in_quotes
            continue

        if char == ',' and not in_quotes:
            val = ''.join(current).strip()
            if val == 'NULL':
                values.append(None)
            else:
                # Unescape SQL escapes
                val = val.replace("\\'", "'").replace("\\\\", "\\").replace("\\n", "\n")
                values.append(val)
            current = []
            continue

        current.append(char)

    # Add last value
    if current:
        val = ''.join(current).strip()
        if val == 'NULL':
            values.append(None)
        else:
            val = val.replace("\\'", "'").replace("\\\\", "\\").replace("\\n", "\n")
            values.append(val)

    return values

# Read SQL file
sql_file = '../huginn_shoebox.sql'
print("Extracting data from SQL file...\n")

# Extract tables
print("Extracting items...")
items = parse_sql_inserts(sql_file, 'omeka_items')

print("Extracting element_texts...")
element_texts = parse_sql_inserts(sql_file, 'omeka_element_texts')

print("Extracting elements...")
elements = parse_sql_inserts(sql_file, 'omeka_elements')

print("Extracting tags...")
tags = parse_sql_inserts(sql_file, 'omeka_tags')

print("Extracting taggings...")
taggings = parse_sql_inserts(sql_file, 'omeka_taggings')

print("Extracting files...")
files = parse_sql_inserts(sql_file, 'omeka_files')

print(f"\nFound:")
print(f"  {len(items)} items")
print(f"  {len(element_texts)} element texts")
print(f"  {len(elements)} elements")
print(f"  {len(tags)} tags")
print(f"  {len(taggings)} taggings")
print(f"  {len(files)} files")

# Build element ID to name mapping
element_map = {}
for elem in elements:
    element_map[elem[0]] = elem[2]  # id -> name

# Build tag ID to name mapping
tag_map = {}
for tag in tags:
    tag_map[tag[0]] = tag[1]  # id -> name

# Process each item
print("\nProcessing letters...")
count = 0

for item in items:
    item_id = int(item[0])
    item_type_id = int(item[1]) if item[1] else None

    # Only process items with item_type_id = 1 (letters)
    if item_type_id != 1:
        continue

    letter = {
        'id': item_id,
        'added': item[3],
        'modified': item[4],
        'public': bool(int(item[6])) if item[6] else False,
        'metadata': {}
    }

    # Get element texts for this item
    for et in element_texts:
        record_id = int(et[1])
        if record_id == item_id:
            element_id = et[3]
            element_name = element_map.get(element_id, f"Unknown_{element_id}")
            text = et[5]

            if element_name not in letter['metadata']:
                letter['metadata'][element_name] = []
            letter['metadata'][element_name].append(text)

    # Get tags for this item
    letter_tags = []
    for tagging in taggings:
        relation_id = int(tagging[1])
        if relation_id == item_id and tagging[2] == 'Item':
            tag_id = tagging[0]
            tag_name = tag_map.get(tag_id, f"Unknown_{tag_id}")
            letter_tags.append(tag_name)
    letter['tags'] = sorted(letter_tags)

    # Get files for this item
    letter_files = []
    for file in files:
        file_item_id = int(file[1]) if file[1] else None
        if file_item_id == item_id:
            letter_files.append({
                'original': file[3],
                'filename': file[2],
                'mime_type': file[4]
            })
    letter['files'] = letter_files

    # Write to JSON file
    filename = f'letters/{item_id:04d}.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(letter, f, indent=2, ensure_ascii=False)

    count += 1
    if count % 10 == 0:
        print(f"Processed {count} letters...")

print(f"\n✓ Extracted {count} letters to JSON files in explore/letters/")
print(f"✓ Each letter saved as XXXX.json (e.g., 0001.json, 0002.json)")
