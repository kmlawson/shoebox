#!/usr/bin/env python3
"""
Add TF-IDF data to individual letter JSON files.
Reads tfidf_norwegian.json and tfidf_english.json and adds the data
to each letter's JSON file in letters-raw/.
"""

import json
from pathlib import Path

# Paths
TOOLS_DIR = Path(__file__).parent
LETTERS_RAW_DIR = TOOLS_DIR.parent / "letters-raw"
NORWEGIAN_TFIDF = TOOLS_DIR / "tfidf_norwegian.json"
ENGLISH_TFIDF = TOOLS_DIR / "tfidf_english.json"

def load_tfidf_data():
    """Load TF-IDF data from JSON files."""
    print("Loading TF-IDF data...")

    with open(NORWEGIAN_TFIDF, 'r', encoding='utf-8') as f:
        norwegian_data = json.load(f)
    print(f"  Loaded Norwegian TF-IDF for {len(norwegian_data)} letters")

    with open(ENGLISH_TFIDF, 'r', encoding='utf-8') as f:
        english_data = json.load(f)
    print(f"  Loaded English TF-IDF for {len(english_data)} letters")

    return norwegian_data, english_data

def update_letter_files(norwegian_data, english_data):
    """Update each letter JSON file with TF-IDF data."""
    json_files = sorted(LETTERS_RAW_DIR.glob("*.json"))

    print(f"\nUpdating {len(json_files)} letter files...")

    updated_count = 0

    for json_file in json_files:
        try:
            # Load the letter
            with open(json_file, 'r', encoding='utf-8') as f:
                letter = json.load(f)

            letter_id = str(letter.get('id', ''))

            # Add Norwegian TF-IDF if available
            if letter_id in norwegian_data:
                letter['norwegian-tfidf'] = norwegian_data[letter_id]['top_tfidf_terms']

            # Add English TF-IDF if available
            if letter_id in english_data:
                letter['english-tfidf'] = english_data[letter_id]['top_tfidf_terms']

            # Save the updated letter
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(letter, f, ensure_ascii=False, indent=2)

            updated_count += 1

            # Print progress every 50 files
            if updated_count % 50 == 0:
                print(f"  Updated {updated_count} files...")

        except Exception as e:
            print(f"  Error updating {json_file}: {e}")

    print(f"\n✓ Successfully updated {updated_count} letter files")

def main():
    print("=" * 60)
    print("Add TF-IDF Data to Letter Files")
    print("=" * 60)

    # Load TF-IDF data
    norwegian_data, english_data = load_tfidf_data()

    # Update letter files
    update_letter_files(norwegian_data, english_data)

    print("\n" + "=" * 60)
    print("Done! Now run build-data.py to rebuild letters.json")
    print("=" * 60)

if __name__ == "__main__":
    main()
