# Shoebox Tools

This directory contains analysis tools and build scripts for "A Shoebox of Norwegian Letters."

## Analysis Tools

Access the web-based analysis tools by opening `index.html` in a web browser:

- **Word Frequency** - Most common words in the corpus
- **Context Explorer** - Find words in context across all letters
- **Word Cloud** - Visual representation of word frequencies
- **Places** - Interactive word cloud of locations mentioned

## Download Options

The tools page provides two download options:

### 1. Letters JSON
Downloads the complete letters database as a single JSON file (`shoebox-letters.json`).

### 2. Letters TXT
Downloads a ZIP archive containing all letters as plain text files, organized into:
- `norwegian/` - Original Norwegian letters
- `english/` - English translations

## Building the TXT Archive

The TXT archive must be pre-built before it can be downloaded. To build it:

### Prerequisites

Install Node.js dependencies:

```bash
cd tools
npm install
```

### Build Command

```bash
npm run build:txt
```

Or directly:

```bash
node build-txt-archive.js
```

This will create `letters-txt.zip` in the parent directory.

### File Naming Convention

Letters are named with the format: `YYYY-NNNN-Creator.txt`

- `YYYY` - Year (if available in metadata)
- `NNNN` - Letter ID (4-digit zero-padded)
- `Creator` - Name of the letter writer (sanitized)

Example: `1945-0123-Axel-Johnson.txt`

### Text File Format

Each text file includes:

```
======================================================================
Letter Title
======================================================================

Date: 1945-06-15
From: Axel Johnson
Location: Oslo, Norway
Destination: Dell Rapids, South Dakota
Tags: Family, WWII, News

DESCRIPTION:
----------------------------------------------------------------------
[Letter description if available]

NORWEGIAN TEXT:
----------------------------------------------------------------------
[Original Norwegian text]

======================================================================
```

## Updating the Archive

If the letters data is updated (in `letters.json` or `letters.json.gz`), simply re-run the build script:

```bash
npm run build:txt
```

The script will:
1. Read the latest letters data
2. Generate formatted text files for each letter
3. Create separate folders for Norwegian and English
4. Bundle everything into a compressed ZIP archive

## Files

- `index.html` - Analysis tools web interface
- `stats.js` - JavaScript for analysis tools
- `stats.css` - Styles for analysis tools
- `stop.txt` - Norwegian stopwords list
- `build-txt-archive.js` - Script to generate TXT archive
- `package.json` - Node.js dependencies
- `README.md` - This file

## Dependencies

- **jszip** (^3.10.1) - For creating ZIP archives in Node.js
