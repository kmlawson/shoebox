#!/usr/bin/env python3
"""
Extract items 105 and 194 from SQL database
Based on extract_simple.py but modified to extract non-letter items
"""

import json
import re

def unescape_sql_string(s):
    """Unescape SQL string escapes"""
    s = s.replace("\\'", "'")
    s = s.replace('\\"', '"')
    s = s.replace('\\\\', '\\')
    s = s.replace('\\n', '\n')
    s = s.replace('\\r', '\r')
    s = s.replace('\\t', '\t')
    return s

def parse_insert_values(values_str):
    """Parse VALUES clause into rows"""
    rows = []
    current_row = []
    current_value = []
    in_string = False
    paren_depth = 0
    escape_next = False

    i = 0
    while i < len(values_str):
        char = values_str[i]

        if escape_next:
            current_value.append(char)
            escape_next = False
            i += 1
            continue

        if char == '\\' and in_string:
            current_value.append(char)
            escape_next = True
            i += 1
            continue

        if char == "'" and not escape_next:
            if in_string:
                # End of string
                in_string = False
            else:
                # Start of string
                in_string = True
            i += 1
            continue

        if not in_string:
            if char == '(':
                if paren_depth == 0:
                    current_row = []
                    current_value = []
                paren_depth += 1
                i += 1
                continue
            elif char == ')':
                paren_depth -= 1
                if paren_depth == 0:
                    # End of row
                    val = ''.join(current_value).strip()
                    if val == 'NULL':
                        current_row.append(None)
                    else:
                        current_row.append(unescape_sql_string(val))
                    rows.append(current_row)
                    current_row = []
                    current_value = []
                i += 1
                continue
            elif char == ',' and paren_depth == 1:
                # End of value
                val = ''.join(current_value).strip()
                if val == 'NULL':
                    current_row.append(None)
                else:
                    current_row.append(unescape_sql_string(val))
                current_value = []
                i += 1
                continue

        current_value.append(char)
        i += 1

    return rows

print("Reading SQL file...")
sql_file = '/Users/kml8/shell/shoebox/backups/huginn_shoebox.sql'

# Read the SQL file and extract INSERT statements
items_data = []
elements_data = []
element_texts_data = []
tags_data = []
taggings_data = []
files_data = []

with open(sql_file, 'r', encoding='utf-8') as f:
    current_table = None
    collecting_insert = False
    insert_buffer = []

    for line in f:
        line = line.rstrip('\n')

        # Detect which table we're inserting into
        if 'INSERT INTO `omeka_items`' in line:
            current_table = 'items'
            collecting_insert = True
            insert_buffer = [line]
        elif 'INSERT INTO `omeka_elements`' in line:
            current_table = 'elements'
            collecting_insert = True
            insert_buffer = [line]
        elif 'INSERT INTO `omeka_element_texts`' in line:
            current_table = 'element_texts'
            collecting_insert = True
            insert_buffer = [line]
        elif 'INSERT INTO `omeka_tags`' in line:
            current_table = 'tags'
            collecting_insert = True
            insert_buffer = [line]
        elif 'INSERT INTO `omeka_taggings`' in line:
            current_table = 'taggings'
            collecting_insert = True
            insert_buffer = [line]
        elif 'INSERT INTO `omeka_files`' in line:
            current_table = 'files'
            collecting_insert = True
            insert_buffer = [line]
        elif collecting_insert:
            insert_buffer.append(line)
            if line.endswith(';'):
                # Complete INSERT statement
                full_insert = ' '.join(insert_buffer)

                # Extract VALUES clause
                match = re.search(r'VALUES\s+(.+);$', full_insert, re.DOTALL)
                if match:
                    values_str = match.group(1)
                    rows = parse_insert_values(values_str)

                    if current_table == 'items':
                        items_data.extend(rows)
                    elif current_table == 'elements':
                        elements_data.extend(rows)
                    elif current_table == 'element_texts':
                        element_texts_data.extend(rows)
                    elif current_table == 'tags':
                        tags_data.extend(rows)
                    elif current_table == 'taggings':
                        taggings_data.extend(rows)
                    elif current_table == 'files':
                        files_data.extend(rows)

                collecting_insert = False
                current_table = None
                insert_buffer = []

print("\nBuilding lookup tables...")

# Build element ID to name mapping
element_map = {}
for elem in elements_data:
    element_map[elem[0]] = elem[5]  # id -> name (name is index 5)

# Build tag ID to name mapping (convert to int for lookup)
tag_map = {}
for tag in tags_data:
    tag_map[int(tag[0])] = tag[1]  # id -> name

print("Processing items 105 and 194...")

# Process items 105 and 194 only
for item in items_data:
    item_id = int(item[0])

    # Only process items 105 and 194
    if item_id not in [105, 194]:
        continue

    item_type_id = int(item[1]) if item[1] else None

    letter = {
        'id': item_id,
        'added': item[6],  # added is index 6
        'modified': item[5],  # modified is index 5
        'public': bool(int(item[4])) if item[4] else False,  # public is index 4
        'metadata': {}
    }

    # Get element texts for this item
    for et in element_texts_data:
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
    for tagging in taggings_data:
        relation_id = int(tagging[1])  # relation_id is index 1
        if relation_id == item_id and tagging[4] == 'Item':  # type is index 4
            tag_id = int(tagging[2])  # tag_id is index 2
            tag_name = tag_map.get(tag_id, f"Unknown_{tag_id}")
            letter_tags.append(tag_name)
    letter['tags'] = sorted(letter_tags)

    # Get files for this item
    letter_files = []
    for file_row in files_data:
        file_item_id = int(file_row[1]) if file_row[1] else None
        if file_item_id == item_id:
            letter_files.append({
                'original': file_row[9],  # original_filename is index 9
                'filename': file_row[8],  # archive_filename is index 8
                'mime_type': file_row[5]  # mime_browser is index 5
            })
    letter['files'] = letter_files

    # Write to JSON file
    filename = f'letters-raw/{item_id:04d}.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(letter, f, indent=2, ensure_ascii=False)

    print(f"✓ Extracted item {item_id} to {filename}")
    print(f"  Type: {item_type_id}")
    print(f"  Title: {letter['metadata'].get('Title', ['Unknown'])[0]}")
    print()

print("Done!")
