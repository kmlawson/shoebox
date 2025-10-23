# Text Analysis Tool Implementation Plans
## A Shoebox of Norwegian Letters

This document outlines detailed implementation plans for text analysis tools to enhance the Shoebox digital archive. Tools are organized by implementation complexity and utilize the existing letters corpus (248 letters, 1911-1956, bilingual Norwegian-English).

**Corpus Characteristics:**
- 248 letters with bilingual content (Norwegian/English split via tags)
- Rich metadata: Date, Creator, Location, Destination, Tags
- Temporal span: 45 years (1911-1956)
- Key historical periods: WWI, interwar, WWII, post-war
- Correspondence network between Norway and USA (primarily Dell Rapids, SD)

---

## Quick Wins (High Value, Easier Implementation)

### 1. Timeline Visualization

**Purpose:** Visualize letter frequency and distribution patterns over the 45-year correspondence period

**Data Sources:**
- `metadata.Date` field for temporal information
- Letter counts aggregated by year/month
- Optional: `metadata.Creator`, `metadata.Tags` for filtering

**Implementation Approach:**

1. **Date Parsing & Normalization**
   - Parse various date formats in `metadata.Date[0]`
   - Handle partial dates (year only, year-month only)
   - Extract year for yearly aggregation
   - Extract year-month for monthly resolution

2. **Aggregation Logic**
   ```javascript
   // Group letters by year
   const lettersByYear = {};
   letters.forEach(letter => {
     const year = extractYear(letter.metadata.Date[0]);
     if (!lettersByYear[year]) lettersByYear[year] = [];
     lettersByYear[year].push(letter);
   });
   ```

3. **Visualization Options**
   - **Bar chart**: Letters per year (D3.js)
   - **Line chart**: Trend over time with smoothing
   - **Interactive timeline**: Click to filter letters by period
   - **Heatmap**: Month × Year grid showing intensity

4. **Interactive Features**
   - Filter by creator (show only letters from specific person)
   - Filter by location (Norway vs. USA)
   - Filter by tag (show only WWII-related, family matters, etc.)
   - Click bar/point to see letters from that period
   - Hover to show letter count and date range

5. **Historical Context Overlay**
   - Add annotation markers for key events:
     - 1914-1918: WWI
     - 1929: Great Depression begins
     - 1939-1945: WWII
     - Show how correspondence patterns relate to events

**Technical Requirements:**
- D3.js v7 (already in use for word clouds)
- Date parsing utilities (JavaScript Date or moment.js)
- Responsive SVG visualization

**Expected Insights:**
- Identify gaps in correspondence (war years?)
- Understand communication frequency patterns
- See impact of historical events on letter writing
- Find periods of intense family communication

**Difficulty:** Easy
**Estimated Implementation Time:** 4-6 hours

---

### 2. Collocation Explorer

**Purpose:** Discover significant word pairs and phrases that occur together, revealing idiomatic expressions, recurring themes, and semantic relationships

**Data Sources:**
- Split text by language: `splitByLanguage(metadata.Text[0], '<-SPLITTLETTER->')`
- Both Norwegian and English texts available
- Stop words list (already have `stop.txt` for Norwegian)

**Implementation Approach:**

1. **N-gram Generation**
   ```javascript
   function generateNgrams(text, n) {
     const words = tokenize(text);
     const ngrams = [];
     for (let i = 0; i <= words.length - n; i++) {
       ngrams.push(words.slice(i, i + n).join(' '));
     }
     return ngrams;
   }
   ```

2. **Bigram & Trigram Analysis**
   - Generate all bigrams (2-word sequences)
   - Generate all trigrams (3-word sequences)
   - Count frequencies across corpus
   - Apply stop word filtering intelligently (not both words)

3. **Statistical Significance Testing**
   - **Pointwise Mutual Information (PMI)**
     ```
     PMI(word1, word2) = log(P(word1, word2) / (P(word1) × P(word2)))
     ```
   - **Log-Likelihood Ratio**: Compare observed vs. expected frequencies
   - **Chi-square statistic**: Test independence of word co-occurrence
   - Filter for statistically significant collocations only

4. **Windowed Collocation**
   - Not just adjacent words, but words within N positions
   - User selectable window size (±2, ±5, ±10 words)
   - Example: Words frequently appearing within 5 words of "Christmas"

5. **Visualization Options**
   - **Table view**: Ranked list of collocations with scores
   - **Network graph**: Nodes = words, edges = collocation strength
   - **Bar chart**: Top N collocations by PMI score
   - **Comparison mode**: Norwegian vs. English collocations

6. **Interactive Features**
   - Filter by time period (compare decades)
   - Filter by correspondent
   - Click collocation to see all contexts (link to Context Explorer)
   - Minimum frequency threshold slider
   - Toggle between bigrams/trigrams/quadgrams

**Technical Requirements:**
- N-gram generation function
- PMI/log-likelihood calculation
- D3.js for network visualization
- Integrate with existing Context Explorer for drill-down

**Expected Insights:**
- Discover Norwegian idioms and fixed phrases
- Identify recurring topics (family names + activities)
- Find characteristic expressions of different writers
- Understand semantic relationships in correspondence

**Difficulty:** Medium
**Estimated Implementation Time:** 8-12 hours

---

### 3. Letter Similarity Finder

**Purpose:** Find letters similar to a given letter based on content, enabling discovery of thematically related correspondence

**Data Sources:**
- Full text content from both Norwegian and English versions
- Metadata for display (title, date, creator)
- Existing word frequency infrastructure

**Implementation Approach:**

1. **Vector Space Model (TF-IDF)**
   - Convert each letter to TF-IDF vector
   - Each dimension = unique word in corpus
   - Value = TF-IDF score (already have this calculation)
   ```javascript
   // TF-IDF for word w in document d
   tfidf(w, d) = tf(w, d) × log(N / df(w))
   // where N = total documents, df = docs containing w
   ```

2. **Similarity Calculation**
   - **Cosine similarity** between document vectors
   ```javascript
   cosineSimilarity(vecA, vecB) =
     dotProduct(vecA, vecB) / (magnitude(vecA) × magnitude(vecB))
   ```
   - Results range from 0 (unrelated) to 1 (identical)
   - Pre-compute similarity matrix for all letter pairs

3. **"More Like This" Interface**
   - When viewing any letter, show N most similar letters
   - Display similarity score, date, creator
   - Show shared keywords highlighting why similar
   - Click to navigate to similar letter

4. **Similarity Search**
   - Input: Letter ID or search query
   - Output: Ranked list of similar letters
   - Show snippet of shared content
   - Visual similarity score (progress bar/percentage)

5. **Clustering Visualization**
   - Use hierarchical clustering or k-means on similarity matrix
   - Create dendrogram showing letter relationships
   - Or use t-SNE/UMAP for 2D projection
   - Interactive: hover shows letter title, click to view

6. **Advanced Features**
   - **Time-aware similarity**: Weight by temporal proximity
   - **Creator-aware**: Find similar letters from same person
   - **Topic-focused**: Similarity based on specific keywords
   - **Cross-language**: Compare Norwegian letter to English translations

**Technical Requirements:**
- TF-IDF vectorization (leverage existing frequency code)
- Cosine similarity calculation
- Matrix operations (or use simple loops for 248 letters)
- Optional: D3.js force-directed graph for clusters
- Optional: t-SNE.js for dimensionality reduction

**Data Storage:**
- Pre-compute similarity matrix (248×248 = 61,504 values)
- Store as JSON: `{ "16": {"21": 0.73, "133": 0.42, ...}, ...}`
- Build once, load on demand

**Expected Insights:**
- Discover thematic connections across time
- Find letters discussing similar events/people
- Trace evolution of recurring topics
- Identify letters worth comparing for research

**Difficulty:** Medium
**Estimated Implementation Time:** 10-14 hours

---

## Medium Complexity Tools

### 4. Sentiment Timeline

**Purpose:** Track emotional tone of letters over time, revealing how sentiment varied across historical periods and personal circumstances

**Data Sources:**
- Letter text (English translations for better lexicon coverage)
- `metadata.Date` for temporal ordering
- Sentiment lexicons (AFINN, Bing, or NRC)

**Implementation Approach:**

1. **Sentiment Lexicon Selection**
   - **AFINN lexicon**: Words scored -5 (most negative) to +5 (most positive)
     - ~2,500 English words
     - Example: "excellent" = +3, "terrible" = -3
   - **Bing lexicon**: Binary positive/negative classification
     - ~6,800 words
     - Simpler but less nuanced
   - **NRC Emotion Lexicon**: 8 emotions + positive/negative
     - Emotions: anger, fear, anticipation, trust, surprise, sadness, joy, disgust
     - Allows richer emotional analysis

2. **Letter Sentiment Scoring**
   ```javascript
   function scoreLetter(text, lexicon) {
     const words = tokenize(text.toLowerCase());
     let totalScore = 0;
     let matchedWords = 0;

     words.forEach(word => {
       if (lexicon[word]) {
         totalScore += lexicon[word]; // AFINN score
         matchedWords++;
       }
     });

     return {
       totalScore,
       avgScore: matchedWords > 0 ? totalScore / matchedWords : 0,
       coverage: matchedWords / words.length
     };
   }
   ```

3. **Temporal Aggregation**
   - Calculate sentiment per letter
   - Aggregate by year/quarter/month
   - Use rolling average (3-month, 6-month window) for smoothing
   - Handle missing data (gaps in correspondence)

4. **Visualization**
   - **Line chart**: Average sentiment over time
   - **Smoothed trend line**: Show overall emotional trajectory
   - **Confidence bands**: Show variance/uncertainty
   - **Dual axis**: Sentiment + letter frequency
   - **Heatmap**: Emotion categories (NRC) × time

5. **Comparative Analysis**
   - **By correspondent**: Compare Axel vs. Alma vs. Ola sentiment patterns
   - **Location-based**: Norway letters vs. USA letters
   - **Historical periods**: Pre-WWII vs. during WWII vs. post-WWII
   - **Statistical testing**: Are differences significant?

6. **Interactive Features**
   - Click point to see letters from that period
   - Hover to show sample positive/negative words
   - Toggle between lexicons (AFINN vs. Bing vs. NRC)
   - Filter by correspondent or location
   - Highlight extreme sentiment letters

7. **Challenges & Mitigations**
   - **Norwegian sentiment**: Limited lexicons available
     - Solution: Use English translations, note limitation
     - Future: Translate Norwegian sentiment lexicon
   - **Historical language**: 1910s-1950s vocabulary may differ
     - Solution: Manually review outliers, adjust lexicon
   - **Context sensitivity**: "Not good" inverts polarity
     - Solution: Basic negation detection (scan for "not", "no", "never" before sentiment words)

**Technical Requirements:**
- Sentiment lexicon files (JSON format)
- Date parsing and aggregation utilities
- D3.js for line charts and heatmaps
- Statistical libraries for confidence intervals (or simple std dev)

**Data Preparation:**
- Download AFINN lexicon: https://github.com/fnielsen/afinn
- Convert to JSON: `{"word": score, ...}`
- Or use Bing: https://www.cs.uic.edu/~liub/FBS/sentiment-analysis.html

**Expected Insights:**
- Emotional impact of WWII on family correspondence
- Compare optimistic vs. difficult periods
- Identify emotionally intense letters
- Understand personal vs. historical mood shifts
- Gender differences in emotional expression (if applicable)

**Difficulty:** Medium
**Estimated Implementation Time:** 12-16 hours

---

### 5. Topic by Correspondent

**Purpose:** Analyze what different correspondents discuss, revealing individual interests, roles in family network, and unique perspectives

**Data Sources:**
- `metadata.Creator` for correspondent identification
- Letter text (both Norwegian and English)
- Existing word frequency infrastructure

**Implementation Approach:**

1. **Correspondent Identification**
   - Extract unique creators from corpus
   - Clean and normalize names (handle variants)
   - Count letters per correspondent
   - Focus on correspondents with ≥3 letters for statistical validity

2. **Vocabulary Analysis per Correspondent**
   ```javascript
   function buildCorrespondentVocabulary(letters, creator) {
     const vocabularyByCreator = {};

     letters.filter(l => l.metadata.Creator[0] === creator)
           .forEach(letter => {
             const words = tokenize(letter.text);
             words.forEach(word => {
               vocabularyByCreator[word] = (vocabularyByCreator[word] || 0) + 1;
             });
           });

     return vocabularyByCreator;
   }
   ```

3. **Distinctive Vocabulary Calculation**
   - Use **TF-IDF** but at correspondent level
     - TF = word frequency in this correspondent's letters
     - IDF = inverse of how many correspondents use this word
   - Or use **Log-Likelihood Ratio** to find overrepresented words
   - Result: Words characteristic of each correspondent

4. **Topic Inference**
   - Cluster distinctive words into themes
   - Manual labeling: "farming", "weather", "family news", "politics", "religion"
   - Or simple keyword matching to predefined categories
   - Count topic frequencies per correspondent

5. **Visualization Options**
   - **Heatmap**: Correspondents (rows) × Topics (columns), intensity = frequency
   - **Word clouds per correspondent**: Sized by distinctiveness
   - **Bar charts**: Top 10 distinctive words per person
   - **Network graph**: Correspondents connected by shared topics
   - **Comparison table**: Side-by-side correspondent profiles

6. **Interactive Features**
   - Click correspondent to see their distinctive words
   - Click word to see which correspondents use it most
   - Filter by time period (how did Axel's topics change over time?)
   - Export correspondent vocabulary profiles
   - Link to actual letters using those words

7. **Statistical Analysis**
   - **Vocabulary size**: Unique words per correspondent
   - **Lexical diversity**: Type-token ratio (TTR) per correspondent
   - **Overlap analysis**: What % of vocabulary shared between pairs?
   - **Evolution**: How does a correspondent's vocabulary change over time?

**Technical Requirements:**
- Extend existing TF-IDF code to correspondent level
- Heatmap visualization (D3.js)
- Word cloud generation (already have)
- Grouping and aggregation utilities

**Expected Insights:**
- Identify specialists (who discusses farming? politics? family?)
- Gender differences in correspondence content
- Location effects (Norway vs. USA topics)
- Personal interests and concerns of each writer
- Evolution of individual correspondents over time

**Difficulty:** Medium
**Estimated Implementation Time:** 10-14 hours

---

## Advanced Tools

### 6. Topic Modeling (LDA)

**Purpose:** Automatically discover latent topics/themes across the entire corpus without predefined categories

**Data Sources:**
- Full letter texts (English for consistency)
- Existing tokenization and stop word filtering
- Metadata for topic distribution analysis

**Implementation Approach:**

1. **Algorithm: Latent Dirichlet Allocation (LDA)**
   - **Assumption**: Each document is a mixture of topics
   - **Assumption**: Each topic is a mixture of words
   - **Goal**: Discover K topics that best explain the corpus
   - K must be specified in advance (try 5-20 topics)

2. **JavaScript Implementation Options**
   - **Option A**: Use existing LDA libraries
     - `lda` npm package (pure JavaScript)
     - Simple but limited features
   - **Option B**: Backend processing
     - Python script using Gensim/scikit-learn
     - Node.js child process to run Python
     - Save results as JSON for frontend
   - **Option C**: Pre-computed topics
     - Run LDA once, save to JSON
     - Tools page loads pre-computed model

3. **Preprocessing for LDA**
   - Tokenize all letters
   - Remove stop words (English + Norwegian lists)
   - Remove very rare words (appear in <3 letters)
   - Remove very common words (appear in >80% of letters)
   - Create document-term matrix

4. **Running LDA**
   ```javascript
   // Using lda npm package
   const lda = require('lda');

   // documents = [[word1, word2, ...], [word1, word3, ...], ...]
   const result = lda(documents, numTopics, numIterations);
   // result[topicIdx] = [[term, probability], ...]
   ```

5. **Topic Interpretation**
   - For each topic, show top 10-20 words
   - Manual labeling: Researcher assigns topic names
     - Example: Topic 1 = "Farming & Weather"
     - Topic 2 = "Family Health & News"
     - Topic 3 = "War & Politics"
   - Or use automatic labeling (most frequent noun/verb pair)

6. **Visualization**
   - **Topic word clouds**: Each topic as separate word cloud
   - **Topic proportions**: Bar chart showing prevalence of each topic
   - **Topic over time**: Line chart showing topic prevalence by year
   - **Document-topic distribution**: Which letters contain which topics?
   - **Interactive topic explorer**: Click topic to see representative letters

7. **Advanced Analysis**
   - **Topic correlation**: Which topics co-occur in letters?
   - **Correspondent-topic affinity**: Which people discuss which topics?
   - **Location-topic patterns**: Norway vs. USA topic differences
   - **Temporal evolution**: How do topics shift over 45 years?

8. **Parameter Tuning**
   - **Number of topics (K)**: Try multiple values, use coherence score
   - **Alpha parameter**: Document-topic density (lower = fewer topics per document)
   - **Beta parameter**: Topic-word density (lower = fewer words per topic)
   - Provide UI to re-run with different parameters

**Technical Requirements:**
- LDA library (JavaScript or Python backend)
- Pre-processing pipeline (tokenization, filtering)
- JSON storage for model output
- D3.js for visualizations
- Possibly Python + Node.js integration

**Data Preparation:**
- Clean corpus: remove headers, standardize format
- Build vocabulary (unique words) → assign integer IDs
- Convert letters to bags-of-words
- Save as document-term matrix

**Expected Insights:**
- Discover main themes in family correspondence
- Understand what topics dominated different eras
- Find letters about specific topics without manual tagging
- Quantify topic distributions across corpus
- Compare automatic topics to human-assigned tags

**Difficulty:** Advanced
**Estimated Implementation Time:** 20-30 hours

---

## Additional Approaches from DH Literature

Based on comprehensive survey of digital humanities text analysis methods (Lawson, "Text Analysis: What Can you Do?"), the following additional tools could enhance the Shoebox archive:

### 7. Dispersion Plots

Lexical dispersion plots visualize where specific words appear throughout a text or corpus, providing quick visual understanding of term distribution across time or documents; particularly useful for tracking mentions of key people, places, or events across the 45-year correspondence span.

### 8. TF-IDF Explorer (Re-enable)

Term Frequency-Inverse Document Frequency identifies distinctive vocabulary in individual letters by comparing word frequency against corpus average; currently hidden in tools interface, should be re-enabled and enhanced with better visualization to help identify what makes each letter unique.

### 9. Lexical Richness Metrics

Calculate Type-Token Ratio (TTR), Hapax Legomena (words occurring only once), and Yule's K to measure vocabulary diversity across correspondents and time periods; reveals education level, language proficiency, and stylistic differences between Norwegian immigrant letter writers.

### 10. Sequence Alignment / Passage Reuse

Detect similar or repeated passages across letters using sequence alignment algorithms from bioinformatics; useful for finding formulaic letter openings/closings, copied news passages, or tracking how same events are described to different recipients.

### 11. Principal Component Analysis (PCA)

Reduce high-dimensional word frequency data to 2-3 principal components for visualization, revealing underlying structural patterns in the corpus; can cluster similar letters, identify outliers, and visualize relationships between correspondents based on vocabulary usage patterns.

### 12. N-gram Time Series

Track frequency of specific phrases (bigrams/trigrams) over time to see when particular expressions, topics, or concerns emerge and fade; complements collocation analysis by adding temporal dimension to phrase tracking.

### 13. Correspondence Network Graph

Visualize the social network of letter writers and recipients as interactive graph with nodes (people) and edges (letters sent), weighted by frequency; overlay with locations, time periods, and topics to understand communication patterns and key family network members.

### 14. Readability Score Timeline

Calculate Flesch-Kincaid or other readability metrics per letter and track over time; may reveal language acquisition for Norwegian immigrants writing in English, changes in formality, or differences between correspondents' education levels.

### 15. Part-of-Speech (POS) Pattern Analysis

Tag words with grammatical function (noun, verb, adjective, etc.) to analyze syntactic patterns; can reveal stylistic differences, language mixing (Norwegian syntax in English text), or changes in linguistic complexity over immigrant generation.

---

## Implementation Priority Matrix

| Tool | Complexity | Value | Time (hrs) | Dependencies |
|------|-----------|-------|-----------|--------------|
| Timeline Visualization | Easy | High | 4-6 | D3.js |
| Collocation Explorer | Medium | High | 8-12 | PMI calc, Context Explorer |
| Letter Similarity | Medium | High | 10-14 | TF-IDF, vector ops |
| Sentiment Timeline | Medium | High | 12-16 | Sentiment lexicon, D3.js |
| Topic by Correspondent | Medium | High | 10-14 | TF-IDF, heatmaps |
| Topic Modeling (LDA) | Advanced | High | 20-30 | LDA library, backend? |
| Dispersion Plots | Easy | Medium | 4-6 | D3.js |
| TF-IDF Explorer | Easy | Medium | 2-4 | Existing code |
| Lexical Richness | Easy | Medium | 6-8 | Statistics |
| N-gram Time Series | Medium | Medium | 8-10 | Timeline + N-grams |
| Correspondence Network | Medium | High | 12-16 | Network graph lib |
| Sequence Alignment | Advanced | Low | 16-20 | Algorithm impl |
| PCA Visualization | Advanced | Medium | 14-18 | PCA library, t-SNE |
| Readability Timeline | Easy | Low | 4-6 | Readability formulas |
| POS Pattern Analysis | Advanced | Low | 20-25 | POS tagger, parser |

---

## Recommended Implementation Roadmap

### Phase 1: Quick Wins (2-3 weeks)
1. Timeline Visualization
2. Dispersion Plots
3. TF-IDF Explorer (re-enable & improve)
4. Lexical Richness Metrics

### Phase 2: Core Analysis Tools (4-6 weeks)
5. Collocation Explorer
6. Letter Similarity Finder
7. Sentiment Timeline
8. N-gram Time Series

### Phase 3: Advanced Analytics (6-8 weeks)
9. Topic by Correspondent
10. Topic Modeling (LDA)
11. Correspondence Network Graph
12. PCA Visualization

### Phase 4: Specialized Tools (as needed)
13. Readability Timeline
14. Sequence Alignment
15. POS Pattern Analysis

---

## Technical Infrastructure Recommendations

### Shared Components to Build
- **Date parsing utility**: Handle all date format variants
- **Text preprocessing pipeline**: Tokenization, stemming, stop word removal
- **Language detection**: Norwegian vs. English auto-detection
- **Vector operations library**: Cosine similarity, dot product
- **Statistical utilities**: Mean, std dev, confidence intervals
- **Export functionality**: CSV/JSON export for all analyses

### Performance Considerations
- Pre-compute expensive operations (similarity matrices, topic models)
- Cache results in localStorage or server-side
- Lazy-load tools (don't load all analysis code upfront)
- Web Workers for heavy computation (TF-IDF, clustering)
- Progress indicators for long-running operations

### Code Architecture
```
tools/
├── lib/
│   ├── preprocessing.js    # Tokenization, stop words
│   ├── statistics.js        # PMI, TF-IDF, similarity
│   ├── visualization.js     # Shared D3 components
│   └── dates.js             # Date parsing utilities
├── analyses/
│   ├── timeline.js
│   ├── collocation.js
│   ├── similarity.js
│   ├── sentiment.js
│   ├── topics.js
│   └── lda.js
├── data/
│   ├── sentiment-lexicon.json
│   ├── stopwords-norwegian.txt
│   └── precomputed/
│       ├── similarity-matrix.json
│       └── topics-lda.json
└── index.html
```

---

## Data Requirements & Availability

### Currently Available
- ✅ 248 letters with full text (Norwegian + English)
- ✅ Metadata: Date, Creator, Location, Destination, Tags
- ✅ Norwegian stopwords list
- ✅ Bilingual split tags in text

### Needs to be Created
- ⚠️ Sentiment lexicons (download AFINN/Bing)
- ⚠️ Normalized date index
- ⚠️ Creator name normalization (handle variants)
- ⚠️ Pre-computed similarity matrix
- ⚠️ Pre-computed topic model (if using LDA)

### Optional Enhancements
- 💡 Norwegian sentiment lexicon (translate or source)
- 💡 Historical events timeline data (WWI, WWII dates)
- 💡 Geographic coordinates for locations
- 💡 Family relationship graph (manual curation)
- 💡 Letter recipient data (not just creator)

---

## Evaluation Metrics

### Quantitative Measures
- **Usage metrics**: Track which tools are most used
- **Performance**: Load time, computation time per analysis
- **Coverage**: What % of corpus can be analyzed with each tool?

### Qualitative Assessment
- **Research value**: Do tools lead to new insights?
- **Usability**: Can non-technical users operate tools?
- **Interpretation**: Are results meaningful and explainable?
- **Reproducibility**: Can analyses be repeated with same results?

### Validation Approaches
- **Human evaluation**: Compare automatic topics to manual tags
- **Cross-validation**: Do multiple methods agree? (e.g., clustering vs. topics)
- **Historical validation**: Do results align with known historical context?
- **User studies**: Test with potential researchers/family members

---

*Document created: 2025-10-22*
*Corpus: A Shoebox of Norwegian Letters (1911-1956)*
*Current tools: Word Frequency, Context Explorer, Word Cloud, Places*
*Target: Comprehensive text analysis platform for digital humanities research*
