#!/usr/bin/env python3
"""
Count frequency of named entities with consolidation
Consolidates variations like "Alma", "Alma Wilson", "Alma C. Wilson" into longest form
"""

import json
import glob
import html
from collections import Counter, defaultdict
import re

def clean_html(text):
    """Remove HTML tags and decode HTML entities"""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    return text

def is_substring_match(short_name, long_name):
    """Check if short_name is a meaningful substring of long_name"""
    # Normalize for comparison
    short = short_name.strip().lower()
    long = long_name.strip().lower()

    if short == long:
        return False

    # Check if short is contained in long as complete words
    # E.g., "Alma" matches "Alma Wilson" but "ma" doesn't match "Alma Wilson"
    short_words = short.split()
    long_words = long.split()

    # All words in short must appear consecutively in long
    if len(short_words) >= len(long_words):
        return False

    # Check for consecutive word match
    for i in range(len(long_words) - len(short_words) + 1):
        if long_words[i:i+len(short_words)] == short_words:
            return True

    return False

def consolidate_entity_variants(entity_counter):
    """Consolidate entity variations into longest forms"""

    print(f"\nConsolidating entity variations...")

    # Sort entities by length (longest first)
    sorted_entities = sorted(entity_counter.keys(), key=lambda x: (-len(x), x))

    # Map of short form -> longest form
    consolidation_map = {}

    # For each entity, check if it's a substring of any longer entity
    for i, short_entity in enumerate(sorted_entities):
        # Check all longer entities
        for long_entity in sorted_entities[:i]:
            if is_substring_match(short_entity, long_entity):
                # This entity should be consolidated into the longer form
                if short_entity not in consolidation_map:
                    consolidation_map[short_entity] = long_entity
                    print(f"  '{short_entity}' → '{long_entity}'")
                break

    # Build consolidated counter
    consolidated_counter = Counter()

    for entity, count in entity_counter.items():
        # Map to longest form if applicable
        target_entity = consolidation_map.get(entity, entity)
        consolidated_counter[target_entity] += count

    removed = len(entity_counter) - len(consolidated_counter)
    print(f"\n✓ Consolidated {removed} variations into longer forms")
    print(f"  Before: {len(entity_counter)} unique entities")
    print(f"  After: {len(consolidated_counter)} unique entities\n")

    return consolidated_counter

def count_entity_frequencies(entity_type='PERSON'):
    """Count entities with basic collection"""

    # Import spaCy
    import spacy
    print(f"Loading spaCy model...")
    nlp = spacy.load("en_core_web_sm")

    # Counter for entities
    entity_counter = Counter()

    # Get all letter files
    letter_files = sorted(glob.glob('../letters/*.json'))
    print(f"Processing {len(letter_files)} letters for {entity_type} entities...\n")

    count = 0
    for filepath in letter_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            letter = json.load(f)

        # Extract text from metadata
        all_text = []
        for field, values in letter['metadata'].items():
            for value in values:
                if value:
                    cleaned = clean_html(value)
                    all_text.append(cleaned)

        # Process with spaCy
        combined_text = ' '.join(all_text)
        if combined_text:
            doc = nlp(combined_text)

            # Count entities of specified type
            for ent in doc.ents:
                if ent.label_ == entity_type:
                    entity_text = ent.text.strip()
                    if entity_text:
                        entity_counter[entity_text] += 1

        count += 1
        if count % 25 == 0:
            print(f"Processed {count} letters...")

    print(f"\n✓ Processed all {count} letters")
    print(f"Found {len(entity_counter)} unique {entity_type} entities (before consolidation)")
    print(f"Total occurrences: {sum(entity_counter.values())}\n")

    return entity_counter

def save_sorted_by_frequency(entity_counter, entity_type='PERSON', suffix=''):
    """Save entities sorted by frequency"""

    # Sort by frequency (descending), then alphabetically
    sorted_entities = sorted(entity_counter.items(), key=lambda x: (-x[1], x[0]))

    # Determine filename
    filename_map = {
        'PERSON': 'people_by_frequency.txt',
        'GPE': 'places_gpe_by_frequency.txt',
        'LOC': 'places_loc_by_frequency.txt',
        'ORG': 'organizations_by_frequency.txt',
        'DATE': 'dates_by_frequency.txt',
        'EVENT': 'events_by_frequency.txt',
        'NORP': 'nationalities_by_frequency.txt'
    }

    filename = filename_map.get(entity_type, f'{entity_type.lower()}_by_frequency.txt')

    # Save with frequencies
    with open(filename, 'w', encoding='utf-8') as f:
        for entity, freq in sorted_entities:
            f.write(f"{freq:4d}  {entity}\n")

    print(f"✓ Saved {filename}")

    # Also save just the names (sorted by frequency)
    simple_filename = filename_map.get(entity_type, f'{entity_type.lower()}.txt')
    if entity_type == 'PERSON':
        simple_filename = 'people.txt'
    elif entity_type == 'GPE':
        simple_filename = 'places_gpe.txt'
    elif entity_type == 'LOC':
        simple_filename = 'places_loc.txt'
    elif entity_type == 'ORG':
        simple_filename = 'organizations.txt'

    with open(simple_filename, 'w', encoding='utf-8') as f:
        for entity, freq in sorted_entities:
            f.write(f"{entity}\n")

    print(f"✓ Updated {simple_filename} (consolidated & sorted by frequency)")

    return sorted_entities

def show_top_entities(sorted_entities, n=50):
    """Display top N entities"""
    print(f"\nTop {n} entities (after consolidation):")
    print("=" * 60)
    for i, (entity, freq) in enumerate(sorted_entities[:n], 1):
        print(f"{i:3d}. {freq:4d}x  {entity}")

if __name__ == '__main__':
    import sys

    entity_type = sys.argv[1] if len(sys.argv) > 1 else 'PERSON'

    print(f"Entity Frequency Counter (Consolidated)")
    print("=" * 60)
    print(f"Entity type: {entity_type}")
    print(f"Strategy: Consolidate variations into longest forms")
    print(f"Example: 'Alma' + 'Alma Wilson' → 'Alma C. Wilson'\n")

    # Count frequencies
    entity_counter = count_entity_frequencies(entity_type)

    # Consolidate variations
    consolidated_counter = consolidate_entity_variants(entity_counter)

    # Save sorted
    sorted_entities = save_sorted_by_frequency(consolidated_counter, entity_type)

    # Show top 50
    show_top_entities(sorted_entities, 50)

    print("\n✓ Complete!")
