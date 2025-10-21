#!/usr/bin/env python3
"""
Analyze word, bigram, and trigram frequencies in Norwegian letters
Uses NLTK's Norwegian stop words list
"""

import json
import glob
import html
import re
from collections import Counter

def clean_html(text):
    """Remove HTML tags and decode HTML entities"""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    return text

def get_norwegian_stopwords():
    """
    Get Norwegian stop words using NLTK
    If not available, use a comprehensive built-in list
    """
    try:
        import nltk
        try:
            stopwords = set(nltk.corpus.stopwords.words('norwegian'))
            print("✓ Loaded Norwegian stop words from NLTK")
            return stopwords
        except LookupError:
            print("Downloading NLTK Norwegian stopwords...")
            nltk.download('stopwords', quiet=True)
            stopwords = set(nltk.corpus.stopwords.words('norwegian'))
            print("✓ Downloaded and loaded Norwegian stop words from NLTK")
            return stopwords
    except ImportError:
        print("NLTK not available, using built-in Norwegian stop words list")
        # Comprehensive Norwegian stop words list (based on common NLP resources)
        return {
            'og', 'i', 'jeg', 'det', 'at', 'en', 'et', 'den', 'til', 'er',
            'som', 'på', 'de', 'med', 'han', 'av', 'ikke', 'ikkje', 'der',
            'så', 'var', 'meg', 'seg', 'men', 'ett', 'har', 'om', 'vi',
            'min', 'mitt', 'ha', 'hadde', 'hun', 'nå', 'over', 'da', 'ved',
            'fra', 'du', 'ut', 'sin', 'dem', 'oss', 'opp', 'man', 'kan',
            'hans', 'hvor', 'eller', 'hva', 'skal', 'selv', 'sjøl', 'her',
            'alle', 'vil', 'bli', 'ble', 'blei', 'blitt', 'kunne', 'inn',
            'når', 'være', 'kom', 'noen', 'noe', 'ville', 'dere', 'som',
            'deres', 'kun', 'ja', 'etter', 'ned', 'skulle', 'denne',
            'for', 'deg', 'si', 'sine', 'sitt', 'mot', 'å', 'meget',
            'hvorfor', 'dette', 'disse', 'uten', 'hvordan', 'ingen',
            'din', 'ditt', 'blir', 'samme', 'hvilken', 'hvilke', 'sånn',
            'inni', 'mellom', 'vår', 'hver', 'hvem', 'vors', 'hvis',
            'både', 'bare', 'enn', 'fordi', 'før', 'mange', 'også',
            'slik', 'vært', 'være', 'båe', 'begge', 'siden', 'dykk',
            'dykkar', 'dei', 'deira', 'deires', 'deim', 'di', 'då',
            'eg', 'ein', 'eit', 'eitt', 'elles', 'honom', 'hjå', 'ho',
            'hoe', 'henne', 'hennar', 'hennes', 'hoss', 'hossen', 'ikkje',
            'ingi', 'inkje', 'korleis', 'korso', 'kva', 'kvar', 'kvarhelst',
            'kven', 'kvi', 'kvifor', 'me', 'medan', 'mi', 'mine', 'mykje',
            'no', 'nokon', 'noka', 'nokor', 'noko', 'nokre', 'si', 'sia',
            'sidan', 'so', 'somt', 'somme', 'um', 'upp', 'vere', 'vore',
            'verte', 'vort', 'varte', 'vart', 'av', 'all', 'alt', 'aldri'
        }

def normalize_word(word):
    """Normalize a word for frequency counting"""
    # Convert to lowercase
    word = word.lower()
    # Remove punctuation from ends
    word = word.strip('.,!?;:"\'-()[]{}')
    return word

def tokenize_text(text):
    """Extract words from text"""
    # Split on whitespace and common punctuation
    words = re.findall(r'\b[\w\-]+\b', text.lower())
    return words

def extract_all_norwegian_text():
    """Extract all text from Norwegian letters"""
    letter_files = sorted(glob.glob('norwegian_letters/*.json'))
    print(f"Processing {len(letter_files)} Norwegian letters...\n")

    all_text = []
    count = 0

    for filepath in letter_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            letter = json.load(f)

        # Extract text from Text field
        if 'Text' in letter['metadata']:
            for text_value in letter['metadata']['Text']:
                if text_value:
                    cleaned = clean_html(text_value)
                    all_text.append(cleaned)

        # Extract text from Description field
        if 'Description' in letter['metadata']:
            for desc_value in letter['metadata']['Description']:
                if desc_value:
                    cleaned = clean_html(desc_value)
                    all_text.append(cleaned)

        count += 1
        if count % 25 == 0:
            print(f"Processed {count} letters...")

    print(f"\n✓ Processed all {count} letters")
    combined_text = ' '.join(all_text)
    print(f"Total text length: {len(combined_text):,} characters\n")

    return combined_text

def analyze_frequencies(text, stopwords):
    """Analyze word, bigram, and trigram frequencies"""

    print("Tokenizing text...")
    words = tokenize_text(text)
    print(f"Total tokens: {len(words):,}\n")

    # Filter out stop words and normalize
    print("Filtering stop words...")
    words_normalized = [normalize_word(w) for w in words]
    words_filtered = [w for w in words_normalized if w and w not in stopwords and len(w) > 1]
    print(f"Tokens after filtering: {len(words_filtered):,}\n")

    # Word frequencies
    print("Calculating word frequencies...")
    word_freq = Counter(words_filtered)
    print(f"Unique words: {len(word_freq):,}\n")

    # Bigrams (using filtered words)
    print("Calculating bigram frequencies...")
    bigrams = []
    for i in range(len(words_filtered) - 1):
        bigrams.append((words_filtered[i], words_filtered[i+1]))
    bigram_freq = Counter(bigrams)
    print(f"Unique bigrams: {len(bigram_freq):,}\n")

    # Trigrams (using filtered words)
    print("Calculating trigram frequencies...")
    trigrams = []
    for i in range(len(words_filtered) - 2):
        trigrams.append((words_filtered[i], words_filtered[i+1], words_filtered[i+2]))
    trigram_freq = Counter(trigrams)
    print(f"Unique trigrams: {len(trigram_freq):,}\n")

    return word_freq, bigram_freq, trigram_freq

def save_frequencies(word_freq, bigram_freq, trigram_freq):
    """Save frequency lists to files"""

    print("Saving frequency lists...\n")

    # Save word frequencies
    with open('norwegian_word_frequencies.txt', 'w', encoding='utf-8') as f:
        f.write("Norwegian Word Frequencies (excluding stop words)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Total unique words: {len(word_freq):,}\n\n")

        for word, count in word_freq.most_common():
            f.write(f"{count:6d}  {word}\n")

    print(f"✓ Saved norwegian_word_frequencies.txt ({len(word_freq):,} words)")

    # Save bigram frequencies
    with open('norwegian_bigram_frequencies.txt', 'w', encoding='utf-8') as f:
        f.write("Norwegian Bigram Frequencies (excluding stop words)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Total unique bigrams: {len(bigram_freq):,}\n\n")

        for (w1, w2), count in bigram_freq.most_common():
            f.write(f"{count:6d}  {w1} {w2}\n")

    print(f"✓ Saved norwegian_bigram_frequencies.txt ({len(bigram_freq):,} bigrams)")

    # Save trigram frequencies
    with open('norwegian_trigram_frequencies.txt', 'w', encoding='utf-8') as f:
        f.write("Norwegian Trigram Frequencies (excluding stop words)\n")
        f.write("=" * 60 + "\n")
        f.write(f"Total unique trigrams: {len(trigram_freq):,}\n\n")

        for (w1, w2, w3), count in trigram_freq.most_common():
            f.write(f"{count:6d}  {w1} {w2} {w3}\n")

    print(f"✓ Saved norwegian_trigram_frequencies.txt ({len(trigram_freq):,} trigrams)")

def show_top_items(word_freq, bigram_freq, trigram_freq, n=20):
    """Display top N items from each frequency list"""

    print(f"\nTop {n} Words:")
    print("=" * 60)
    for i, (word, count) in enumerate(word_freq.most_common(n), 1):
        print(f"{i:3d}. {count:5d}x  {word}")

    print(f"\nTop {n} Bigrams:")
    print("=" * 60)
    for i, ((w1, w2), count) in enumerate(bigram_freq.most_common(n), 1):
        print(f"{i:3d}. {count:5d}x  {w1} {w2}")

    print(f"\nTop {n} Trigrams:")
    print("=" * 60)
    for i, ((w1, w2, w3), count) in enumerate(trigram_freq.most_common(n), 1):
        print(f"{i:3d}. {count:5d}x  {w1} {w2} {w3}")

def main():
    print("Norwegian Word Frequency Analysis")
    print("=" * 60)
    print()

    # Get stop words
    stopwords = get_norwegian_stopwords()
    print(f"Stop words loaded: {len(stopwords)}\n")

    # Extract text
    text = extract_all_norwegian_text()

    # Analyze frequencies
    word_freq, bigram_freq, trigram_freq = analyze_frequencies(text, stopwords)

    # Save to files
    save_frequencies(word_freq, bigram_freq, trigram_freq)

    # Display top items
    show_top_items(word_freq, bigram_freq, trigram_freq, 20)

    print("\n✓ Analysis complete!")

if __name__ == '__main__':
    main()
