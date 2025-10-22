// Statistics Page JavaScript

// Stop words lists
const NORWEGIAN_STOPWORDS = new Set([
  // Base Norwegian stopwords
  'og', 'i', 'jeg', 'det', 'at', 'en', 'et', 'den', 'til', 'er', 'som', 'på',
  'de', 'med', 'han', 'av', 'ikke', 'der', 'så', 'var', 'meg', 'seg', 'men',
  'ett', 'har', 'om', 'vi', 'min', 'mitt', 'ha', 'hadde', 'hun', 'nå', 'over',
  'da', 'ved', 'fra', 'du', 'ut', 'sin', 'dem', 'oss', 'opp', 'man', 'kan',
  'hans', 'hvor', 'eller', 'hva', 'skal', 'selv', 'sjøl', 'her', 'alle', 'vil',
  'bli', 'ble', 'blitt', 'kunne', 'inn', 'når', 'være', 'kom', 'noen', 'noe',
  'ville', 'dere', 'som', 'deres', 'kun', 'ja', 'etter', 'ned', 'skulle',
  'denne', 'for', 'deg', 'si', 'sine', 'sitt', 'mot', 'å', 'meget', 'hvordan',
  'hennes', 'dette', 'seg', 'sin', 'sitt', 'sine', 'nå', 'her', 'der', 'bare',
  'også', 'mer', 'enn', 'før', 'mellom', 'under', 'både', 'samme', 'siden',
  // Additional stopwords from stop.txt
  'saa', 'dig', 'mig', 'bra', 'vel', 'alt', 'brev', 'blir', 'paa', 'godt',
  'vært', 'mange', 'hos', 'din', 'får', 'sig', 'igjen', 'noget', 'ingen',
  'blev', 'efter', 'idag', 'dag', 'maa', 'henne', 'tro', 'vor', 'hvad', 'aar',
  'litt', 'gang', 'høre', 'tusen', 'enda', 'god', 'ijen', 'synes', 'nok', 'siste',
  'beste', 'hele', 'gamle', 'gode', 'fint', 'dage', 'slik', 'hende', 'mye',
  'mere', 'ting', 'disse', 'hver', 'helt', 'sier', 'lite', 'liten', 'gjøre',
  'står', 'par', 'lidt', 'ennu', 'vell', 'intet', 'ogsaa', 'hit', 'borte',
  'måtte', 'ellers', 'nei', 'flere', 'ifra', 'sent', 'lit', 'del', 'aldrig',
  'ofte', 'mei', 'hvis', 'vores', 'frem', 'lille', 'oppe', 'gjort', 'dagen',
  'hadt', 'gaa', 'første', 'nesten', 'vill', 'gjør', 'dager', 'sit', 'vår',
  'uten', 'ene', 'vis', 'hann', 'mit', 'hat', 'the', 'masse', 'annet', 'neste',
  'gaat', 'you', 'vort'
]);

const ENGLISH_STOPWORDS = new Set([
  // Base English stopwords
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
  'had', 'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being',
  // Additional stopwords from stop_en.txt
  'here', 'too', 'much', 'again', 'many', 'going', 'got', 'must', 'soon', 'still',
  'doing', 'today', 'lot', 'last', 'probably', 'few', 'before', 'says', 'both',
  'such', 'yes', 'same', 'while', 'where', 'really', 'since', 'more', 'anything',
  'yet', 'ago', 'next', 'wont', 'means', 'often', 'gets', 'another', 'doesn',
  'whether', 'yourself', 'haven'
]);

// Custom stopwords loaded from stop.txt
let customStopwords = new Set();

// Places data loaded from places.csv
let placesData = [];

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

// Load custom stopwords from stop.txt
async function loadCustomStopwords() {
  try {
    const response = await fetch('stop.txt');
    if (!response.ok) {
      console.warn('Could not load stop.txt, continuing without custom stopwords');
      return;
    }
    const text = await response.text();
    const words = text.split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line.length > 0);

    customStopwords = new Set(words);
    console.log(`Loaded ${customStopwords.size} custom stopwords from stop.txt`);
  } catch (error) {
    console.warn('Error loading custom stopwords:', error);
  }
}

// Load places data from places.csv
async function loadPlacesData() {
  try {
    console.log('Loading places.csv...');
    const response = await fetch('../places.csv');
    if (!response.ok) {
      console.error('Could not load places.csv, status:', response.status);
      return;
    }
    const text = await response.text();
    console.log('places.csv loaded, length:', text.length);
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log('Total lines:', lines.length);

    // Skip header row
    placesData = lines.slice(1).map((line, index) => {
      // Parse CSV line - handle both quoted and unquoted values
      // Format: Rank,"Location",Mentions,Letter Count
      const match = line.match(/^(\d+),"([^"]+)",(\d+),(\d+)$/);
      if (match) {
        return {
          location: match[2],
          mentions: parseInt(match[3]),
          letterCount: parseInt(match[4])
        };
      } else {
        console.warn('Failed to parse line', index + 2, ':', line);
        return null;
      }
    }).filter(item => item !== null);

    console.log(`Successfully loaded ${placesData.length} places from places.csv`);
    if (placesData.length > 0) {
      console.log('Sample place:', placesData[0]);
    }
  } catch (error) {
    console.error('Error loading places data:', error);
  }
}

// Helper function to get combined stopwords for a language
function getStopwords(language) {
  if (language === 'norwegian') {
    // Combine Norwegian base stopwords with custom Norwegian stopwords
    return new Set([...NORWEGIAN_STOPWORDS, ...customStopwords]);
  } else {
    // English just uses the base stopwords
    return new Set([...ENGLISH_STOPWORDS]);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('=== STATS PAGE LOADING ===');
  console.log('DOM Content Loaded');
  initializeUI();
  await loadCustomStopwords();
  await loadPlacesData();
  loadLettersData();
});

function initializeUI() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  // Initialize sidebar state for mobile
  initMobileSidebar();

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    const isOpen = sidebar.classList.contains('open');
    sidebarToggle.setAttribute('aria-expanded', isOpen);

    // Update button text
    const toggleText = sidebarToggle.querySelector('.toggle-text');
    if (toggleText) {
      toggleText.textContent = isOpen ? 'Hide Options' : 'Statistics Options';
    }
  });

  // Dark mode toggle - match main page implementation
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Load saved theme or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);

  darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // Analysis type buttons
  const analysisButtons = document.querySelectorAll('[data-analysis]');
  analysisButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      analysisButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchAnalysisType(btn.dataset.analysis);
    });
  });

  // Generate buttons
  document.getElementById('generate-frequency').addEventListener('click', generateFrequencyList);
  document.getElementById('generate-collocation').addEventListener('click', generateCollocationAnalysis);
  document.getElementById('generate-tfidf').addEventListener('click', generateTFIDF);
  document.getElementById('generate-context').addEventListener('click', generateContextExplorer);
  document.getElementById('generate-wordcloud').addEventListener('click', generateWordCloud);
  // Places has no generate button - auto-generates on selection

  // Add Enter key support for context search input
  document.getElementById('context-search-term').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateContextExplorer();
    }
  });

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

  // Download buttons
  document.getElementById('download-json').addEventListener('click', downloadLettersJSON);
  document.getElementById('download-txt').addEventListener('click', downloadLettersTXT);
}

/**
 * Initialize sidebar state for mobile devices
 */
function initMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Ensure sidebar starts closed on mobile
    sidebar.classList.remove('open');
    sidebarToggle.setAttribute('aria-expanded', 'false');

    // Update button text
    const toggleText = sidebarToggle.querySelector('.toggle-text');
    if (toggleText) {
      toggleText.textContent = 'Statistics Options';
    }
  }

  // Listen for window resize to handle transitions between mobile and desktop
  window.addEventListener('resize', () => {
    const nowMobile = window.innerWidth <= 768;

    if (nowMobile && !isMobile) {
      // Switched to mobile - close sidebar
      sidebar.classList.remove('open');
      sidebarToggle.setAttribute('aria-expanded', 'false');

      const toggleText = sidebarToggle.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = 'Statistics Options';
      }
    }
  });
}

function switchAnalysisType(type) {
  currentAnalysis = type;

  // Scroll to top when switching analysis types
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update button active states
  const analysisButtons = document.querySelectorAll('[data-analysis]');
  analysisButtons.forEach(btn => {
    if (btn.dataset.analysis === type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle options visibility
  document.getElementById('frequency-options').hidden = (type !== 'frequency');
  document.getElementById('collocation-options').hidden = (type !== 'collocation');
  document.getElementById('tfidf-options').hidden = (type !== 'tfidf');
  document.getElementById('context-options').hidden = (type !== 'context');
  document.getElementById('wordcloud-options').hidden = (type !== 'wordcloud');
  document.getElementById('places-options').hidden = (type !== 'places');

  // Hide the entire tool options container for Places (since it has no options)
  const toolOptionsContainer = document.getElementById('tool-options-container');
  toolOptionsContainer.hidden = (type === 'places');

  // Toggle views visibility
  document.getElementById('frequency-view').hidden = (type !== 'frequency');
  document.getElementById('collocation-view').hidden = (type !== 'collocation');
  document.getElementById('tfidf-view').hidden = (type !== 'tfidf');
  document.getElementById('context-view').hidden = (type !== 'context');
  document.getElementById('wordcloud-view').hidden = (type !== 'wordcloud');
  document.getElementById('places-view').hidden = (type !== 'places');

  // Update title
  const titles = {
    'frequency': 'Word Frequency Analysis',
    'collocation': 'Collocation Explorer',
    'tfidf': 'TF-IDF Explorer',
    'context': 'Context Explorer',
    'wordcloud': 'Word Cloud',
    'places': 'Places Word Cloud'
  };
  document.getElementById('stats-title').textContent = titles[type];

  // Auto-generate results for applicable analysis types
  if (!lettersData || Object.keys(lettersData).length === 0) {
    return; // Don't auto-generate if data isn't loaded yet
  }

  // Auto-generate for types that don't require user input
  if (type === 'frequency') {
    generateFrequencyList();
  } else if (type === 'collocation') {
    generateCollocationAnalysis();
  } else if (type === 'tfidf') {
    generateTFIDF();
  } else if (type === 'wordcloud') {
    generateWordCloud();
  } else if (type === 'places') {
    generatePlacesCloud();
  }
  // Context Explorer requires search terms, so don't auto-generate
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
    resultsView.classList.add('active'); // Add active class to show the view
    console.log('Results view hidden attribute:', resultsView.hidden);
    console.log('Results view classes:', resultsView.className);

    document.getElementById('results-count').textContent = `${dataLength} letters loaded`;
    console.log('Results count updated');

    // Calculate and display corpus statistics
    console.log('Calculating corpus stats...');
    calculateCorpusStats();
    console.log('Corpus stats calculated');

    // Load analysis from URL parameters or show default
    console.log('Setting timeout to load from URL params...');
    setTimeout(() => {
      console.log('Timeout fired, calling loadFromURL...');
      loadFromURL();
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

  // Update URL with configuration
  updateURL({
    analysis: 'frequency',
    language: language,
    yearstart: yearStart,
    yearend: yearEnd,
    topn: topN
  });

  // Get stopwords for selected language
  const stopwords = getStopwords(language);

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

  console.log('Sorted words (top 5):', sortedWords.slice(0, 5));

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

  console.log('Calling displayFrequencyResults...');
  displayFrequencyResults(sortedWords, totalWords, filteredLetters.length);
  console.log('displayFrequencyResults completed');
}

function displayFrequencyResults(words, totalWords, letterCount) {
  console.log('=== displayFrequencyResults ===');
  console.log('words.length:', words.length);
  console.log('totalWords:', totalWords);
  console.log('letterCount:', letterCount);

  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  console.log('infoDiv element:', infoDiv);

  infoDiv.innerHTML = `
    <strong>Analysis Summary:</strong> Top ${words.length} words in ${langLabel} text from ${letterCount} letters.
    Total words analyzed: ${totalWords.toLocaleString()} (after stop word removal).
  `;
  console.log('Info div updated');

  // Create table
  const tableContainer = document.getElementById('frequency-table');
  console.log('tableContainer element:', tableContainer);

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

  // Add download stopwords button
  tableHTML += `
    <div style="text-align: center; margin-top: 20px; padding: 15px;">
      <button id="download-stopwords" class="btn-secondary" style="font-size: 1.3rem;">
        Download ${langLabel} Stop Words List
      </button>
    </div>
  `;

  console.log('Setting tableContainer.innerHTML for frequency table, HTML length:', tableHTML.length);
  tableContainer.innerHTML = tableHTML;

  // Add event listener for download stopwords button
  document.getElementById('download-stopwords').addEventListener('click', () => {
    downloadStopwords(language);
  });

  console.log('Frequency table rendered');
}

function displayBarChart(words) {
  console.log('=== displayBarChart ===');
  const chartDiv = document.getElementById('frequency-chart');
  console.log('chartDiv element:', chartDiv);
  const topWords = words.slice(0, 20); // Show top 20 in chart
  console.log('topWords.length:', topWords.length);

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

  console.log('Setting chartDiv.innerHTML, HTML length:', chartHTML.length);
  chartDiv.innerHTML = chartHTML;
  console.log('Bar chart rendered');
}

// Update URL with current analysis configuration
function updateURL(params) {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.set(key, params[key]);
    }
  });
  window.history.replaceState({}, '', url);
}

// Load analysis configuration from URL parameters
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const analysis = params.get('analysis');

  if (!analysis) {
    // No URL params, show default frequency analysis
    generateFrequencyList();
    return;
  }

  // Switch to the requested analysis type
  switchAnalysisType(analysis);

  // Set up form fields based on parameters and run the analysis
  switch (analysis) {
    case 'frequency':
      if (params.has('language')) document.getElementById('language-select').value = params.get('language');
      if (params.has('yearstart')) document.getElementById('year-range-start').value = params.get('yearstart');
      if (params.has('yearend')) document.getElementById('year-range-end').value = params.get('yearend');
      if (params.has('topn')) document.getElementById('top-n-select').value = params.get('topn');
      generateFrequencyList();
      break;

    case 'collocation':
      if (params.has('language')) document.getElementById('collocation-language-select').value = params.get('language');
      if (params.has('ngram')) document.getElementById('collocation-ngram-type').value = params.get('ngram');
      if (params.has('minfreq')) document.getElementById('collocation-min-freq').value = params.get('minfreq');
      if (params.has('topn')) document.getElementById('collocation-top-n').value = params.get('topn');
      generateCollocationAnalysis();
      break;

    case 'context':
      if (params.has('language')) document.getElementById('context-language-select').value = params.get('language');
      if (params.has('search')) document.getElementById('context-search-term').value = params.get('search');
      if (params.has('window')) document.getElementById('context-window').value = params.get('window');
      if (params.has('maxresults')) document.getElementById('context-max-results').value = params.get('maxresults');
      if (params.has('search')) {
        generateContextExplorer();
      }
      break;

    case 'wordcloud':
      if (params.has('language')) document.getElementById('wordcloud-language-select').value = params.get('language');
      if (params.has('filter')) document.getElementById('wordcloud-filter-word').value = params.get('filter');
      if (params.has('yearstart')) document.getElementById('wordcloud-year-range-start').value = params.get('yearstart');
      if (params.has('yearend')) document.getElementById('wordcloud-year-range-end').value = params.get('yearend');
      if (params.has('maxwords')) document.getElementById('wordcloud-max-words').value = params.get('maxwords');
      generateWordCloud();
      break;

    case 'places':
      generatePlacesCloud();
      break;

    default:
      // Unknown analysis type, default to frequency
      generateFrequencyList();
  }
}

// Collocation Analysis
function generateCollocationAnalysis() {
  const language = document.getElementById('collocation-language-select').value;
  const ngramSize = parseInt(document.getElementById('collocation-ngram-type').value);
  const minFreq = parseInt(document.getElementById('collocation-min-freq').value);
  const topN = parseInt(document.getElementById('collocation-top-n').value);

  // Update URL with configuration
  updateURL({
    analysis: 'collocation',
    language: language,
    ngram: ngramSize,
    minfreq: minFreq,
    topn: topN
  });

  console.log(`Generating ${ngramSize}-grams for ${language} with min frequency ${minFreq}`);

  // Get stopwords for the selected language
  const stopwords = getStopwords(language);

  // Collect all n-grams and their frequencies
  const ngramCounts = {};
  const wordCounts = {};
  let totalWords = 0;
  let totalNgrams = 0;

  Object.values(lettersData).forEach(letter => {
    const text = extractText(letter, language);
    if (!text) return;

    const words = text.toLowerCase()
      .replace(/[^\w\sæøåÆØÅ-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

    totalWords += words.length;

    // Count individual words for PMI calculation
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Generate n-grams
    for (let i = 0; i <= words.length - ngramSize; i++) {
      const ngram = words.slice(i, i + ngramSize);

      // Skip if all words are stop words
      const allStopWords = ngram.every(w => stopwords.has(w));
      if (allStopWords) continue;

      const ngramStr = ngram.join(' ');
      ngramCounts[ngramStr] = (ngramCounts[ngramStr] || 0) + 1;
      totalNgrams++;
    }
  });

  // Filter by minimum frequency
  const filteredNgrams = Object.entries(ngramCounts)
    .filter(([ngram, count]) => count >= minFreq);

  // Calculate PMI (Pointwise Mutual Information) for each n-gram
  const ngramsWithPMI = filteredNgrams.map(([ngram, count]) => {
    const words = ngram.split(' ');

    // Calculate PMI
    // PMI = log(P(w1,w2) / (P(w1) * P(w2)))
    // P(w1,w2) = count(w1,w2) / total_ngrams
    // P(w1) = count(w1) / total_words

    const ngramProb = count / totalNgrams;
    let wordProbProduct = 1;

    words.forEach(word => {
      const wordProb = (wordCounts[word] || 1) / totalWords;
      wordProbProduct *= wordProb;
    });

    const pmi = Math.log2(ngramProb / wordProbProduct);

    return {
      ngram,
      count,
      pmi: pmi,
      frequency: ((count / totalNgrams) * 100).toFixed(4)
    };
  });

  // Sort by PMI score (descending)
  ngramsWithPMI.sort((a, b) => b.pmi - a.pmi);

  // Take top N
  const topCollocations = ngramsWithPMI.slice(0, topN);

  console.log(`Found ${ngramsWithPMI.length} n-grams, showing top ${topCollocations.length}`);

  // Store results for export
  currentResults = {
    type: 'collocation',
    language,
    ngramSize,
    minFreq,
    totalNgrams: ngramsWithPMI.length,
    data: topCollocations
  };

  displayCollocationResults(topCollocations, language, ngramSize);
}

function displayCollocationResults(collocations, language, ngramSize) {
  const infoDiv = document.getElementById('stats-info');
  const ngramType = ngramSize === 2 ? 'Bigrams' : ngramSize === 3 ? 'Trigrams' : `${ngramSize}-grams`;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  infoDiv.innerHTML = `
    <strong>Collocation Analysis (${ngramType}):</strong>
    Showing ${collocations.length} collocations from ${langLabel} text.
    Ranked by PMI (Pointwise Mutual Information) score.
  `;

  // Generate table
  const tableDiv = document.getElementById('collocation-table');
  let tableHTML = `
    <table class="stats-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Collocation</th>
          <th>Frequency</th>
          <th>PMI Score</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  collocations.forEach((item, index) => {
    tableHTML += `
      <tr>
        <td>${index + 1}</td>
        <td class="word-cell"><strong>${escapeHtml(item.ngram)}</strong></td>
        <td>${item.count}</td>
        <td>${item.pmi.toFixed(2)}</td>
        <td><button class="context-link-btn" onclick="searchCollocationContext('${escapeHtml(item.ngram)}', '${language}')">View Contexts</button></td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  tableDiv.innerHTML = tableHTML;

  // Generate bar chart
  displayCollocationChart(collocations.slice(0, Math.min(20, collocations.length)));
}

function displayCollocationChart(collocations) {
  const chartDiv = document.getElementById('collocation-chart');

  if (collocations.length === 0) {
    chartDiv.innerHTML = '<p>No collocations found.</p>';
    return;
  }

  const maxPMI = Math.max(...collocations.map(c => c.pmi));

  let chartHTML = '<div class="bar-chart">';

  collocations.forEach(item => {
    const percentage = (item.pmi / maxPMI) * 100;
    chartHTML += `
      <div class="bar-item">
        <div class="bar-label">${escapeHtml(item.ngram)}</div>
        <div class="bar-wrapper">
          <div class="bar" style="width: ${percentage}%">
            <span class="bar-value">${item.pmi.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  });

  chartHTML += '</div>';
  chartDiv.innerHTML = chartHTML;
}

// Search for collocation in context - integrates with Context Explorer
function searchCollocationContext(ngram, language) {
  // Switch to context view
  switchAnalysisType('context');

  // Set the search term with quotes for multi-word phrases
  const searchTermWords = ngram.trim().split(/\s+/);
  const searchValue = searchTermWords.length > 1 ? `"${ngram}"` : ngram;
  document.getElementById('context-search-term').value = searchValue;
  document.getElementById('context-language-select').value = language;

  // Trigger the context search
  generateContextExplorer();
}

function generateTFIDF() {
  const language = document.getElementById('tfidf-language-select').value;
  const topN = parseInt(document.getElementById('tfidf-top-n').value);
  const stopwords = getStopwords(language);

  console.log('Generating TF-IDF analysis...');

  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);
  const totalDocs = lettersArray.length;

  // Step 1: Calculate word frequencies across entire corpus
  const corpusWordCounts = {};

  lettersArray.forEach(letter => {
    const text = extractText(letter, language).toLowerCase();
    const words = text
      .replace(/[^\w\sæøå]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word)); // Filter: >3 chars and not stopword

    words.forEach(word => {
      corpusWordCounts[word] = (corpusWordCounts[word] || 0) + 1;
    });
  });

  // Step 2: Get top 500 most frequent words
  const topWords = Object.entries(corpusWordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 500)
    .map(([word]) => word);

  console.log(`Analyzing top ${topWords.length} words for TF-IDF...`);

  // Step 3: Calculate TF-IDF for each of these words
  const wordTFIDFScores = [];

  topWords.forEach(word => {
    // Count document frequency (how many docs contain this word)
    let documentFrequency = 0;
    let totalTFIDFSum = 0;
    let maxTFIDF = 0;

    lettersArray.forEach(letter => {
      const text = extractText(letter, language).toLowerCase();
      const words = text.replace(/[^\w\sæøå]/g, ' ').split(/\s+/);
      const termCount = words.filter(w => w === word).length;

      if (termCount > 0) {
        documentFrequency++;
        const tf = termCount / words.length;
        // We'll calculate IDF after counting all docs
      }
    });

    // Calculate IDF
    const idf = Math.log(totalDocs / documentFrequency);

    // Now calculate TF-IDF for each document and get stats
    lettersArray.forEach(letter => {
      const text = extractText(letter, language).toLowerCase();
      const words = text.replace(/[^\w\sæøå]/g, ' ').split(/\s+/);
      const termCount = words.filter(w => w === word).length;

      if (termCount > 0) {
        const tf = termCount / words.length;
        const tfidf = tf * idf;
        totalTFIDFSum += tfidf;
        maxTFIDF = Math.max(maxTFIDF, tfidf);
      }
    });

    const avgTFIDF = totalTFIDFSum / documentFrequency;

    wordTFIDFScores.push({
      word,
      corpusFrequency: corpusWordCounts[word],
      documentFrequency,
      idf,
      avgTFIDF,
      maxTFIDF
    });
  });

  // Step 4: Sort by average TF-IDF score (descending)
  wordTFIDFScores.sort((a, b) => b.avgTFIDF - a.avgTFIDF);
  const topResults = wordTFIDFScores.slice(0, topN);

  currentResults = {
    type: 'tfidf',
    language,
    topN,
    totalDocs,
    totalWords: topWords.length,
    data: topResults
  };

  displayTFIDFResults(topResults, totalDocs);
}

function displayTFIDFResults(words, totalDocs) {
  const infoDiv = document.getElementById('stats-info');
  const language = document.getElementById('tfidf-language-select').value;
  const langLabel = language === 'norwegian' ? 'Norwegian' : 'English Translation';

  infoDiv.innerHTML = `
    <strong>TF-IDF Analysis:</strong>
    Top ${words.length} words by TF-IDF score (from top 500 most frequent words >3 characters).
    Analyzed across ${totalDocs} letters.
    Language: ${langLabel}.
  `;

  // Create table
  const tableContainer = document.getElementById('tfidf-table');

  let tableHTML = `
    <table class="stats-table">
      <thead>
        <tr>
          <th class="rank-cell">Rank</th>
          <th>Word</th>
          <th>Avg TF-IDF</th>
          <th>Max TF-IDF</th>
          <th>Doc Frequency</th>
          <th>Corpus Count</th>
          <th>IDF</th>
        </tr>
      </thead>
      <tbody>
  `;

  words.forEach((item, index) => {
    const docFreqPercent = ((item.documentFrequency / totalDocs) * 100).toFixed(1);

    tableHTML += `
      <tr>
        <td class="rank-cell">${index + 1}</td>
        <td class="word-cell">${escapeHtml(item.word)}</td>
        <td class="tfidf-score-cell">${item.avgTFIDF.toFixed(6)}</td>
        <td class="tfidf-score-cell">${item.maxTFIDF.toFixed(6)}</td>
        <td class="count-cell">${item.documentFrequency} (${docFreqPercent}%)</td>
        <td class="count-cell">${item.corpusFrequency.toLocaleString()}</td>
        <td class="tfidf-score-cell">${item.idf.toFixed(4)}</td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;

  // Simple bar chart for TF-IDF scores
  displayTFIDFChart(words);
}

function displayTFIDFChart(words) {
  const chartDiv = document.getElementById('tfidf-chart');
  const topWords = words.slice(0, 15); // Show top 15 in chart

  if (topWords.length === 0) {
    chartDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No words to display</div>';
    return;
  }

  const maxScore = topWords[0].avgTFIDF;
  const barHeight = 15;
  const gap = 5;

  let chartHTML = '<div style="font-weight: 600; margin-bottom: 15px; color: #2c3e50;">Top 15 Words by Average TF-IDF Score</div>';

  topWords.forEach((item, index) => {
    const percentage = (item.avgTFIDF / maxScore * 100).toFixed(1);

    chartHTML += `
      <div style="margin-bottom: ${gap}px; display: flex; align-items: center;">
        <div style="width: 120px; text-align: right; padding-right: 10px; font-size: 13px; color: #495057; font-weight: 600;">
          ${escapeHtml(item.word)}
        </div>
        <div style="flex: 1; background-color: #e9ecef; border-radius: 4px; height: ${barHeight}px; position: relative;">
          <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #27ae60 0%, #229954 100%); border-radius: 4px; display: flex; align-items: center; padding-left: 8px;">
            <span style="color: white; font-size: 11px; font-weight: 600;">${item.avgTFIDF.toFixed(6)}</span>
          </div>
        </div>
      </div>
    `;
  });

  chartDiv.innerHTML = chartHTML;
}

// Download stopwords list for a given language
function downloadStopwords(language) {
  const stopwords = getStopwords(language);
  const stopwordsArray = Array.from(stopwords).sort();

  const text = stopwordsArray.join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const langLabel = language === 'norwegian' ? 'norwegian' : 'english';
  const filename = `stopwords_${langLabel}.txt`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    csv = 'Rank,Word,Avg TF-IDF,Max TF-IDF,Document Frequency,Corpus Count,IDF\n';
    currentResults.data.forEach((item, index) => {
      const word = item.word.replace(/"/g, '""');
      csv += `${index + 1},"${word}",${item.avgTFIDF},${item.maxTFIDF},${item.documentFrequency},${item.corpusFrequency},${item.idf}\n`;
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
  } else if (currentResults.type === 'places') {
    csv = 'Rank,Place,Mentions\n';
    currentResults.data.forEach(([place, count], index) => {
      csv += `${index + 1},"${place.replace(/"/g, '""')}",${count}\n`;
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


// Context Explorer - shows context around a search term
function generateContextExplorer() {
  const language = document.getElementById('context-language-select').value;
  const contextWindow = parseInt(document.getElementById('context-window').value);
  const maxResults = document.getElementById('context-max-results').value;

  // Get search term and handle quotes
  let rawSearchTerm = document.getElementById('context-search-term').value.trim();

  if (!rawSearchTerm) {
    alert('Please enter a search term');
    return;
  }

  // Strip existing quotes if present
  let searchTerm = rawSearchTerm.replace(/^["']|["']$/g, '');

  // If multi-word phrase, add quotes to the input field for clarity
  const searchTermWords = searchTerm.trim().split(/\s+/);
  if (searchTermWords.length > 1 && !rawSearchTerm.startsWith('"')) {
    document.getElementById('context-search-term').value = `"${searchTerm}"`;
  }

  // Update URL with configuration
  updateURL({
    analysis: 'context',
    language: language,
    search: searchTerm,
    window: contextWindow,
    maxresults: maxResults
  });

  // Convert to lowercase for matching
  searchTerm = searchTerm.toLowerCase();

  // Find all occurrences of the term with context
  const contexts = [];
  const lettersArray = Array.isArray(lettersData) ? lettersData : Object.values(lettersData);

  lettersArray.forEach(letter => {
    const text = extractText(letter, language);

    if (!text) return;

    // Split into words while preserving positions
    const words = text.split(/\s+/);
    const wordsLower = words.map(w => w.toLowerCase());

    // For phrase matching, also create cleaned versions without punctuation
    const wordsClean = words.map(w => w.toLowerCase().replace(/[^\w\sæøåÆØÅ-]/g, ''));

    // Check if search term is a phrase (multiple words)
    const searchTermWords = searchTerm.split(/\s+/).filter(w => w.length > 0);
    const isPhrase = searchTermWords.length > 1;

    if (isPhrase) {
      // Phrase search: look for EXACT consecutive word matches
      for (let i = 0; i <= wordsClean.length - searchTermWords.length; i++) {
        // Check if this position has all the exact words in sequence
        let phraseMatch = true;
        for (let j = 0; j < searchTermWords.length; j++) {
          // Exact match: the word must equal the search term exactly (without punctuation)
          if (wordsClean[i + j] !== searchTermWords[j]) {
            phraseMatch = false;
            break;
          }
        }

        if (phraseMatch) {
          // Found an exact phrase match
          const matchStartIdx = i;
          const matchEndIdx = i + searchTermWords.length;

          // Extract context window
          const startIdx = Math.max(0, matchStartIdx - contextWindow);
          const endIdx = Math.min(words.length, matchEndIdx + contextWindow);

          const leftContext = words.slice(startIdx, matchStartIdx).join(' ');
          const matchWord = words.slice(matchStartIdx, matchEndIdx).join(' ');
          const rightContext = words.slice(matchEndIdx, endIdx).join(' ');

          contexts.push({
            letterId: letter.id,
            letterTitle: letter.metadata?.Title?.[0] || `Letter ${letter.id}`,
            date: letter.metadata?.Date?.[0] || 'Unknown',
            creator: letter.metadata?.Creator?.[0] || 'Unknown',
            tags: letter.metadata?.Tags || [],
            leftContext,
            matchWord,
            rightContext,
            position: matchStartIdx
          });
        }
      }
    } else {
      // Single word search: use original logic
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
    }
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

  // Group contexts by letter ID
  const groupedByLetter = {};
  contexts.forEach(ctx => {
    if (!groupedByLetter[ctx.letterId]) {
      groupedByLetter[ctx.letterId] = {
        letterInfo: {
          id: ctx.letterId,
          title: ctx.letterTitle,
          date: ctx.date,
          creator: ctx.creator,
          tags: ctx.tags
        },
        contexts: []
      };
    }
    groupedByLetter[ctx.letterId].contexts.push(ctx);
  });

  // Create context display
  const resultsContainer = document.getElementById('context-results');

  let html = '';

  Object.values(groupedByLetter).forEach(letterGroup => {
    const { letterInfo, contexts: letterContexts } = letterGroup;

    html += `
      <div class="context-letter-group">
        <div class="context-header">
          <div class="context-letter-info">
            <h3 class="context-letter-title">${escapeHtml(letterInfo.title)}</h3>
            <div class="context-letter-meta">
              ${escapeHtml(letterInfo.date)} • From ${escapeHtml(letterInfo.creator)} • ${letterContexts.length} occurrence${letterContexts.length > 1 ? 's' : ''}
            </div>
          </div>
          <a href="../index.html?letter=${letterInfo.id}&search=${encodeURIComponent(searchTerm)}" class="context-view-link" target="_blank">
            View Letter
          </a>
        </div>

        ${letterInfo.tags.length > 0 ? `
          <div class="context-tags">
            <div class="context-tags-label">Tags</div>
            <div class="context-tag-list">
              ${letterInfo.tags.map(tag => `<span class="context-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="context-occurrences">
          ${letterContexts.map((ctx, index) => `
            <div class="context-item">
              <div class="context-occurrence-label">Occurrence ${index + 1} (word position ${ctx.position + 1}):</div>
              <div class="context-text">
                <span class="context-left">${escapeHtml(ctx.leftContext)}</span>
                <span class="context-match">${escapeHtml(ctx.matchWord)}</span>
                <span class="context-right">${escapeHtml(ctx.rightContext)}</span>
              </div>
            </div>
          `).join('')}
        </div>
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

  // Update URL with configuration
  updateURL({
    analysis: 'wordcloud',
    language: language,
    filter: filterWord || undefined,
    yearstart: yearStart,
    yearend: yearEnd,
    maxwords: maxWords
  });

  // Get stopwords for selected language
  const stopwords = getStopwords(language);

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

  // Clear container
  container.innerHTML = '';

  // Get container dimensions
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  // Create SVG
  const svg = d3.select('#wordcloud-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background-color', 'white');

  // Calculate font sizes based on frequency
  const maxCount = words[0][1];
  const minCount = words[words.length - 1][1];

  // Create color scale (purple to teal gradient)
  const colorScale = d3.scaleSequential()
    .domain([0, words.length - 1])
    .interpolator(d3.interpolateRgbBasis([
      '#b39ddb', '#9575cd', '#7e57c2', '#5e35b1', '#673ab7',
      '#512da8', '#4527a0', '#311b92', '#5c6bc0', '#3f51b5',
      '#3949ab', '#303f9f', '#1976d2', '#0277bd', '#0288d1',
      '#0097a7', '#00acc1', '#00bcd4', '#26c6da', '#4db6ac'
    ]));

  // Font size scale (logarithmic for better distribution)
  // Adjust font size range based on number of words to fit more words
  const maxFontSize = words.length > 150 ? 60 : words.length > 100 ? 70 : 80;
  const minFontSize = words.length > 150 ? 10 : words.length > 100 ? 12 : 14;

  const fontScale = d3.scaleLog()
    .domain([minCount || 1, maxCount])
    .range([minFontSize, maxFontSize]);

  // Convert words to format expected by d3-cloud
  const cloudWords = words.map(([word, count], index) => ({
    text: word,
    size: fontScale(count),
    count: count,
    color: colorScale(index)
  }));

  // Create word cloud layout
  const layout = d3.layout.cloud()
    .size([width, height])
    .words(cloudWords)
    .padding(3) // Reduce padding for more words
    .rotate(() => (~~(Math.random() * 6) - 3) * 15) // -45, -30, -15, 0, 15, 30, 45 degrees
    .font('Arial, sans-serif')
    .fontSize(d => d.size)
    .spiral('archimedean')
    .timeInterval(20) // Increase time for layout algorithm
    .on('end', draw);

  layout.start();

  function draw(words) {
    svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)
      .selectAll('text')
      .data(words)
      .enter()
      .append('text')
      .style('font-size', d => `${d.size}px`)
      .style('font-family', 'Arial, sans-serif')
      .style('font-weight', '600')
      .style('fill', d => d.color)
      .style('cursor', 'pointer')
      .attr('text-anchor', 'middle')
      .attr('transform', d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
      .text(d => d.text)
      .append('title')
      .text(d => `${d.text}: ${d.count} occurrences\nClick to search in letters`);

    // Add hover effect
    svg.selectAll('text')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('font-size', function(d) { return `${d.size * 1.15}px`; })
          .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.3)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('font-size', function(d) { return `${d.size}px`; })
          .style('text-shadow', 'none');
      })
      .on('click', function(event, d) {
        // Open main index.html with search for this word
        const searchUrl = `../index.html?search=${encodeURIComponent(d.text)}`;
        window.open(searchUrl, '_blank');
      });
  }
}

// Places Word Cloud - creates word cloud from places.csv
function generatePlacesCloud() {
  console.log('Generating places word cloud from CSV...');

  // Update URL with configuration
  updateURL({ analysis: 'places' });

  if (!placesData || placesData.length === 0) {
    alert('Places data not loaded. Please refresh the page.');
    return;
  }

  // Use all places from CSV
  const placesForCloud = placesData.map(place => [place.location, place.mentions]);

  currentResults = {
    type: 'places',
    totalPlaces: placesData.length,
    data: placesForCloud
  };

  displayPlacesCloud(placesForCloud, placesData.length);
}

function displayPlacesCloud(places, totalPlaces) {
  const infoDiv = document.getElementById('stats-info');

  infoDiv.innerHTML = `
    <strong>Places Word Cloud:</strong> Showing ${places.length} places from the letters corpus.
    Data source: places.csv
  `;

  const container = document.getElementById('places-container');

  if (places.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No places to display</div>';
    return;
  }

  // Clear container
  container.innerHTML = '';

  // Get container dimensions
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  // Create SVG
  const svg = d3.select('#places-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background-color', 'white');

  // Calculate font sizes based on frequency
  const maxCount = places[0][1];
  const minCount = places[places.length - 1][1];

  // Create color scale (red to orange gradient for places)
  const colorScale = d3.scaleSequential()
    .domain([0, places.length - 1])
    .interpolator(d3.interpolateRgbBasis([
      '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#d35400',
      '#c0392b', '#e74c3c', '#fd79a8', '#ff7675', '#fab1a0'
    ]));

  // Font size scale (logarithmic for better distribution)
  const fontScale = d3.scaleLog()
    .domain([minCount || 1, maxCount])
    .range([14, 80]);

  // Convert places to format expected by d3-cloud
  const cloudWords = places.map(([place, count], index) => ({
    text: place,
    size: fontScale(count),
    count: count,
    color: colorScale(index)
  }));

  // Create word cloud layout
  const layout = d3.layout.cloud()
    .size([width, height])
    .words(cloudWords)
    .padding(5)
    .rotate(() => (~~(Math.random() * 6) - 3) * 15)
    .font('Arial, sans-serif')
    .fontSize(d => d.size)
    .spiral('archimedean')
    .on('end', draw);

  layout.start();

  function draw(words) {
    svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)
      .selectAll('text')
      .data(words)
      .enter()
      .append('text')
      .style('font-size', d => `${d.size}px`)
      .style('font-family', 'Arial, sans-serif')
      .style('font-weight', '600')
      .style('fill', d => d.color)
      .style('cursor', 'pointer')
      .attr('text-anchor', 'middle')
      .attr('transform', d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
      .text(d => d.text)
      .append('title')
      .text(d => `${d.text}: ${d.count} mentions\nClick to search in letters`);

    // Add hover and click effects
    svg.selectAll('text')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('font-size', function(d) { return `${d.size * 1.15}px`; })
          .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.3)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('font-size', function(d) { return `${d.size}px`; })
          .style('text-shadow', 'none');
      })
      .on('click', function(event, d) {
        // Open main index.html with search for this place
        const searchUrl = `../index.html?search=${encodeURIComponent(d.text)}`;
        window.open(searchUrl, '_blank');
      });
  }
}

// Calculate corpus-wide statistics
function calculateCorpusStats() {
  // Get language from the currently active analysis type's language selector
  let language = 'norwegian'; // default
  if (currentAnalysis === 'frequency') {
    language = document.getElementById('language-select').value;
  } else if (currentAnalysis === 'tfidf') {
    language = document.getElementById('tfidf-language-select').value;
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

// Download Letters as JSON
function downloadLettersJSON() {
  if (!lettersData || Object.keys(lettersData).length === 0) {
    alert('Letters data not loaded yet. Please wait for the data to load.');
    return;
  }

  const json = JSON.stringify(lettersData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shoebox-letters.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download Letters as TXT archive (zip)
async function downloadLettersTXT() {
  if (!lettersData || Object.keys(lettersData).length === 0) {
    alert('Letters data not loaded yet. Please wait for the data to load.');
    return;
  }

  try {
    // Check if the pre-built archive exists
    const response = await fetch('../letters-txt.zip');
    if (response.ok) {
      // Pre-built archive exists, download it
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shoebox-letters.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('The TXT archive has not been built yet. Please run the build script first:\n\ncd tools\nnode build-txt-archive.js');
    }
  } catch (error) {
    console.error('Error downloading TXT archive:', error);
    alert('Error downloading TXT archive. Please ensure the archive has been built.');
  }
}

