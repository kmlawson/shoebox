#!/usr/bin/env node

/**
 * Build TXT Archive Script
 *
 * This script generates a ZIP archive containing all letters in TXT format,
 * organized in two folders: Norwegian and English.
 *
 * Usage:
 *   node build-txt-archive.js
 *
 * Output:
 *   ../letters-txt.zip
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { pipeline } = require('stream');
const pipelineAsync = promisify(pipeline);

// Check if JSZip is available
let JSZip;
try {
  JSZip = require('jszip');
} catch (error) {
  console.error('Error: JSZip not installed. Please run:');
  console.error('  npm install jszip');
  process.exit(1);
}

// Paths
const LETTERS_JSON_PATH = path.join(__dirname, '..', 'letters.json.gz');
const LETTERS_JSON_UNCOMPRESSED = path.join(__dirname, '..', 'letters.json');
const OUTPUT_ZIP = path.join(__dirname, '..', 'letters-txt.zip');

/**
 * Load letters data from JSON file
 */
async function loadLettersData() {
  console.log('Loading letters data...');

  let jsonPath;

  // Try compressed version first
  if (fs.existsSync(LETTERS_JSON_PATH)) {
    console.log('Found compressed letters.json.gz');
    const zlib = require('zlib');
    const data = fs.readFileSync(LETTERS_JSON_PATH);
    const decompressed = zlib.gunzipSync(data);
    return JSON.parse(decompressed.toString('utf-8'));
  }

  // Try uncompressed version
  if (fs.existsSync(LETTERS_JSON_UNCOMPRESSED)) {
    console.log('Found uncompressed letters.json');
    const data = fs.readFileSync(LETTERS_JSON_UNCOMPRESSED, 'utf-8');
    return JSON.parse(data);
  }

  throw new Error('Could not find letters.json or letters.json.gz');
}

/**
 * Format letter metadata as text header
 */
function formatLetterHeader(letter) {
  const metadata = letter.metadata || {};

  const title = (metadata.Title && metadata.Title[0]) || `Letter ${letter.id}`;
  const date = (metadata.Date && metadata.Date[0]) || 'Date unknown';
  const creator = (metadata.Creator && metadata.Creator[0]) || 'Creator unknown';
  const location = (metadata.Location && metadata.Location[0]) || '';
  const destination = (metadata.Destination && metadata.Destination[0]) || '';
  const tags = metadata.Tags || [];

  let header = '';
  header += '='.repeat(70) + '\n';
  header += title + '\n';
  header += '='.repeat(70) + '\n';
  header += '\n';
  header += `Date: ${date}\n`;
  header += `From: ${creator}\n`;

  if (location) {
    header += `Location: ${location}\n`;
  }

  if (destination) {
    header += `Destination: ${destination}\n`;
  }

  if (tags.length > 0) {
    header += `Tags: ${tags.join(', ')}\n`;
  }

  header += '\n';

  return header;
}

/**
 * Split text by language tags
 * Returns { norwegian: string, english: string }
 */
function splitByLanguage(text, splitTag) {
  if (!text) return { norwegian: '', english: '' };

  const parts = text.split(splitTag);

  if (parts.length === 2) {
    // Both languages present
    return {
      norwegian: parts[0].trim(),
      english: parts[1].trim()
    };
  } else {
    // Only one language - check which one by looking for Norwegian characters
    const hasNorwegianChars = /[æøåÆØÅ]/.test(text);
    if (hasNorwegianChars) {
      return { norwegian: text.trim(), english: '' };
    } else {
      return { norwegian: '', english: text.trim() };
    }
  }
}

/**
 * Format letter content as text
 */
function formatLetterContent(letter, language) {
  const metadata = letter.metadata || {};

  let content = '';

  // Add header
  content += formatLetterHeader(letter);

  // Split description by language
  const descriptionRaw = metadata.Description?.[0];
  if (descriptionRaw) {
    const descSplit = splitByLanguage(descriptionRaw, '<-SPLITDESC->');

    if (language === 'norwegian' && descSplit.norwegian) {
      content += 'BESKRIVELSE:\n';
      content += '-'.repeat(70) + '\n';
      content += descSplit.norwegian + '\n';
      content += '\n';
    } else if (language === 'english' && descSplit.english) {
      content += 'DESCRIPTION:\n';
      content += '-'.repeat(70) + '\n';
      content += descSplit.english + '\n';
      content += '\n';
    }
  }

  // Split letter text by language
  const textRaw = metadata.Text?.[0];
  if (textRaw) {
    const textSplit = splitByLanguage(textRaw, '<-SPLITTLETTER->');

    if (language === 'norwegian' && textSplit.norwegian) {
      content += 'NORSK TEKST:\n';
      content += '-'.repeat(70) + '\n';
      content += textSplit.norwegian + '\n';
    } else if (language === 'english' && textSplit.english) {
      content += 'ENGLISH TRANSLATION:\n';
      content += '-'.repeat(70) + '\n';
      content += textSplit.english + '\n';
    }
  }

  content += '\n';
  content += '='.repeat(70) + '\n';

  return content;
}

/**
 * Generate filename for letter
 */
function generateFilename(letter) {
  const metadata = letter.metadata || {};
  const date = (metadata.Date && metadata.Date[0]) || '';
  const creator = (metadata.Creator && metadata.Creator[0]) || '';

  // Extract year from date if available
  let year = '';
  const yearMatch = date.match(/(\d{4})/);
  if (yearMatch) {
    year = yearMatch[1] + '-';
  }

  // Sanitize creator name
  const creatorSafe = creator
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  // Use letter ID padded to 4 digits
  const idPadded = String(letter.id).padStart(4, '0');

  return `${year}${idPadded}-${creatorSafe || 'Unknown'}.txt`;
}

/**
 * Build the ZIP archive
 */
async function buildArchive() {
  console.log('Starting TXT archive build...\n');

  // Load letters data
  const lettersData = await loadLettersData();
  const letters = Object.values(lettersData);

  console.log(`Loaded ${letters.length} letters\n`);

  // Create ZIP
  const zip = new JSZip();

  // Create folders
  const norwegianFolder = zip.folder('norwegian');
  const englishFolder = zip.folder('english');

  let norwegianCount = 0;
  let englishCount = 0;

  // Add letters to appropriate folders
  letters.forEach(letter => {
    const metadata = letter.metadata || {};

    // Split description and text by language
    const descriptionRaw = metadata.Description?.[0] || '';
    const textRaw = metadata.Text?.[0] || '';

    const descSplit = splitByLanguage(descriptionRaw, '<-SPLITDESC->');
    const textSplit = splitByLanguage(textRaw, '<-SPLITTLETTER->');

    // Check if letter has Norwegian content (description OR text)
    const hasNorwegian = descSplit.norwegian || textSplit.norwegian;
    if (hasNorwegian) {
      const filename = generateFilename(letter);
      const content = formatLetterContent(letter, 'norwegian');
      norwegianFolder.file(filename, content);
      norwegianCount++;
    }

    // Check if letter has English content (description OR text)
    const hasEnglish = descSplit.english || textSplit.english;
    if (hasEnglish) {
      const filename = generateFilename(letter);
      const content = formatLetterContent(letter, 'english');
      englishFolder.file(filename, content);
      englishCount++;
    }
  });

  console.log(`Added ${norwegianCount} Norwegian letters`);
  console.log(`Added ${englishCount} English letters\n`);

  // Add README
  const readme = `A Shoebox of Norwegian Letters - Text Archive
${'='.repeat(70)}

This archive contains the letters from "A Shoebox of Norwegian Letters"
in plain text format, organized into two folders:

- norwegian/  - Original Norwegian letters (${norwegianCount} files)
- english/    - English translations (${englishCount} files)

Each file is named with the format:
  YYYY-NNNN-Creator.txt

Where:
  YYYY  - Year (if available)
  NNNN  - Letter ID (4-digit padded)
  Creator - Name of the letter writer

The files contain:
  - Letter title and metadata
  - Description (if available)
  - Letter text

Generated: ${new Date().toISOString()}

For more information, visit:
  https://huginn.net/shoebox/

${'='.repeat(70)}
`;

  zip.file('README.txt', readme);

  // Generate ZIP file
  console.log('Generating ZIP file...');
  const zipContent = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });

  // Write to file
  fs.writeFileSync(OUTPUT_ZIP, zipContent);

  const stats = fs.statSync(OUTPUT_ZIP);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`\n✓ Archive created successfully!`);
  console.log(`  Output: ${OUTPUT_ZIP}`);
  console.log(`  Size: ${fileSizeMB} MB`);
  console.log(`  Norwegian letters: ${norwegianCount}`);
  console.log(`  English letters: ${englishCount}`);
}

// Run the build
buildArchive().catch(error => {
  console.error('Error building archive:', error);
  process.exit(1);
});
