// Statistics Page JavaScript

// Stop words lists
const NORWEGIAN_STOPWORDS = new Set([
  'og', 'i', 'jeg', 'det', 'at', 'en', 'et', 'den', 'til', 'er', 'som', 'på',
  'de', 'med', 'han', 'av', 'ikke', 'der', 'så', 'var', 'meg', 'seg', 'men',
  'ett', 'har', 'om', 'vi', 'min', 'mitt', 'ha', 'hadde', 'hun', 'nå', 'over',
  'da', 'ved', 'fra', 'du', 'ut', 'sin', 'dem', 'oss', 'opp', 'man', 'kan',
  'hans', 'hvor', 'eller', 'hva', 'skal', 'selv', 'sjøl', 'her', 'alle', 'vil',
  'bli', 'ble', 'blitt', 'kunne', 'inn', 'når', 'være', 'kom', 'noen', 'noe',
  'ville', 'dere', 'som', 'deres', 'kun', 'ja', 'etter', 'ned', 'skulle',
  'denne', 'for', 'deg', 'si', 'sine', 'sitt', 'mot', 'å', 'meget', 'hvordan',
  'hennes', 'dette', 'seg', 'sin', 'sitt', 'sine', 'nå', 'her', 'der', 'bare',
  'også', 'mer', 'enn', 'før', 'mellom', 'under', 'både', 'samme', 'siden'
]);

const ENGLISH_STOPWORDS = new Set([
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
]);

// Global state
let lettersData = {};
let currentAnalysis = 'frequency';
let currentResults = null;

// Helper function to extract text from letter in the specified language
function extractText(letter, language) {
  const textArray = letter.metadata?.Text || [];
  if (textArray.length === 0) return '';

  const fullText = textArray[0];
  const parts = fullText.split('<-SPLITTLETTER->');

  if (language === 'norwegian') {
    return parts[0] || '';
  } else {
    return parts[1] || '';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== STATS PAGE LOADING ===');
  console.log('DOM Content Loaded');
  initializeUI();
  loadLettersData();
});

function initializeUI() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    sidebarToggle.setAttribute('aria-expanded', !isCollapsed);
  });

  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (prefersDark) {
    document.body.classList.add('dark-mode');
  }

  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // Analysis type buttons
  const analysisButtons = document.querySelectorAll('[data-analysis]');
  analysisButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      analysisButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchAnalysisType(btn.dataset.analysis);
    });
  });

  // Generate buttons
  document.getElementById('generate-frequency').addEventListener('click', generateFrequencyList);
  document.getElementById('generate-tfidf').addEventListener('click', generateTFIDF);
  document.getElementById('generate-tags').addEventListener('click', generateTagExplorer);
  document.getElementById('generate-context').addEventListener('click', generateContextExplorer);
  document.getElementById('generate-wordcloud').addEventListener('click', generateWordCloud);

  // Export buttons
  document.getElementById('export-csv').addEventListener('click', exportCSV);
  document.getElementById('export-json').addEventListener('click', exportJSON);

  // Add change listeners to all language selectors to update corpus stats
  document.getElementById('language-select').addEventListener('change', () => {
    if (lettersData && Object.keys(lettersData).length > 0) {
      calculateCorpusStats();
    }
  });
  document.getElementById('tfidf-language-select').addEventListener('change', () => {
    if (lettersData && Object.keys(lettersData).length > 0) {
      calculateCorpusStats();
    }
  });
  document.getElementById('tag-language-select').addEventListener('change', () => {
    if (lettersData && Object.keys(lettersData).length > 0) {
      calculateCorpusStats();
    }
  });
  document.getElementById('context-language-select').addEventListener('change', () => {
    if (lettersData && Object.keys(lettersData).length > 0) {
      calculateCorpusStats();
    }
  });
  document.getElementById('wordcloud-language-select').addEventListener('change', () => {
    if (lettersData && Object.keys(lettersData).length > 0) {
      calculateCorpusStats();
    }
  });
}

function switchAnalysisType(type) {
  currentAnalysis = type;

  // Toggle options visibility
  document.getElementById('frequency-options').hidden = (type !== 'frequency');
  document.getElementById('tfidf-options').hidden = (type !== 'tfidf');
  document.getElementById('tags-options').hidden = (type !== 'tags');
  document.getElementById('context-options').hidden = (type !== 'context');
  document.getElementById('wordcloud-options').hidden = (type !== 'wordcloud');

  // Toggle views visibility
  document.getElementById('frequency-view').hidden = (type !== 'frequency');
  document.getElementById('tfidf-view').hidden = (type !== 'tfidf');
  document.getElementById('tags-view').hidden = (type !== 'tags');
  document.getElementById('context-view').hidden = (type !== 'context');
  document.getElementById('wordcloud-view').hidden = (type !== 'wordcloud');

  // Update title
  const titles = {
    'frequency': 'Word Frequency Analysis',
    'tfidf': 'TF-IDF Explorer',
    'tags': 'Tag Explorer',
    'context': 'Context Explorer',
    'wordcloud': 'Word Cloud'
  };
  document.getElementById('stats-title').textContent = titles[type];

  // Auto-generate results for applicable analysis types
  if (!lettersData || Object.keys(lettersData).length === 0) {
    return; // Don't auto-generate if data isn't loaded yet
  }

  // Auto-generate for types that don't require user input
  if (type === 'frequency') {
    generateFrequencyList();
  } else if (type === 'tags') {
    generateTagExplorer();
  } else if (type === 'wordcloud') {
    generateWordCloud();
  }
  // TF-IDF and Context Explorer require search terms, so don't auto-generate
}

async function loadLettersData() {
  console.log('=== LOAD LETTERS DATA ===');
  const loading = document.getElementById('loading');
  const resultsView = document.getElementById('results-view');

  console.log('Loading element:', loading);
  console.log('Results view element:', resultsView);

  try {
    loading.style.display = 'flex';
    console.log('Fetching ../letters.json...');

    // Try to load uncompressed JSON
    let response = await fetch('../letters.json');
    console.log('Fetch response:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Failed to load letters.json: ${response.status}`);
    }

    const text = await response.text();
    console.log('Text received, length:', text.length);
    lettersData = JSON.parse(text);
    console.log('JSON parsed successfully');

    const dataLength = Array.isArray(lettersData) ? lettersData.length : Object.keys(lettersData).length;
    console.log('Letters loaded:', dataLength, 'Type:', Array.isArray(lettersData) ? 'array' : 'object');

    console.log('Hiding loading screen...');
    loading.style.display = 'none';
    console.log('Showing results view...');
    resultsView.hidden = false;
    console.log('Results view hidden attribute:', resultsView.hidden);

    document.getElementById('results-count').textContent = `${dataLength} letters loaded`;
    console.log('Results count updated');

    // Calculate and display corpus statistics
    console.log('Calculating corpus stats...');
    calculateCorpusStats();
    console.log('Corpus stats calculated');

    // Generate initial frequency list after a short delay to ensure UI is ready
    console.log('Setting timeout to generate frequency list...');
    setTimeout(() => {
      console.log('Timeout fired, calling generateFrequencyList...');
      generateFrequencyList();
    }, 100);

  } catch (error) {
    console.error('!!! Error loading letters:', error);
    console.error('Error stack:', error.stack);
    loading.querySelector('p').textContent = 'Error loading letters data. Please refresh the page.';
  }
}

function generateFrequencyList() {
  console.log('generateFrequencyList called');
  console.log('lettersData type:', Array.isArray(lettersData) ? 'array' : typeof lettersData);
  console.log('lettersData length/keys:', Array.isArray(lettersData) ? lettersData.length : Object.keys(lettersData).length);

  if (!lettersData || (Array.isArray(lettersData) ? lettersData.length === 0 : Object.keys(lettersData).length === 0)) {
    console.error('No letters data available');
    alert('No letters data available. Please check console for errors.');
    return;
  }

  const language = document.getElementById('language-select').value;
  const yearStart = parseInt(document.getElementById('year-range-start').value);
  const yearEnd = parseInt(document.getElementById('year-range-end').value);
  const topN = parseInt(document.getElementById('top-n-select').value);

  console.log('Parameters:', { language, yearStart, yearEnd, topN });

  // Get stopwords for selected language
  const stopwords = language === 'norwegian' ? NORWEGIAN_STOPWORDS : ENGLISH_STOPWORDS;

  // Filter letters by year range
  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);
  const filteredLetters = lettersArray.filter(letter => {
    if (!letter.metadata || !letter.metadata.Date || !letter.metadata.Date[0]) return false;
    const dateStr = letter.metadata.Date[0]; // Date is an array
    const year = parseInt(dateStr.split('.')[0]); // Extract year from "YYYY.MM.DD" format
    return year >= yearStart && year <= yearEnd;
  });

  console.log('Filtered letters:', filteredLetters.length);

  // Count word frequencies
  const wordCounts = {};
  let totalWords = 0;

  filteredLetters.forEach(letter => {
    const text = extractText(letter, language);

    if (!text) {
      console.log(`Letter ${letter.id || 'unknown'} has no text for ${language}`);
    }

    // Tokenize and count
    const words = text.toLowerCase()
      .replace(/[^\w\sæøå]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      totalWords++;
    });
  });

  console.log('Total words counted:', totalWords);
  console.log('Unique words:', Object.keys(wordCounts).length);

  // Sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  currentResults = {
    type: 'frequency',
    language,
    yearStart,
    yearEnd,
    totalLetters: filteredLetters.length,
    totalWords,
    topN,
    data: sortedWords
  };

  displayFrequencyResults(sortedWords, totalWords, filteredLetters.length);
}

function displayFrequencyResults(words, totalWords, letterCount) {
  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  infoDiv.innerHTML = `
    <strong>Analysis Summary:</strong> Top ${words.length} words in ${langLabel} text from ${letterCount} letters.
    Total words analyzed: ${totalWords.toLocaleString()} (after stop word removal).
  `;

  // Create bar chart
  displayBarChart(words);

  // Create table
  const tableContainer = document.getElementById('frequency-table');

  if (words.length === 0) {
    tableContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No words found</div>';
    return;
  }

  const maxCount = words[0][1];

  let tableHTML = `
    <table class="stats-table">
      <thead>
        <tr>
          <th class="rank-cell">Rank</th>
          <th class="word-cell">Word</th>
          <th class="count-cell">Count</th>
          <th class="bar-cell">Frequency</th>
        </tr>
      </thead>
      <tbody>
  `;

  words.forEach(([word, count], index) => {
    const percentage = (count / maxCount * 100).toFixed(1);
    tableHTML += `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td class="word-cell">${escapeHtml(word)}</td>
        <td class="count-cell">${count.toLocaleString()}</td>
        <td class="bar-cell">
          <div class="frequency-bar" style="width: ${percentage}%"></div>
        </td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;
}

function displayBarChart(words) {
  const chartDiv = document.getElementById('frequency-chart');
  const topWords = words.slice(0, 20); // Show top 20 in chart

  if (topWords.length === 0) {
    chartDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No words to display</div>';
    return;
  }

  const maxCount = topWords[0][1];
  const chartHeight = 400;
  const barHeight = 15;
  const gap = 5;

  let chartHTML = '<div style="font-weight: 600; margin-bottom: 15px; color: #2c3e50;">Top 20 Words</div>';

  topWords.forEach(([word, count], index) => {
    const percentage = (count / maxCount * 100).toFixed(1);
    const barWidth = percentage;

    chartHTML += `
      <div style="margin-bottom: ${gap}px; display: flex; align-items: center;">
        <div style="width: 120px; text-align: right; padding-right: 10px; font-size: 13px; color: #495057;">
          ${escapeHtml(word)}
        </div>
        <div style="flex: 1; background-color: #e9ecef; border-radius: 4px; height: ${barHeight}px; position: relative;">
          <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, #3498db 0%, #2980b9 100%); border-radius: 4px; display: flex; align-items: center; padding-left: 8px;">
            <span style="color: white; font-size: 11px; font-weight: 600;">${count}</span>
          </div>
        </div>
      </div>
    `;
  });

  chartDiv.innerHTML = chartHTML;
}

function generateTFIDF() {
  const language = document.getElementById('tfidf-language-select').value;
  const searchTerm = document.getElementById('search-term').value.trim().toLowerCase();
  const topN = parseInt(document.getElementById('tfidf-top-n').value);

  if (!searchTerm) {
    alert('Please enter a search term');
    return;
  }

  // Calculate TF-IDF for the search term across all documents
  const docScores = [];
  const stopwords = language === 'norwegian' ? NORWEGIAN_STOPWORDS : ENGLISH_STOPWORDS;

  // First pass: count document frequency (how many docs contain the term)
  let documentFrequency = 0;
  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);
  const totalDocs = lettersArray.length;

  lettersArray.forEach(letter => {
    const text = extractText(letter, language).toLowerCase();

    if (text.includes(searchTerm)) {
      documentFrequency++;
    }
  });

  if (documentFrequency === 0) {
    alert(`Term "${searchTerm}" not found in any documents`);
    return;
  }

  // Calculate IDF
  const idf = Math.log(totalDocs / documentFrequency);

  // Second pass: calculate TF-IDF for each document
  lettersArray.forEach(letter => {
    const text = extractText(letter, language).toLowerCase();

    // Count term frequency in this document
    const words = text.replace(/[^\w\sæøå]/g, ' ').split(/\s+/);
    const termCount = words.filter(w => w === searchTerm).length;

    if (termCount > 0) {
      const tf = termCount / words.length;
      const tfidf = tf * idf;

      docScores.push({
        id: letter.id,
        letter,
        tf,
        idf,
        tfidf,
        termCount,
        totalWords: words.length
      });
    }
  });

  // Sort by TF-IDF score
  docScores.sort((a, b) => b.tfidf - a.tfidf);
  const topDocs = docScores.slice(0, topN);

  currentResults = {
    type: 'tfidf',
    language,
    searchTerm,
    topN,
    documentFrequency,
    totalDocs,
    idf,
    data: topDocs
  };

  displayTFIDFResults(topDocs, searchTerm, documentFrequency, totalDocs, idf);
}

function displayTFIDFResults(docs, searchTerm, docFreq, totalDocs, idf) {
  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('tfidf-language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  infoDiv.innerHTML = `
    <strong>TF-IDF Analysis for "${escapeHtml(searchTerm)}":</strong>
    Found in ${docFreq} of ${totalDocs} documents (${(docFreq/totalDocs*100).toFixed(1)}%).
    IDF Score: ${idf.toFixed(4)}.
    Language: ${langLabel}.
  `;

  // Create table
  const tableContainer = document.getElementById('tfidf-table');

  let tableHTML = `
    <table class="stats-table">
      <thead>
        <tr>
          <th class="rank-cell">Rank</th>
          <th>Letter</th>
          <th>Date</th>
          <th>From</th>
          <th>TF-IDF</th>
          <th>Term Count</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  docs.forEach((doc, index) => {
    const date = doc.letter.metadata?.Date?.[0] || 'Unknown';
    const creator = doc.letter.metadata?.Creator?.[0] || 'Unknown';
    const title = doc.letter.metadata?.Title?.[0] || `Letter ${doc.id}`;

    tableHTML += `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td class="word-cell">${escapeHtml(title)}</td>
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(creator)}</td>
        <td class="tfidf-score-cell">${doc.tfidf.toFixed(6)}</td>
        <td class="count-cell">${doc.termCount} / ${doc.totalWords}</td>
        <td><a href="../index.html?letter=${doc.id}" class="letter-link" target="_blank">View</a></td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;

  // Simple bar chart for TF-IDF scores
  displayTFIDFChart(docs);
}

function displayTFIDFChart(docs) {
  const chartDiv = document.getElementById('tfidf-chart');
  const topDocs = docs.slice(0, 10); // Show top 10 in chart

  const maxScore = topDocs[0].tfidf;
  const barHeight = 15;
  const gap = 5;

  let chartHTML = '<div style="font-weight: 600; margin-bottom: 15px; color: #2c3e50;">Top 10 Documents by TF-IDF Score</div>';

  topDocs.forEach((doc, index) => {
    const percentage = (doc.tfidf / maxScore * 100).toFixed(1);
    const title = doc.letter.metadata?.Title?.[0] || `Letter ${doc.id}`;
    const shortTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;

    chartHTML += `
      <div style="margin-bottom: ${gap}px; display: flex; align-items: center;">
        <div style="width: 150px; text-align: right; padding-right: 10px; font-size: 13px; color: #495057;">
          ${escapeHtml(shortTitle)}
        </div>
        <div style="flex: 1; background-color: #e9ecef; border-radius: 4px; height: ${barHeight}px; position: relative;">
          <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #27ae60 0%, #229954 100%); border-radius: 4px; display: flex; align-items: center; padding-left: 8px;">
            <span style="color: white; font-size: 11px; font-weight: 600;">${doc.tfidf.toFixed(4)}</span>
          </div>
        </div>
      </div>
    `;
  });

  chartDiv.innerHTML = chartHTML;
}

function exportCSV() {
  if (!currentResults) {
    alert('Please generate results first');
    return;
  }

  let csv = '';

  if (currentResults.type === 'frequency') {
    csv = 'Rank,Word,Count\n';
    currentResults.data.forEach(([word, count], index) => {
      csv += `${index + 1},"${word}",${count}\n`;
    });
  } else if (currentResults.type === 'tfidf') {
    csv = 'Rank,Letter ID,Title,Date,Creator,TF-IDF Score,Term Count,Total Words\n';
    currentResults.data.forEach((doc, index) => {
      const title = (doc.letter.metadata?.Title?.[0] || '').replace(/"/g, '""');
      const date = doc.letter.metadata?.Date?.[0] || '';
      const creator = (doc.letter.metadata?.Creator?.[0] || '').replace(/"/g, '""');
      csv += `${index + 1},${doc.id},"${title}",${date},"${creator}",${doc.tfidf},${doc.termCount},${doc.totalWords}\n`;
    });
  } else if (currentResults.type === 'tags') {
    csv = 'Rank,Tag,Letter Count\n';
    currentResults.data.forEach((item, index) => {
      csv += `${index + 1},"${item.tag.replace(/"/g, '""')}",${item.count}\n`;
    });
  } else if (currentResults.type === 'context') {
    csv = 'Letter ID,Title,Date,Creator,Left Context,Match,Right Context,Position\n';
    currentResults.data.forEach(ctx => {
      const title = ctx.letterTitle.replace(/"/g, '""');
      const creator = ctx.creator.replace(/"/g, '""');
      const left = ctx.leftContext.replace(/"/g, '""');
      const match = ctx.matchWord.replace(/"/g, '""');
      const right = ctx.rightContext.replace(/"/g, '""');
      csv += `${ctx.letterId},"${title}",${ctx.date},"${creator}","${left}","${match}","${right}",${ctx.position + 1}\n`;
    });
  } else if (currentResults.type === 'wordcloud') {
    csv = 'Rank,Word,Count\n';
    currentResults.data.forEach(([word, count], index) => {
      csv += `${index + 1},"${word.replace(/"/g, '""')}",${count}\n`;
    });
  }

  downloadFile(csv, `${currentResults.type}_results.csv`, 'text/csv');
}

function exportJSON() {
  if (!currentResults) {
    alert('Please generate results first');
    return;
  }

  const json = JSON.stringify(currentResults, null, 2);
  downloadFile(json, `${currentResults.type}_results.json`, 'application/json');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tag Explorer - shows tags across letters, optionally filtered by word
function generateTagExplorer() {
  const language = document.getElementById('tag-language-select').value;
  const filterWord = document.getElementById('tag-filter-word').value.trim().toLowerCase();
  const topN = parseInt(document.getElementById('tag-top-n').value);

  // Count tags across all letters (or filtered by word)
  const tagCounts = {};
  const tagToLetters = {}; // Map tags to letters containing them
  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);

  lettersArray.forEach(letter => {
    // Get tags for this letter
    const tags = letter.metadata?.Tags || [];

    // If filtering by word, check if word appears in text
    let includeThisLetter = !filterWord;
    if (filterWord) {
      const text = extractText(letter, language).toLowerCase();
      includeThisLetter = text.includes(filterWord);
    }

    if (includeThisLetter && tags.length > 0) {
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        if (!tagToLetters[tag]) {
          tagToLetters[tag] = [];
        }
        tagToLetters[tag].push({
          id: letter.id,
          title: letter.metadata?.Title?.[0] || `Letter ${letter.id}`,
          date: letter.metadata?.Date?.[0] || 'Unknown',
          creator: letter.metadata?.Creator?.[0] || 'Unknown'
        });
      });
    }
  });

  if (Object.keys(tagCounts).length === 0) {
    alert(filterWord ? `No tags found in letters containing "${filterWord}"` : 'No tags found');
    return;
  }

  // Sort by frequency
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  currentResults = {
    type: 'tags',
    language,
    filterWord,
    topN,
    totalTags: Object.keys(tagCounts).length,
    data: sortedTags.map(([tag, count]) => ({
      tag,
      count,
      letters: tagToLetters[tag]
    }))
  };

  displayTagResults(sortedTags, tagToLetters, filterWord);
}

function displayTagResults(tags, tagToLetters, filterWord) {
  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('tag-language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  const filterText = filterWord ? ` containing the word "${escapeHtml(filterWord)}"` : '';
  infoDiv.innerHTML = `
    <strong>Tag Analysis:</strong> Top ${tags.length} tags across letters${filterText}.
    Language: ${langLabel}.
  `;

  // Create bar chart
  displayTagChart(tags);

  // Create table with expandable rows
  const tableContainer = document.getElementById('tags-table');
  const maxCount = tags[0][1];

  let tableHTML = `
    <table class="stats-table">
      <thead>
        <tr>
          <th class="rank-cell">Rank</th>
          <th class="word-cell">Tag</th>
          <th class="count-cell">Letter Count</th>
          <th class="bar-cell">Frequency</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  tags.forEach(([tag, count], index) => {
    const percentage = (count / maxCount * 100).toFixed(1);
    const letters = tagToLetters[tag];
    const rowId = `tag-row-${index}`;

    tableHTML += `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td class="word-cell">${escapeHtml(tag)}</td>
        <td class="count-cell">${count.toLocaleString()}</td>
        <td class="bar-cell">
          <div class="frequency-bar" style="width: ${percentage}%"></div>
        </td>
        <td>
          <span class="expandable-cell" onclick="toggleTagLetters('${rowId}')">
            Show Letters
          </span>
        </td>
      </tr>
      <tr id="${rowId}" style="display: none;">
        <td colspan="5">
          <div class="tag-letters-list">
            ${letters.map(l => `
              <div class="tag-letter-item">
                <a href="../index.html?letter=${l.id}" class="letter-link" target="_blank">
                  ${escapeHtml(l.title)}
                </a>
                (${escapeHtml(l.date)}, ${escapeHtml(l.creator)})
              </div>
            `).join('')}
          </div>
        </td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;
}

function displayTagChart(tags) {
  const chartDiv = document.getElementById('tags-chart');
  const topTags = tags.slice(0, 15); // Show top 15 in chart

  if (topTags.length === 0) {
    chartDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No tags to display</div>';
    return;
  }

  const maxCount = topTags[0][1];
  const barHeight = 15;
  const gap = 5;

  let chartHTML = '<div style="font-weight: 600; margin-bottom: 15px; color: #2c3e50;">Top 15 Tags</div>';

  topTags.forEach(([tag, count], index) => {
    const percentage = (count / maxCount * 100).toFixed(1);

    chartHTML += `
      <div style="margin-bottom: ${gap}px; display: flex; align-items: center;">
        <div style="width: 150px; text-align: right; padding-right: 10px; font-size: 13px; color: #495057;">
          ${escapeHtml(tag)}
        </div>
        <div style="flex: 1; background-color: #e9ecef; border-radius: 4px; height: ${barHeight}px; position: relative;">
          <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%); border-radius: 4px; display: flex; align-items: center; padding-left: 8px;">
            <span style="color: white; font-size: 11px; font-weight: 600;">${count}</span>
          </div>
        </div>
      </div>
    `;
  });

  chartDiv.innerHTML = chartHTML;
}

// Global function for toggling tag letters display
window.toggleTagLetters = function(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
  }
};

// Context Explorer - shows context around a search term
function generateContextExplorer() {
  const language = document.getElementById('context-language-select').value;
  const searchTerm = document.getElementById('context-search-term').value.trim().toLowerCase();
  const contextWindow = parseInt(document.getElementById('context-window').value);
  const maxResults = document.getElementById('context-max-results').value;

  if (!searchTerm) {
    alert('Please enter a search term');
    return;
  }

  // Find all occurrences of the term with context
  const contexts = [];
  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);

  lettersArray.forEach(letter => {
    const text = extractText(letter, language);

    if (!text) return;

    // Split into words while preserving positions
    const words = text.split(/\s+/);

    // Find all occurrences
    words.forEach((word, index) => {
      if (word.toLowerCase().includes(searchTerm)) {
        // Extract context window
        const startIdx = Math.max(0, index - contextWindow);
        const endIdx = Math.min(words.length, index + contextWindow + 1);

        const leftContext = words.slice(startIdx, index).join(' ');
        const matchWord = words[index];
        const rightContext = words.slice(index + 1, endIdx).join(' ');

        contexts.push({
          letterId: letter.id,
          letterTitle: letter.metadata?.Title?.[0] || `Letter ${letter.id}`,
          date: letter.metadata?.Date?.[0] || 'Unknown',
          creator: letter.metadata?.Creator?.[0] || 'Unknown',
          tags: letter.metadata?.Tags || [],
          leftContext,
          matchWord,
          rightContext,
          position: index
        });
      }
    });
  });

  if (contexts.length === 0) {
    alert(`Term "${searchTerm}" not found`);
    return;
  }

  // Limit results if needed
  const limitedContexts = maxResults === 'all'
    ? contexts
    : contexts.slice(0, parseInt(maxResults));

  currentResults = {
    type: 'context',
    language,
    searchTerm,
    contextWindow,
    totalOccurrences: contexts.length,
    showingResults: limitedContexts.length,
    data: limitedContexts
  };

  displayContextResults(limitedContexts, searchTerm, contexts.length);
}

function displayContextResults(contexts, searchTerm, totalCount) {
  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('context-language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  infoDiv.innerHTML = `
    <strong>Context Analysis for "${escapeHtml(searchTerm)}":</strong>
    Showing ${contexts.length} of ${totalCount} total occurrences.
    Language: ${langLabel}.
  `;

  // Create context display
  const resultsContainer = document.getElementById('context-results');

  let html = '';

  contexts.forEach((ctx, index) => {
    html += `
      <div class="context-item">
        <div class="context-header">
          <div class="context-letter-info">
            <h3 class="context-letter-title">${escapeHtml(ctx.letterTitle)}</h3>
            <div class="context-letter-meta">
              ${escapeHtml(ctx.date)} • From ${escapeHtml(ctx.creator)} • Position: word ${ctx.position + 1}
            </div>
          </div>
          <a href="../index.html?letter=${ctx.letterId}" class="context-view-link" target="_blank">
            View Letter
          </a>
        </div>

        <div class="context-text">
          <span class="context-left">${escapeHtml(ctx.leftContext)}</span>
          <span class="context-match">${escapeHtml(ctx.matchWord)}</span>
          <span class="context-right">${escapeHtml(ctx.rightContext)}</span>
        </div>

        ${ctx.tags.length > 0 ? `
          <div class="context-tags">
            <div class="context-tags-label">Tags</div>
            <div class="context-tag-list">
              ${ctx.tags.map(tag => `<span class="context-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  });

  resultsContainer.innerHTML = html;
}

// Word Cloud Generator
function generateWordCloud() {
  const language = document.getElementById('wordcloud-language-select').value;
  const filterWord = document.getElementById('wordcloud-filter-word').value.trim().toLowerCase();
  const yearStart = parseInt(document.getElementById('wordcloud-year-range-start').value);
  const yearEnd = parseInt(document.getElementById('wordcloud-year-range-end').value);
  const maxWords = parseInt(document.getElementById('wordcloud-max-words').value);

  // Get stopwords for selected language
  const stopwords = language === 'norwegian' ? NORWEGIAN_STOPWORDS : ENGLISH_STOPWORDS;

  // Filter letters by year range and optional word filter
  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);
  const filteredLetters = lettersArray.filter(letter => {
    if (!letter.metadata || !letter.metadata.Date || !letter.metadata.Date[0]) return false;
    const dateStr = letter.metadata.Date[0]; // Date is an array
    const year = parseInt(dateStr.split('.')[0]); // Extract year from "YYYY.MM.DD" format
    if (year < yearStart || year > yearEnd) return false;

    // If filtering by word, check if word appears in text
    if (filterWord) {
      const text = extractText(letter, language).toLowerCase();
      return text.includes(filterWord);
    }
    return true;
  });

  if (filteredLetters.length === 0) {
    alert(filterWord
      ? `No letters found containing "${filterWord}" in the selected year range`
      : 'No letters found in the selected year range');
    return;
  }

  // Count word frequencies
  const wordCounts = {};
  let totalWords = 0;

  filteredLetters.forEach(letter => {
    const text = extractText(letter, language);

    // Tokenize and count
    const words = text.toLowerCase()
      .replace(/[^\w\sæøå]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      totalWords++;
    });
  });

  // Sort by frequency and take top N
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords);

  currentResults = {
    type: 'wordcloud',
    language,
    filterWord,
    yearStart,
    yearEnd,
    totalLetters: filteredLetters.length,
    totalWords,
    maxWords,
    data: sortedWords
  };

  displayWordCloud(sortedWords, filteredLetters.length, filterWord);
}

function displayWordCloud(words, letterCount, filterWord) {
  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('wordcloud-language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  const filterText = filterWord ? ` containing the word "${escapeHtml(filterWord)}"` : '';
  infoDiv.innerHTML = `
    <strong>Word Cloud:</strong> Top ${words.length} words in ${langLabel} text from ${letterCount} letters${filterText}.
  `;

  const container = document.getElementById('wordcloud-container');

  if (words.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No words to display</div>';
    return;
  }

  // Calculate font sizes based on frequency
  const maxCount = words[0][1];
  const minCount = words[words.length - 1][1];
  const countRange = maxCount - minCount || 1;

  // Generate color palette (purple to teal gradient)
  const colors = [
    '#b39ddb', '#9575cd', '#7e57c2', '#5e35b1', '#673ab7',
    '#512da8', '#4527a0', '#311b92', '#5c6bc0', '#3f51b5',
    '#3949ab', '#303f9f', '#1976d2', '#0277bd', '#0288d1',
    '#0097a7', '#00acc1', '#00bcd4', '#26c6da', '#4db6ac'
  ];

  let html = '';

  words.forEach(([word, count], index) => {
    // Calculate font size (between 14px and 60px)
    const normalizedSize = (count - minCount) / countRange;
    const fontSize = Math.floor(14 + (normalizedSize * 46));

    // Assign color from gradient
    const colorIndex = Math.floor((index / words.length) * colors.length);
    const color = colors[colorIndex];

    // Add slight rotation for visual interest
    const rotation = (Math.random() - 0.5) * 15; // -7.5 to +7.5 degrees

    html += `
      <span class="word-cloud-word"
            style="font-size: ${fontSize}px;
                   color: ${color};
                   transform: rotate(${rotation}deg);"
            title="${escapeHtml(word)}: ${count} occurrences">
        ${escapeHtml(word)}
      </span>
    `;
  });

  container.innerHTML = html;
}

// Calculate corpus-wide statistics
function calculateCorpusStats() {
  // Get language from the currently active analysis type's language selector
  let language = 'norwegian'; // default
  if (currentAnalysis === 'frequency') {
    language = document.getElementById('language-select').value;
  } else if (currentAnalysis === 'tfidf') {
    language = document.getElementById('tfidf-language-select').value;
  } else if (currentAnalysis === 'tags') {
    language = document.getElementById('tag-language-select').value;
  } else if (currentAnalysis === 'context') {
    language = document.getElementById('context-language-select').value;
  } else if (currentAnalysis === 'wordcloud') {
    language = document.getElementById('wordcloud-language-select').value;
  }

  const totalLetters = Array.isArray(lettersData) ? lettersData.length : Object.keys(lettersData).length;
  let totalWords = 0;
  let lettersWithText = 0;
  const uniqueCreators = new Set();
  const uniqueLocations = new Set();
  const uniqueDestinations = new Set();

  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);
  lettersArray.forEach(letter => {
    // Count words for selected language only
    const text = extractText(letter, language);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const letterWordCount = words.length;

    totalWords += letterWordCount;

    if (letterWordCount > 0) {
      lettersWithText++;
    }

    // Collect unique creators
    const creators = letter.metadata?.Creator || [];
    creators.forEach(creator => {
      if (creator && creator.trim()) {
        uniqueCreators.add(creator.trim());
      }
    });

    // Collect unique locations
    const locations = letter.metadata?.Location || [];
    locations.forEach(location => {
      if (location && location.trim()) {
        uniqueLocations.add(location.trim());
      }
    });

    // Collect unique destinations
    const destinations = letter.metadata?.Destination || [];
    destinations.forEach(destination => {
      if (destination && destination.trim()) {
        uniqueDestinations.add(destination.trim());
      }
    });
  });

  // Calculate average letter length
  const avgLength = lettersWithText > 0 ? Math.round(totalWords / lettersWithText) : 0;

  // Update the UI
  document.getElementById('stat-total-letters').textContent = totalLetters.toLocaleString();
  document.getElementById('stat-total-words').textContent = totalWords.toLocaleString();
  document.getElementById('stat-avg-length').textContent = avgLength.toLocaleString() + ' words';
  document.getElementById('stat-unique-creators').textContent = uniqueCreators.size.toLocaleString();
  document.getElementById('stat-unique-locations').textContent = uniqueLocations.size.toLocaleString();
  document.getElementById('stat-unique-destinations').textContent = uniqueDestinations.size.toLocaleString();
}

