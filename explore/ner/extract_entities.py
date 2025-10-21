#!/usr/bin/env python3
"""
Extract Named Entities from all letters using spaCy NER
"""

import json
import glob
import html
from collections import defaultdict

def clean_html(text):
    """Remove HTML tags and decode HTML entities"""
    # Decode HTML entities
    text = html.unescape(text)
    # Remove HTML tags (simple approach)
    import re
    text = re.sub(r'<[^>]+>', '', text)
    return text

def extract_entities():
    """Extract named entities from all letter JSON files"""

    # Import spaCy (should be installed in venv)
    import spacy

    print("Loading spaCy model...")
    nlp = spacy.load("en_core_web_sm")
    print("spaCy loaded successfully!\n")

    # Dictionary to store entities by type
    entities_by_type = defaultdict(set)

    # Get all letter files
    letter_files = sorted(glob.glob('../letters/*.json'))
    print(f"Processing {len(letter_files)} letters...\n")

    count = 0
    for filepath in letter_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            letter = json.load(f)

        # Extract text from metadata
        all_text = []

        # Get text from all metadata fields
        for field, values in letter['metadata'].items():
            for value in values:
                if value:
                    # Clean HTML and decode entities
                    cleaned = clean_html(value)
                    all_text.append(cleaned)

        # Process with spaCy
        combined_text = ' '.join(all_text)
        if combined_text:
            doc = nlp(combined_text)

            # Extract entities
            for ent in doc.ents:
                # Store normalized version (strip whitespace, title case for names)
                entity_text = ent.text.strip()
                if entity_text:
                    entities_by_type[ent.label_].add(entity_text)

        count += 1
        if count % 25 == 0:
            print(f"Processed {count} letters...")

    print(f"\n✓ Processed all {count} letters\n")

    # Display summary
    print("Entity counts by type:")
    for entity_type in sorted(entities_by_type.keys()):
        print(f"  {entity_type}: {len(entities_by_type[entity_type])} unique")

    return entities_by_type

def save_entities(entities_by_type):
    """Save entities to text files"""

    print("\nSaving entities to files...")

    # Entity types we're most interested in
    priority_types = {
        'PERSON': 'people.txt',
        'GPE': 'places_gpe.txt',  # Countries, cities, states
        'LOC': 'places_loc.txt',  # Other locations
        'ORG': 'organizations.txt',
        'DATE': 'dates.txt',
        'EVENT': 'events.txt',
        'NORP': 'nationalities.txt',  # Nationalities, religious/political groups
        'FAC': 'facilities.txt',  # Buildings, airports, etc.
        'LANGUAGE': 'languages.txt',
        'WORK_OF_ART': 'works_of_art.txt'
    }

    # Save priority types to their own files
    for entity_type, filename in priority_types.items():
        if entity_type in entities_by_type:
            entities = sorted(entities_by_type[entity_type])
            with open(filename, 'w', encoding='utf-8') as f:
                for entity in entities:
                    f.write(entity + '\n')
            print(f"  ✓ {filename}: {len(entities)} entities")

    # Save all entities to a combined file
    all_entities = []
    for entity_type in sorted(entities_by_type.keys()):
        all_entities.append(f"\n# {entity_type} ({len(entities_by_type[entity_type])} unique)\n")
        for entity in sorted(entities_by_type[entity_type]):
            all_entities.append(f"{entity}\n")

    with open('all_entities.txt', 'w', encoding='utf-8') as f:
        f.writelines(all_entities)
    print(f"  ✓ all_entities.txt: Complete listing by type")

    # Create a summary file
    with open('summary.txt', 'w', encoding='utf-8') as f:
        f.write("Named Entity Recognition Summary\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Total letters processed: {len(glob.glob('../letters/*.json'))}\n")
        f.write(f"Total entity types found: {len(entities_by_type)}\n\n")
        f.write("Entity counts by type:\n")
        for entity_type in sorted(entities_by_type.keys()):
            f.write(f"  {entity_type}: {len(entities_by_type[entity_type])} unique\n")
    print(f"  ✓ summary.txt: Overview statistics")

if __name__ == '__main__':
    print("Named Entity Recognition Extraction")
    print("=" * 50 + "\n")

    entities_by_type = extract_entities()
    save_entities(entities_by_type)

    print("\n✓ Entity extraction complete!")
    print("\nFiles created:")
    print("  - people.txt (PERSON entities)")
    print("  - places_gpe.txt (Countries, cities, states)")
    print("  - places_loc.txt (Other locations)")
    print("  - organizations.txt (ORG entities)")
    print("  - dates.txt (DATE entities)")
    print("  - events.txt (EVENT entities)")
    print("  - nationalities.txt (NORP entities)")
    print("  - facilities.txt (FAC entities)")
    print("  - languages.txt (LANGUAGE entities)")
    print("  - works_of_art.txt (WORK_OF_ART entities)")
    print("  - all_entities.txt (Complete listing)")
    print("  - summary.txt (Statistics)")
