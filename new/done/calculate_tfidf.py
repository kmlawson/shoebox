#!/usr/bin/env python3
"""
Calculate TF-IDF scores for all letters in the corpus.
For each letter, identifies the top 15 terms with highest TF-IDF scores.

TF-IDF Formula:
  TF-IDF(term, document) = TF(term, document) × IDF(term)

  Where:
  - TF = (count of term in document) / (total terms in document)
  - IDF = log(total documents / documents containing term)
"""

import json
import re
import math
from collections import defaultdict, Counter

def load_stopwords(filepath):
    """Load stopwords from a text file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return set(line.strip().lower() for line in f if line.strip())
    except FileNotFoundError:
        print(f"Warning: {filepath} not found, using empty stopword list")
        return set()

def extract_text(letter, language='norwegian'):
    """Extract text from a letter in the specified language."""
    text_array = letter.get('metadata', {}).get('Text', [])
    if not text_array:
        return ''

    full_text = text_array[0]
    parts = full_text.split('<-SPLITTLETTER->')

    if language == 'norwegian':
        return parts[0] if len(parts) > 0 else ''
    else:
        return parts[1] if len(parts) > 1 else ''

def tokenize(text):
    """Tokenize text into words."""
    # Convert to lowercase
    text = text.lower()
    # Remove non-word characters but keep Norwegian letters
    text = re.sub(r'[^\w\sæøåÆØÅ-]', ' ', text)
    # Split on whitespace and filter empty strings
    words = [w for w in text.split() if len(w) > 0]
    return words

def calculate_tf(term_counts, total_terms):
    """Calculate term frequency for all terms in a document."""
    if total_terms == 0:
        return {}
    return {term: count / total_terms for term, count in term_counts.items()}

def calculate_idf(term, doc_count, total_docs):
    """Calculate inverse document frequency for a term."""
    if doc_count == 0:
        return 0
    return math.log(total_docs / doc_count)

def calculate_tfidf_scores(letters_data, language='norwegian', stopwords=None):
    """
    Calculate TF-IDF scores for all letters.

    Args:
        letters_data: Dictionary of letter data
        language: 'norwegian' or 'english'
        stopwords: Set of stopwords to exclude

    Returns:
        Dictionary mapping letter IDs to list of (term, tfidf_score) tuples
    """
    if stopwords is None:
        stopwords = set()

    # Step 1: Process all documents and build document frequency counts
    documents = {}  # letter_id -> list of terms
    document_frequency = defaultdict(int)  # term -> number of documents containing it

    print(f"  Processing documents for {language}...")
    for letter in letters_data:
        letter_id = str(letter.get('id', ''))
        text = extract_text(letter, language)
        if not text:
            continue

        # Tokenize and filter stopwords
        terms = [term for term in tokenize(text) if term not in stopwords]

        if not terms:
            continue

        documents[letter_id] = terms

        # Count unique terms for document frequency
        unique_terms = set(terms)
        for term in unique_terms:
            document_frequency[term] += 1

    total_docs = len(documents)
    print(f"  Found {total_docs} documents with text")
    print(f"  Unique terms: {len(document_frequency)}")

    # Step 2: Calculate TF-IDF for each document
    results = {}

    for letter_id, terms in documents.items():
        # Calculate term frequencies for this document
        term_counts = Counter(terms)
        total_terms = len(terms)
        tf_scores = calculate_tf(term_counts, total_terms)

        # Calculate TF-IDF scores
        tfidf_scores = {}
        for term, tf in tf_scores.items():
            idf = calculate_idf(term, document_frequency[term], total_docs)
            tfidf_scores[term] = tf * idf

        # Sort by TF-IDF score (descending)
        sorted_terms = sorted(tfidf_scores.items(), key=lambda x: x[1], reverse=True)
        results[letter_id] = sorted_terms

    return results

def main():
    print("=== TF-IDF Calculator for Norwegian Letters ===")
    print("Using pure Python implementation (no dependencies)\n")

    # Load letters data
    print("Loading letters.json...")
    with open('../letters.json', 'r', encoding='utf-8') as f:
        letters_data = json.load(f)

    print(f"Loaded {len(letters_data)} letters\n")

    # Load stopwords
    print("Loading stopwords...")
    norwegian_stopwords = load_stopwords('stop.txt')
    print(f"Loaded {len(norwegian_stopwords)} Norwegian stopwords from stop.txt")

    english_stopwords = load_stopwords('stop_en.txt')
    print(f"Loaded {len(english_stopwords)} English stopwords from stop_en.txt")

    # Additional base Norwegian stopwords
    base_norwegian_stopwords = {
        'og', 'i', 'jeg', 'det', 'at', 'en', 'et', 'den', 'til', 'er', 'som', 'på',
        'de', 'med', 'han', 'av', 'ikke', 'der', 'så', 'var', 'meg', 'seg', 'men',
        'ett', 'har', 'om', 'vi', 'min', 'mitt', 'ha', 'hadde', 'hun', 'nå', 'over',
        'da', 'ved', 'fra', 'du', 'ut', 'sin', 'dem', 'oss', 'opp', 'man', 'kan',
        'hans', 'hvor', 'eller', 'hva', 'skal', 'selv', 'sjøl', 'her', 'alle', 'vil',
        'bli', 'ble', 'blitt', 'kunne', 'inn', 'når', 'være', 'kom', 'noen', 'noe',
        'ville', 'dere', 'deres', 'kun', 'ja', 'etter', 'ned', 'skulle',
        'denne', 'for', 'deg', 'si', 'sine', 'sitt', 'mot', 'å', 'meget', 'hvordan',
        'hennes', 'dette', 'bare', 'også', 'mer', 'enn', 'før', 'mellom', 'under',
        'både', 'samme', 'siden'
    }

    # Additional base English stopwords
    base_english_stopwords = {
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
        'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
        'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
        'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
        'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
        'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
        'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
        'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
        'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
        'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has',
        'had', 'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being'
    }

    all_norwegian_stopwords = norwegian_stopwords | base_norwegian_stopwords
    all_english_stopwords = english_stopwords | base_english_stopwords

    print(f"Total Norwegian stopwords: {len(all_norwegian_stopwords)}")
    print(f"Total English stopwords: {len(all_english_stopwords)}\n")

    # Calculate TF-IDF for Norwegian text
    print("Calculating TF-IDF for Norwegian text...")
    norwegian_results = calculate_tfidf_scores(
        letters_data,
        language='norwegian',
        stopwords=all_norwegian_stopwords
    )
    print(f"Completed Norwegian analysis\n")

    # Calculate TF-IDF for English text
    print("Calculating TF-IDF for English text...")
    english_results = calculate_tfidf_scores(
        letters_data,
        language='english',
        stopwords=all_english_stopwords
    )
    print(f"Completed English analysis\n")

    # Prepare output data for both languages
    print("Preparing output files...")
    norwegian_output = {}
    english_output = {}

    for letter in letters_data:
        letter_id = str(letter.get('id', ''))
        # Get letter metadata
        metadata = letter.get('metadata', {})
        title = metadata.get('Title', ['Unknown'])[0]
        date = metadata.get('Date', ['Unknown'])[0]
        creator = metadata.get('Creator', ['Unknown'])[0]

        # Norwegian results
        if letter_id in norwegian_results:
            top_terms_no = norwegian_results[letter_id][:15]
            norwegian_output[letter_id] = {
                'title': title,
                'date': date,
                'creator': creator,
                'top_tfidf_terms': [
                    {'term': term, 'score': float(score)}
                    for term, score in top_terms_no
                ]
            }

        # English results
        if letter_id in english_results:
            top_terms_en = english_results[letter_id][:15]
            english_output[letter_id] = {
                'title': title,
                'date': date,
                'creator': creator,
                'top_tfidf_terms': [
                    {'term': term, 'score': float(score)}
                    for term, score in top_terms_en
                ]
            }

    # Save Norwegian results to JSON
    no_output_file = 'tfidf_norwegian.json'
    with open(no_output_file, 'w', encoding='utf-8') as f:
        json.dump(norwegian_output, f, ensure_ascii=False, indent=2)
    print(f"✓ Norwegian results saved to {no_output_file}")

    # Save English results to JSON
    en_output_file = 'tfidf_english.json'
    with open(en_output_file, 'w', encoding='utf-8') as f:
        json.dump(english_output, f, ensure_ascii=False, indent=2)
    print(f"✓ English results saved to {en_output_file}")

    # Create Norwegian summary CSV
    no_csv_file = 'tfidf_norwegian.csv'
    with open(no_csv_file, 'w', encoding='utf-8') as f:
        f.write('Letter ID,Title,Date,Creator,Top Terms (comma-separated)\n')
        for letter_id in sorted(norwegian_output.keys(), key=lambda x: int(x)):
            data = norwegian_output[letter_id]
            top_terms_str = ', '.join([
                f"{item['term']}({item['score']:.3f})"
                for item in data['top_tfidf_terms'][:10]
            ])
            title = data['title'].replace('"', '""')
            creator = data['creator'].replace('"', '""')
            f.write(f'{letter_id},"{title}",{data["date"]},"{creator}","{top_terms_str}"\n')
    print(f"✓ Norwegian summary saved to {no_csv_file}")

    # Create English summary CSV
    en_csv_file = 'tfidf_english.csv'
    with open(en_csv_file, 'w', encoding='utf-8') as f:
        f.write('Letter ID,Title,Date,Creator,Top Terms (comma-separated)\n')
        for letter_id in sorted(english_output.keys(), key=lambda x: int(x)):
            data = english_output[letter_id]
            top_terms_str = ', '.join([
                f"{item['term']}({item['score']:.3f})"
                for item in data['top_tfidf_terms'][:10]
            ])
            title = data['title'].replace('"', '""')
            creator = data['creator'].replace('"', '""')
            f.write(f'{letter_id},"{title}",{data["date"]},"{creator}","{top_terms_str}"\n')
    print(f"✓ English summary saved to {en_csv_file}")

    # Print examples
    print("\n=== Example: Letter 1 (Norwegian) ===")
    if '1' in norwegian_output:
        example = norwegian_output['1']
        print(f"Title: {example['title']}")
        print(f"Date: {example['date']}")
        print(f"Creator: {example['creator']}")
        print(f"\nTop 15 TF-IDF terms:")
        for i, item in enumerate(example['top_tfidf_terms'], 1):
            print(f"  {i:2d}. {item['term']:20s} (score: {item['score']:.4f})")

    print("\n=== Example: Letter 1 (English) ===")
    if '1' in english_output:
        example = english_output['1']
        print(f"Title: {example['title']}")
        print(f"Date: {example['date']}")
        print(f"Creator: {example['creator']}")
        print(f"\nTop 15 TF-IDF terms:")
        for i, item in enumerate(example['top_tfidf_terms'], 1):
            print(f"  {i:2d}. {item['term']:20s} (score: {item['score']:.4f})")

    print("\n=== Statistics ===")
    print(f"Norwegian letters analyzed: {len(norwegian_output)}")
    print(f"English letters analyzed: {len(english_output)}")

    if norwegian_output:
        avg_no = sum(len(data['top_tfidf_terms']) for data in norwegian_output.values()) / len(norwegian_output)
        print(f"Average unique terms per Norwegian letter: {avg_no:.1f}")

    if english_output:
        avg_en = sum(len(data['top_tfidf_terms']) for data in english_output.values()) / len(english_output)
        print(f"Average unique terms per English letter: {avg_en:.1f}")

    print("\n✓ Done!")

if __name__ == '__main__':
    main()
