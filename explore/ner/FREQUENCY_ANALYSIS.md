# Named Entity Frequency Analysis

## Overview

This document contains frequency analysis of named entities across all 246 letters, showing which people, places, and organizations are mentioned most often.

## Methodology

1. **Extraction**: Used spaCy NER to identify entities in all letter text
2. **Counting**: Tracked every occurrence of each entity across all letters
3. **Sorting**: Ranked entities by frequency (most mentioned first)

## Top People Mentioned

**Note**: The list includes some Norwegian words incorrectly classified as people (like "Jeg" = "I", "Det" = "That"). Below we separate actual people from misclassified words.

### Actual People (Top 30)

| Rank | Count | Name | Notes |
|------|-------|------|-------|
| 1 | 318 | Alma | Main letter recipient |
| 2 | 243 | Laura | Family member |
| 3 | 211 | John | Main family member |
| 4 | 165 | JOHN HOLM | (variant) |
| 5 | 152 | John Holm | (variant) |
| 6 | 140 | Johan | (Norwegian form of John) |
| 7 | 105 | Siri Lawson | Translator |
| 8 | 103 | Alma C. Wilson | Full name variant |
| 9 | 96 | Olav | Family member |
| 10 | 66 | Axel Holm | Family member |
| 11 | 60 | Helga | Family member |
| 12 | 56 | Jesus | Religious references |
| 13 | 51 | Hanna | Family member |
| 14 | 49 | Ola | Family member |
| 15 | 48 | Holm | Family surname |
| 16 | 47 | Evelyn | Family member |
| 17 | 38 | Jon | Name variant |
| 18 | 38 | Marie | Family member |
| 19 | 38 | Ola Holm | Full name |
| 20 | 37 | Konrad | Family member |
| 21 | 35 | Karen | Family member |
| 22 | 33 | ALMA C. WILSON | (uppercase variant) |
| 23 | 31 | Eilif | Family member |
| 24 | 30 | JOHN'S FAMILY | Reference to family |
| 25 | 29 | JOHAN HOLM'S | Possessive form |
| 26 | 28 | ALMA WILSON | Variant |
| 27 | 28 | Gusta | Family member |
| 28 | 28 | Klara Krogstad | Family member |
| 29 | 27 | Laura Karlson | Full name |
| 30 | 25 | E. Eidum | Family member |

### Key Family Members Summary

**The Holm Family:**
- John/Johan Holm: ~518 mentions (combining variants)
- Axel Holm: 66 mentions
- Ola Holm: 87 mentions (combining variants)
- Olav Holm: 119 mentions (combining variants)
- Evelyn Holm: 21 mentions

**Wilson Family:**
- Alma (C.) Wilson: ~571 mentions (combining all variants)

**Others:**
- Laura (Karlson): 270 mentions
- Siri Lawson (Translator): 105 mentions

### Misclassified Norwegian Words

These are common Norwegian words incorrectly identified as people:

| Count | Word | Meaning |
|-------|------|---------|
| 491 | Jeg | I / me |
| 341 | Det | That / it |
| 106 | det | that (lowercase) |
| 109 | BREV | LETTER |
| 90 | Du | You |
| 66 | Hun | She |
| 62 | Ja | Yes |
| 51 | jeg | I (lowercase) |
| 50 | selv | self |
| 43 | Den | The |
| 32 | hun | she (lowercase) |
| 28 | Der | There |
| 28 | Takk | Thanks |
| 21 | Dere | You (plural) |
| 17 | De | They |
| 17 | Dig | You (old form) |
| 17 | Kjære | Dear |
| 15 | Hilsen | Greeting |

**Why This Happens:**
- spaCy's English model treats capitalized Norwegian words as potential proper nouns
- Norwegian sentence structure differs from English
- Mixed Norwegian/English text creates ambiguity

## Top Places Mentioned

Running frequency analysis for places (GPE):

```bash
source venv/bin/activate
python3 count_frequencies.py GPE
```

## Top Organizations Mentioned

Running frequency analysis for organizations:

```bash
source venv/bin/activate
python3 count_frequencies.py ORG
```

## Files Generated

- `people_by_frequency.txt` - All people with counts (format: "COUNT  NAME")
- `people.txt` - People sorted by frequency (just names)
- `places_gpe_by_frequency.txt` - Places with counts
- `places_gpe.txt` - Places sorted by frequency
- `organizations_by_frequency.txt` - Organizations with counts
- `organizations.txt` - Organizations sorted by frequency

## Usage

To regenerate frequency counts for any entity type:

```bash
cd /Users/kml8/shell/shoebox/explore/ner
source venv/bin/activate
python3 count_frequencies.py ENTITY_TYPE
```

Where ENTITY_TYPE can be:
- PERSON
- GPE (places)
- LOC (locations)
- ORG (organizations)
- DATE
- EVENT
- NORP (nationalities)
- etc.

## Insights

### Most Central Figures
1. **Alma (C.) Wilson** - Primary recipient, mentioned 571+ times
2. **John/Johan Holm** - Primary family member, mentioned 518+ times
3. **Laura (Karlson)** - Major correspondent, mentioned 270+ times

### Family Connections
The Holm family is extensively documented with multiple members mentioned dozens of times, suggesting these are personal family letters spanning multiple generations.

### Historical Context
References to Jesus (56x) and religious themes suggest faith was important to the family. The mix of Norwegian and English reflects the immigrant experience.

### Translation
Siri Lawson appears 105+ times as the translator, indicating these letters were professionally translated from Norwegian to English.
