# Named Entity Recognition (NER) Extraction

## Overview

This directory contains Named Entity Recognition (NER) extraction results from all 246 letters in the Shoebox collection using spaCy's English language model.

## What Was Done

### 1. Research
Researched best Python NER libraries and selected **spaCy** for:
- State-of-the-art accuracy
- Production-ready performance
- 18 entity types supported
- Easy to use and well-documented
- Pre-trained English models

### 2. Installation
- Created Python virtual environment (`venv/`)
- Installed spaCy library
- Downloaded `en_core_web_sm` English model

### 3. Extraction Process
- Processed all 246 letter JSON files
- Extracted text from all metadata fields
- Cleaned HTML tags and decoded HTML entities
- Applied spaCy NER to identify named entities
- Collected unique entities by type

## Results Summary

**Total entities extracted across 18 types:**

| Entity Type | Count | Description |
|-------------|-------|-------------|
| **PERSON** | 5,262 | People's names (including fictional) |
| **ORG** | 1,932 | Organizations, companies, agencies |
| **DATE** | 1,191 | Dates and time periods |
| **CARDINAL** | 583 | Numerical values |
| **GPE** | 555 | Geo-political entities (countries, cities, states) |
| **NORP** | 176 | Nationalities, religious/political groups |
| **PRODUCT** | 165 | Objects, vehicles, foods |
| **QUANTITY** | 130 | Measurements (weight, distance) |
| **FAC** | 120 | Facilities (buildings, airports, etc.) |
| **WORK_OF_ART** | 96 | Titles of books, songs, etc. |
| **LOC** | 87 | Non-GPE locations (mountains, bodies of water) |
| **TIME** | 70 | Times smaller than a day |
| **ORDINAL** | 49 | "first", "second", etc. |
| **MONEY** | 38 | Monetary values |
| **LAW** | 35 | Named documents made into laws |
| **EVENT** | 22 | Named events (battles, wars, sports) |
| **PERCENT** | 8 | Percentages |
| **LANGUAGE** | 6 | Named languages |

## Files Generated

### Entity Lists by Type

**Primary Categories:**
- `people.txt` - 5,262 unique person names
- `places_gpe.txt` - 555 unique countries, cities, states
- `places_loc.txt` - 87 unique other locations
- `organizations.txt` - 1,932 unique organizations

**Other Categories:**
- `dates.txt` - 1,191 unique dates
- `events.txt` - 22 unique events
- `nationalities.txt` - 176 unique nationalities/groups
- `facilities.txt` - 120 unique buildings/facilities
- `languages.txt` - 6 unique languages
- `works_of_art.txt` - 96 unique titles

**Combined:**
- `all_entities.txt` - All entities organized by type
- `summary.txt` - Statistics overview

## Sample Entities

### People (PERSON)
```
Aase Holm
Agnes Holm
Aksel Holm
Alma Wilson
Anna Lovise
Axel Holm
```

### Places (GPE)
```
America
Boston
Dell Rapids
Norway
Oslo
Trondheim
```

### Events
```
Golden Anniversary
New Year
Norway's Constitution Day
WW II
War
the War in Stjørdal
```

### Languages
```
English
Haakon
Norge (likely misclassified)
```

## Data Quality Notes

### Strengths
✓ Accurately identifies major people, places, and organizations
✓ Captures Norwegian names and places correctly
✓ Extracts temporal information (dates, events)
✓ Identifies relationships (nationalities, groups)

### Limitations
⚠ Some Norwegian words misclassified as entities
⚠ HTML artifacts occasionally included
⚠ Phrases sometimes captured instead of single entities
⚠ Context-dependent accuracy (names vs. common words)

### Why These Occur
- Model trained on English text, Norwegian text creates ambiguity
- Letters contain mixed Norwegian/English content
- Translator notes and metadata included in extraction
- Some entities are context-dependent

## Code

### `extract_entities.py`
Main extraction script that:
1. Loads spaCy English model
2. Reads all letter JSON files
3. Extracts and cleans text from metadata
4. Applies NER to identify entities
5. Collects unique entities by type
6. Saves to organized text files

### Usage
```bash
cd /Users/kml8/shell/shoebox/explore/ner
source venv/bin/activate
python3 extract_entities.py
```

## Virtual Environment

The `venv/` directory contains:
- Python virtual environment
- spaCy library installation
- en_core_web_sm language model

To recreate:
```bash
python3 -m venv venv
source venv/bin/activate
pip install spacy
python3 -m spacy download en_core_web_sm
```

## Future Improvements

### 1. Norwegian NER Model
Use a Norwegian-trained spaCy model for better accuracy on Norwegian text:
```bash
python3 -m spacy download nb_core_news_sm
```

### 2. Post-Processing Filters
- Filter out common Norwegian words incorrectly classified
- Remove HTML artifacts
- Normalize name variations (e.g., "Alma Wilson" vs "Alma C. Wilson")
- Deduplicate similar entities

### 3. Entity Linking
Link entities to external knowledge bases:
- Geonames for places
- Wikidata for people
- Create relationship graph

### 4. Contextual Extraction
- Extract entities with surrounding context
- Identify relationships between entities
- Group by letter for letter-level entity lists

### 5. Custom NER Training
Train a custom NER model specifically for:
- Norwegian family names
- Norwegian place names
- 1940s-era entities

## Entity Type Reference

### spaCy Entity Labels

**People & Groups:**
- `PERSON` - People, including fictional
- `NORP` - Nationalities, religious or political groups

**Organizations & Places:**
- `ORG` - Companies, agencies, institutions
- `GPE` - Countries, cities, states
- `LOC` - Non-GPE locations
- `FAC` - Buildings, airports, highways, bridges

**Products & Works:**
- `PRODUCT` - Objects, vehicles, foods (not services)
- `WORK_OF_ART` - Titles of books, songs, etc.
- `EVENT` - Named events (hurricanes, battles, sports)

**Numeric & Temporal:**
- `DATE` - Absolute or relative dates
- `TIME` - Times smaller than a day
- `MONEY` - Monetary values
- `PERCENT` - Percentages
- `QUANTITY` - Measurements
- `CARDINAL` - Numerals
- `ORDINAL` - "first", "second", etc.

**Other:**
- `LANGUAGE` - Named languages
- `LAW` - Named documents made into laws

## Resources

- [spaCy Documentation](https://spacy.io/)
- [spaCy NER Guide](https://spacy.io/usage/linguistic-features#named-entities)
- [Entity Type List](https://github.com/explosion/spaCy/discussions/9147)
- [Training Custom NER](https://spacy.io/usage/training)
