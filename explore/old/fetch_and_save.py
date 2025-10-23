#!/usr/bin/env python3
"""
Fetch JSON data from PHP extraction script and save to individual files
"""

import json
import subprocess
import os

print("Extracting letters from database using PHP...")

# Run the PHP script and capture output
result = subprocess.run(
    ['php', 'extract_letters_web.php'],
    capture_output=True,
    text=True,
    cwd='/Users/kml8/shell/shoebox/explore'
)

if result.returncode != 0:
    print(f"Error running PHP script: {result.stderr}")
    exit(1)

# Parse the JSON output
try:
    letters = json.loads(result.stdout)
except json.JSONDecodeError as e:
    print(f"Error parsing JSON: {e}")
    print(f"Output was: {result.stdout[:500]}")
    exit(1)

print(f"Found {len(letters)} letters\n")

# Save each letter to its own file
count = 0
for item_id, letter in letters.items():
    filename = f'letters/{int(item_id):04d}.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(letter, f, indent=2, ensure_ascii=False)

    count += 1
    if count % 10 == 0:
        print(f"Saved {count} letters...")

print(f"\n✓ Extracted {count} letters to JSON files in explore/letters/")
print(f"✓ Each letter saved as XXXX.json (e.g., 0001.json, 0002.json)")
