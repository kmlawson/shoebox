#!/usr/bin/env python3
"""
Build script for Norwegian Letters Browser
Combines individual letter JSON files into a single compressed file
and generates metadata index for filtering.
"""

import json
import gzip
import os
from pathlib import Path
from collections import defaultdict

# Directories
LETTERS_RAW_DIR = Path(__file__).parent / "letters-raw"
OUTPUT_DIR = Path(__file__).parent

def load_all_letters():
    """Load all letter JSON files from letters-raw directory."""
    letters = []
    json_files = sorted(LETTERS_RAW_DIR.glob("*.json"))

    print(f"Found {len(json_files)} JSON files in {LETTERS_RAW_DIR}")

    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                letter = json.load(f)
                letters.append(letter)
        except Exception as e:
            print(f"Error loading {json_file}: {e}")

    print(f"Successfully loaded {len(letters)} letters")
    return letters

def extract_metadata(letters):
    """Extract unique metadata for filters."""
    metadata = {
        'tags': set(),
        'creators': set(),
        'years': set(),
        'locations': set(),
        'destinations': set()
    }

    for letter in letters:
        # Extract tags
        if letter.get('tags'):
            for tag in letter['tags']:
                if tag:  # Skip empty tags
                    metadata['tags'].add(tag.strip())

        # Extract creators (excluding translator and other non-author entries)
        if letter.get('metadata', {}).get('Creator'):
            for creator in letter['metadata']['Creator']:
                # Skip translator and empty strings
                creator_clean = creator.strip() if creator else ''
                # Skip any variation of "Siri Lawson" with "trans"
                import re
                if creator_clean and not re.search(r'Siri Lawson.*trans', creator_clean, re.IGNORECASE):
                    metadata['creators'].add(creator_clean)

        # Extract year from LetterDate
        if letter.get('metadata', {}).get('LetterDate'):
            letter_date = letter['metadata']['LetterDate'][0]
            if letter_date:
                year = letter_date[:4]  # Extract YYYY
                metadata['years'].add(year.strip())

        # Extract locations
        if letter.get('metadata', {}).get('Location'):
            location = letter['metadata']['Location'][0]
            if location:
                metadata['locations'].add(location.strip())

        # Extract destinations
        if letter.get('metadata', {}).get('Destination'):
            destination = letter['metadata']['Destination'][0]
            if destination:
                metadata['destinations'].add(destination.strip())

    # Convert sets to sorted lists for JSON serialization
    return {
        'tags': sorted(list(metadata['tags'])),
        'creators': sorted(list(metadata['creators'])),
        'years': sorted(list(metadata['years'])),
        'locations': sorted(list(metadata['locations'])),
        'destinations': sorted(list(metadata['destinations']))
    }

def save_json(data, filepath):
    """Save data as JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {filepath} ({os.path.getsize(filepath):,} bytes)")

def save_gzipped_json(data, filepath):
    """Save data as gzipped JSON file."""
    json_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')

    with gzip.open(filepath, 'wb') as f:
        f.write(json_bytes)

    original_size = len(json_bytes)
    compressed_size = os.path.getsize(filepath)
    ratio = (1 - compressed_size / original_size) * 100

    print(f"Saved {filepath}")
    print(f"  Original: {original_size:,} bytes")
    print(f"  Compressed: {compressed_size:,} bytes")
    print(f"  Compression: {ratio:.1f}%")

def main():
    """Main build process."""
    print("=" * 60)
    print("Norwegian Letters Browser - Build Script")
    print("=" * 60)

    # Load all letters
    letters = load_all_letters()

    if not letters:
        print("ERROR: No letters found!")
        return

    # Sort letters by date for consistent ordering
    letters_sorted = sorted(letters, key=lambda x: x.get('metadata', {}).get('LetterDate', [''])[0] or '')

    print(f"\nDate range: {letters_sorted[0].get('metadata', {}).get('LetterDate', ['Unknown'])[0]} to "
          f"{letters_sorted[-1].get('metadata', {}).get('LetterDate', ['Unknown'])[0]}")

    # Save uncompressed JSON (temporary, for debugging)
    letters_json = OUTPUT_DIR / "letters.json"
    save_json(letters_sorted, letters_json)

    # Save compressed JSON (this is what the browser will load)
    letters_gz = OUTPUT_DIR / "letters.json.gz"
    save_gzipped_json(letters_sorted, letters_gz)

    # Extract and save metadata
    print("\nExtracting metadata...")
    metadata = extract_metadata(letters_sorted)
    print(f"  Tags: {len(metadata['tags'])}")
    print(f"  Creators: {len(metadata['creators'])}")
    print(f"  Years: {len(metadata['years'])}")
    print(f"  Locations: {len(metadata['locations'])}")
    print(f"  Destinations: {len(metadata['destinations'])}")

    metadata_json = OUTPUT_DIR / "metadata-index.json"
    save_json(metadata, metadata_json)

    print("\n" + "=" * 60)
    print("Build complete!")
    print("=" * 60)
    print("\nGenerated files:")
    print(f"  - letters.json (uncompressed, for reference)")
    print(f"  - letters.json.gz (compressed, loaded by browser)")
    print(f"  - metadata-index.json (filter options)")
    print("\nNext step: Open index.html in a web browser")

if __name__ == "__main__":
    main()
