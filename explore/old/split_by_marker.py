#!/usr/bin/env python3
"""
Split letter JSON files into Norwegian and English versions based on <-SPLITTLETTER-> marker
"""
import json
import os
import re
from pathlib import Path

LETTERS_DIR = Path('letters')
NORWEGIAN_DIR = Path('norwegian_letters')
ENGLISH_DIR = Path('english_letters')
SPLIT_MARKER = '\n\n<-SPLITTLETTER->\n\n'

def clean_multiple_blank_lines(text):
    """Reduce multiple blank lines to single blank line between paragraphs"""
    # Replace 2+ consecutive newlines with exactly 2 newlines (one blank line)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def split_letter(letter_data, filename):
    """Split a letter into Norwegian and English versions"""
    # Get the text field
    text = letter_data.get('metadata', {}).get('Text', [''])[0]

    # Split on marker
    if SPLIT_MARKER in text:
        parts = text.split(SPLIT_MARKER, 1)  # Split only on first occurrence
        norwegian_text = parts[0]
        english_text = parts[1] if len(parts) > 1 else ''
    else:
        # No marker - try to detect language or put everything in both
        norwegian_text = text
        english_text = ''

    # Clean up multiple blank lines
    norwegian_text = clean_multiple_blank_lines(norwegian_text)
    english_text = clean_multiple_blank_lines(english_text)

    # Create Norwegian version
    norwegian_data = json.loads(json.dumps(letter_data))  # Deep copy
    norwegian_data['metadata']['Text'] = [norwegian_text]
    norwegian_data['metadata']['Language'] = ['no']

    # Create English version
    english_data = json.loads(json.dumps(letter_data))  # Deep copy
    english_data['metadata']['Text'] = [english_text]
    english_data['metadata']['Language'] = ['en']

    return norwegian_data, english_data

def main():
    # Create output directories
    NORWEGIAN_DIR.mkdir(exist_ok=True)
    ENGLISH_DIR.mkdir(exist_ok=True)

    # Process all JSON files in letters directory
    letter_files = sorted(LETTERS_DIR.glob('*.json'))

    print(f"Found {len(letter_files)} letter files to process")

    processed = 0
    errors = 0

    for letter_file in letter_files:
        try:
            # Read original letter
            with open(letter_file, 'r', encoding='utf-8') as f:
                letter_data = json.load(f)

            # Split into Norwegian and English
            norwegian_data, english_data = split_letter(letter_data, letter_file.name)

            # Write Norwegian version
            norwegian_path = NORWEGIAN_DIR / letter_file.name
            with open(norwegian_path, 'w', encoding='utf-8') as f:
                json.dump(norwegian_data, f, ensure_ascii=False, indent=2)

            # Write English version
            english_path = ENGLISH_DIR / letter_file.name
            with open(english_path, 'w', encoding='utf-8') as f:
                json.dump(english_data, f, ensure_ascii=False, indent=2)

            processed += 1
            print(f"✓ {letter_file.name}")

        except Exception as e:
            errors += 1
            print(f"✗ Error processing {letter_file.name}: {e}")

    print(f"\n{'='*60}")
    print(f"Processing complete!")
    print(f"  Processed: {processed} letters")
    print(f"  Errors: {errors}")
    print(f"  Norwegian files: {NORWEGIAN_DIR}/")
    print(f"  English files: {ENGLISH_DIR}/")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
