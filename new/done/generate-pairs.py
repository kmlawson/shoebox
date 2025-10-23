#!/usr/bin/env python3
"""
Generate pairs.csv from letters data and locations.csv
Creates a CSV of location-destination pairs with counts and letter IDs
"""

import json
import csv
from collections import defaultdict

# Load valid locations from locations.csv
valid_locations = set()
location_coords = {}

print("Reading locations.csv...")
with open('locations.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header

    for row in reader:
        if len(row) < 3:
            continue

        name = row[0].strip()

        # Check if row has 4 columns (Name, Country, Lat, Lon) or 3 (Name, Lat, Lon)
        if len(row) == 4:
            country = row[1].strip()
            lat = float(row[2].strip())
            lon = float(row[3].strip())
        else:  # 3 columns
            country = ''
            lat = float(row[1].strip())
            lon = float(row[2].strip())

        valid_locations.add(name)
        location_coords[name] = {
            'lat': lat,
            'lon': lon,
            'country': country
        }

print(f"Found {len(valid_locations)} valid locations")

# Load letters data
print("Reading letters.json...")
with open('letters.json', 'r', encoding='utf-8') as f:
    letters = json.load(f)

print(f"Found {len(letters)} letters")

# Track pairs and their letter IDs
# Key: (location, destination) tuple
# Value: list of letter IDs
pairs_dict = defaultdict(list)

# Find all valid pairs
for letter in letters:
    letter_id = letter.get('id')
    location_array = letter.get('metadata', {}).get('Location', [''])
    destination_array = letter.get('metadata', {}).get('Destination', [''])

    location = location_array[0].strip() if location_array else ''
    destination = destination_array[0].strip() if destination_array else ''

    # Check if both exist and are in valid locations
    if location and destination:
        if location in valid_locations and destination in valid_locations:
            # Normalize pair (always store alphabetically to treat bidirectional as same)
            pair_key = tuple(sorted([location, destination]))
            pairs_dict[pair_key].append(letter_id)

print(f"Found {len(pairs_dict)} unique location pairs")

# Write pairs.csv
print("Writing pairs.csv...")
with open('pairs.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Location1', 'Lat1', 'Lon1', 'Country1',
                     'Location2', 'Lat2', 'Lon2', 'Country2',
                     'Count', 'LetterIDs'])

    for (loc1, loc2), letter_ids in sorted(pairs_dict.items(),
                                            key=lambda x: len(x[1]),
                                            reverse=True):
        coords1 = location_coords[loc1]
        coords2 = location_coords[loc2]

        writer.writerow([
            loc1, coords1['lat'], coords1['lon'], coords1['country'],
            loc2, coords2['lat'], coords2['lon'], coords2['country'],
            len(letter_ids),
            ';'.join(map(str, sorted(letter_ids)))  # Use semicolon to avoid CSV quoting issues
        ])

print("Done! pairs.csv has been created.")
print(f"Total pairs with letters: {len(pairs_dict)}")
print(f"Total letter connections: {sum(len(ids) for ids in pairs_dict.values())}")
