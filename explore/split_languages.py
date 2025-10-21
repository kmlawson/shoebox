#!/usr/bin/env python3
"""
Split letters into Norwegian and English versions
Handles both Description and Text fields
"""

import json
import glob
import re
import os

def detect_language_section(text):
    """
    Detect if text section is Norwegian or English
    Returns 'norwegian', 'english', or 'mixed'
    """
    # Common Norwegian words/patterns
    norwegian_indicators = [
        'jeg', 'det', 'til', 'fra', 'og', 'med', 'når', 'være', 'ikke',
        'har', 'som', 'de', 'på', 'brev', 'kj&aelig;re', 'tak', 'hilsen',
        'så', 'får', 'å', 'æ', 'ø'
    ]

    # Common English words
    english_indicators = [
        'the', 'and', 'to', 'from', 'dear', 'letter', 'with', 'that',
        'have', 'been', 'this', 'will', 'your', 'love'
    ]

    text_lower = text.lower()

    norwegian_count = sum(1 for word in norwegian_indicators if word in text_lower)
    english_count = sum(1 for word in english_indicators if word in text_lower)

    if norwegian_count > english_count * 2:
        return 'norwegian'
    elif english_count > norwegian_count * 2:
        return 'english'
    else:
        return 'mixed'

def split_description(description):
    """
    Split description into Norwegian and English parts
    Returns (norwegian_text, english_text)
    """
    if not description:
        return ('', '')

    # Try splitting by double newline (handle both \n and \r\n)
    parts = re.split(r'(?:\r?\n){2,}', description)

    if len(parts) >= 2:
        # Check which is which
        first_lang = detect_language_section(parts[0])
        second_lang = detect_language_section(parts[1]) if len(parts) > 1 else 'unknown'

        if first_lang == 'norwegian' and second_lang == 'english':
            return (parts[0].strip(), '\n\n'.join(parts[1:]).strip())
        elif first_lang == 'english' and second_lang == 'norwegian':
            return ('\n\n'.join(parts[1:]).strip(), parts[0].strip())
        elif first_lang == 'norwegian':
            # Assume rest is English if there's a second part
            return (parts[0].strip(), '\n\n'.join(parts[1:]).strip() if len(parts) > 1 else '')
        elif first_lang == 'english':
            # English first, Norwegian second
            return ('\n\n'.join(parts[1:]).strip() if len(parts) > 1 else '', parts[0].strip())

    # Single paragraph - try to detect language
    lang = detect_language_section(description)
    if lang == 'norwegian':
        return (description.strip(), '')
    elif lang == 'english':
        return ('', description.strip())
    else:
        # Can't determine, return as Norwegian (most common)
        return (description.strip(), '')

def split_text(text):
    """
    Split text into Norwegian and English parts
    More complex as it may have multiple paragraphs
    Returns (norwegian_text, english_text)
    """
    if not text:
        return ('', '')

    # Strategy: Find the transition point between languages
    # Look for common patterns like location/date markers, "Dear", etc.

    # Split by paragraphs
    paragraphs = re.split(r'<p[^>]*>', text)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    # Try to find the split point
    norwegian_paras = []
    english_paras = []
    found_split = False

    for i, para in enumerate(paragraphs):
        lang = detect_language_section(para)

        if not found_split:
            # Still in first language section
            if lang == 'norwegian' or lang == 'mixed':
                norwegian_paras.append(para)
            else:
                # Found English, this might be the split
                found_split = True
                english_paras.append(para)
        else:
            # After split, should be English
            english_paras.append(para)

    # Reconstruct with paragraph tags
    norwegian_text = '<p>' + '</p>\n<p>'.join(norwegian_paras) + '</p>' if norwegian_paras else ''
    english_text = '<p>' + '</p>\n<p>'.join(english_paras) + '</p>' if english_paras else ''

    # If we didn't find a split, try alternative approach
    if not found_split and len(text) > 100:
        # Try splitting by common transition markers
        # Look for English date patterns at start of line
        match = re.search(r'<p[^>]*>[^<]*\b(Dear|Greetings|My dear)\b', text, re.IGNORECASE)
        if match:
            split_pos = match.start()
            norwegian_text = text[:split_pos].strip()
            english_text = text[split_pos:].strip()
        else:
            # Try looking for Norwegian ending followed by English start
            match = re.search(r'(hilsen|Hilsen|Takk)</p>\s*<p[^>]*>[^<]*(Dear|Greetings)', text, re.IGNORECASE)
            if match:
                split_pos = match.start()
                norwegian_text = text[:match.end() - len(match.group(2)) - 20].strip()
                english_text = text[match.end() - len(match.group(2)) - 15:].strip()

    return (norwegian_text, english_text)

def split_letter(letter):
    """
    Split a letter into Norwegian and English versions
    Returns (norwegian_letter, english_letter)
    """
    norwegian_letter = {
        'id': letter['id'],
        'added': letter['added'],
        'modified': letter['modified'],
        'public': letter['public'],
        'metadata': {},
        'tags': letter['tags'],
        'files': letter['files']
    }

    english_letter = {
        'id': letter['id'],
        'added': letter['added'],
        'modified': letter['modified'],
        'public': letter['public'],
        'metadata': {},
        'tags': letter['tags'],
        'files': letter['files']
    }

    # Process each metadata field
    for field, values in letter['metadata'].items():
        norwegian_letter['metadata'][field] = []
        english_letter['metadata'][field] = []

        for value in values:
            if field == 'Description':
                nor, eng = split_description(value)
                if nor:
                    norwegian_letter['metadata'][field].append(nor)
                if eng:
                    english_letter['metadata'][field].append(eng)
            elif field == 'Text':
                nor, eng = split_text(value)
                if nor:
                    norwegian_letter['metadata'][field].append(nor)
                if eng:
                    english_letter['metadata'][field].append(eng)
            elif field == 'Language':
                # Split language field
                if 'Norwegian' in value or 'norwegian' in value:
                    norwegian_letter['metadata'][field].append(value)
                if 'English' in value or 'english' in value:
                    english_letter['metadata'][field].append(value)
            else:
                # Copy other fields to both
                norwegian_letter['metadata'][field].append(value)
                english_letter['metadata'][field].append(value)

    return (norwegian_letter, english_letter)

def main():
    print("Splitting letters into Norwegian and English versions")
    print("=" * 60)

    # Create output directories
    os.makedirs('norwegian_letters', exist_ok=True)
    os.makedirs('english_letters', exist_ok=True)
    print("✓ Created output directories\n")

    # Get all letter files
    letter_files = sorted(glob.glob('letters/*.json'))
    print(f"Processing {len(letter_files)} letters...\n")

    count = 0
    norwegian_count = 0
    english_count = 0

    for filepath in letter_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            letter = json.load(f)

        # Split into Norwegian and English
        nor_letter, eng_letter = split_letter(letter)

        # Save Norwegian version if it has content
        has_norwegian = any(nor_letter['metadata'].get('Text', []) or
                          nor_letter['metadata'].get('Description', []))
        if has_norwegian:
            nor_filename = f"norwegian_letters/{letter['id']:04d}.json"
            with open(nor_filename, 'w', encoding='utf-8') as f:
                json.dump(nor_letter, f, indent=2, ensure_ascii=False)
            norwegian_count += 1

        # Save English version if it has content
        has_english = any(eng_letter['metadata'].get('Text', []) or
                         eng_letter['metadata'].get('Description', []))
        if has_english:
            eng_filename = f"english_letters/{letter['id']:04d}.json"
            with open(eng_filename, 'w', encoding='utf-8') as f:
                json.dump(eng_letter, f, indent=2, ensure_ascii=False)
            english_count += 1

        count += 1
        if count % 25 == 0:
            print(f"Processed {count} letters...")

    print(f"\n✓ Processed all {count} letters")
    print(f"  {norwegian_count} Norwegian versions saved")
    print(f"  {english_count} English versions saved")
    print(f"\nOutput directories:")
    print(f"  norwegian_letters/ - Norwegian-only versions")
    print(f"  english_letters/ - English-only versions")

if __name__ == '__main__':
    main()
