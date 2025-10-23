/**
 * Norwegian Letters Browser - Main Application
 * Pure vanilla JavaScript - no dependencies (except pako.js for gzip)
 */

class LettersApp {
  constructor() {
    // Data
    this.letters = [];
    this.filteredLetters = [];
    this.metadata = null;
    this.currentIndex = 0;

    // Current state
    this.currentFilters = {
      search: '',
      searchNegative: '',  // Negative search (!term)
      titleSearch: '',
      textSearch: '',
      creators: new Set(),
      tags: new Set(),
      years: new Set(),
      locations: new Set(),
      destinations: new Set(),
      dateRange: { before: null, after: null },
      letterIds: new Set(),  // Filter by specific letter IDs
      correspondencePair: [],  // Special: [loc1, loc2] for bidirectional correspondence
      // Negative filters
      creatorsNegative: new Set(),
      tagsNegative: new Set(),
      yearsNegative: new Set(),
      locationsNegative: new Set(),
      destinationsNegative: new Set()
    };
    this.languageMode = 'both'; // 'both', 'norwegian', 'english'
    this.currentView = 'list'; // 'list' or 'letter'
    this.sortMode = 'date-asc';
    this.fontSize = 'medium'; // 'small', 'medium', 'large', 'xlarge'
    this.currentOpenFilterType = null; // Track which filter panel is currently open

    // DOM elements (cached)
    this.elements = {};
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing Letters Browser...');

    try {
      // Cache DOM elements
      this.cacheElements();

      // Initialize theme
      this.initTheme();

      // Load data
      await this.loadData();

      // Set up event listeners
      this.setupEventListeners();

      // Load filters from URL if present
      this.loadFiltersFromURL();

      // Apply initial filters (shows all letters)
      this.applyFilters();

      // Render active filters (including search summary)
      this.renderActiveFilters();

      // Show list view (unless letter view was loaded from URL)
      if (this.currentView !== 'letter') {
        this.showListView();
      }

      // Initialize sidebar state for mobile
      this.initMobileSidebar();

      // Hide loading screen
      this.elements.loading.style.display = 'none';

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showError('Failed to load letters. Please refresh the page.');
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Views
      loading: document.getElementById('loading'),
      listView: document.getElementById('list-view'),
      letterView: document.getElementById('letter-view'),

      // List view
      lettersList: document.getElementById('letters-list'),
      resultsCount: document.getElementById('results-count'),
      resultsCountDisplay: document.getElementById('results-count-display'),
      sortBy: document.getElementById('sort-by'),
      noResults: document.getElementById('no-results'),
      listBottomNav: document.getElementById('list-bottom-nav'),
      resetAllBtn: document.getElementById('reset-all-btn'),
      searchSummary: document.getElementById('search-summary'),
      searchSummaryText: document.getElementById('search-summary-text'),

      // Letter view
      currentLetter: document.getElementById('current-letter'),
      currentIndex: document.getElementById('current-index'),
      totalLetters: document.getElementById('total-letters'),
      prevButton: document.getElementById('prev-letter'),
      nextButton: document.getElementById('next-letter'),
      backButton: document.getElementById('back-to-list'),

      // Filters
      searchBox: document.getElementById('search-box'),
      prefixHint: document.getElementById('prefix-hint'),
      filterButtons: document.querySelectorAll('.filter-button'),
      filterOptions: document.getElementById('filter-options'),
      filterOptionsTitle: document.getElementById('filter-options-title'),
      filterOptionsChips: document.getElementById('filter-options-chips'),
      filterHint: document.getElementById('filter-hint'),
      closeFilterOptions: document.getElementById('close-filter-options'),
      activeFilters: document.getElementById('active-filters'),
      activeFiltersList: document.getElementById('active-filters-list'),
      clearFilters: document.getElementById('clear-filters'),

      // Mobile filter options
      mobileFilterOptions: document.getElementById('mobile-filter-options'),
      mobileFilterOptionsChips: document.getElementById('mobile-filter-options-chips'),
      mobileFilterHint: document.getElementById('mobile-filter-hint'),

      // Controls
      languageToggle: document.querySelectorAll('.language-toggle button'),
      darkModeToggle: document.getElementById('dark-mode-toggle'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      siteTitleLink: document.getElementById('site-title-link'),

      // Advanced search modal
      advancedSearchBtn: document.getElementById('advanced-search-btn'),
      advancedSearchModal: document.getElementById('advanced-search-modal'),
      advancedSearchForm: document.getElementById('advanced-search-form'),
      closeModal: document.getElementById('close-modal'),
      cancelAdvanced: document.getElementById('cancel-advanced'),

      // Search help modal
      searchHelpBtn: document.getElementById('search-help-btn'),
      searchHelpModal: document.getElementById('search-help-modal'),
      closeSearchHelp: document.getElementById('close-search-help'),
      closeSearchHelpBtn: document.getElementById('close-search-help-btn')
    };
  }

  /**
   * Load and decompress data files
   */
  async loadData() {
    console.log('Loading data...');

    try {
      // Load compressed letters using browser's built-in decompression
      const lettersResponse = await fetch('letters.json.gz');
      if (!lettersResponse.ok) {
        throw new Error(`Failed to load letters: ${lettersResponse.status}`);
      }

      // Use browser's built-in DecompressionStream API
      const decompressedStream = lettersResponse.body
        .pipeThrough(new DecompressionStream('gzip'));

      const decompressedResponse = new Response(decompressedStream);
      this.letters = await decompressedResponse.json();

      console.log(`Loaded ${this.letters.length} letters`);

      // Load metadata index
      const metadataResponse = await fetch('metadata-index.json');
      if (!metadataResponse.ok) {
        throw new Error(`Failed to load metadata: ${metadataResponse.status}`);
      }

      this.metadata = await metadataResponse.json();

      console.log('Metadata loaded:', {
        tags: this.metadata.tags.length,
        creators: this.metadata.creators.length,
        years: this.metadata.years.length,
        locations: this.metadata.locations.length,
        destinations: this.metadata.destinations.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Language toggle
    this.elements.languageToggle.forEach(button => {
      button.addEventListener('click', () => this.setLanguageMode(button.dataset.lang));
    });

    // Dark mode toggle
    this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

    // Site title link - reset to home
    this.elements.siteTitleLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.clearAllFilters();
      this.showListView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Font size controls (list view)
    document.getElementById('font-smaller')?.addEventListener('click', () => this.decreaseFontSize());
    document.getElementById('font-larger')?.addEventListener('click', () => this.increaseFontSize());

    // Font size controls (letter view)
    document.getElementById('font-smaller-letter')?.addEventListener('click', () => this.decreaseFontSize());
    document.getElementById('font-larger-letter')?.addEventListener('click', () => this.increaseFontSize());

    // Sidebar toggle (mobile)
    this.elements.sidebarToggle?.addEventListener('click', () => this.toggleSidebar());

    // Search - listen for Enter key to parse filter syntax
    this.elements.searchBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const searchValue = e.target.value.trim();

        // For Space key: check if we're inside quotes (don't trigger parsing)
        if (e.key === ' ') {
          const cursorPos = e.target.selectionStart;
          const textBeforeCursor = e.target.value.substring(0, cursorPos);

          // Count quotes before cursor - if odd number, we're inside quotes
          const quoteCount = (textBeforeCursor.match(/"/g) || []).length;
          if (quoteCount % 2 === 1) {
            // Inside quotes - let the space be typed normally
            return;
          }
        }

        // Check if we have complete filter syntax that should be parsed
        const hasCompleteFilterSyntax = /(?:^|\s)!?\w+:\S+|(?:^|\s)!\S+/.test(searchValue);

        // Only trigger parsing if:
        // 1. Enter was pressed, OR
        // 2. Space was pressed AND there's complete filter syntax (not just typing words)
        if (e.key === 'Enter' || (e.key === ' ' && hasCompleteFilterSyntax)) {
          e.preventDefault();
          this.parseSearchBoxSyntax(searchValue);

          // After parsing, update the search box to show only the remaining plain text search
          this.elements.searchBox.value = this.currentFilters.search;

          this.updateSearchClearButton();
          this.updatePrefixHint(this.currentFilters.search);  // Update hint after parsing
          this.hideFilterOptions(); // Close browse by selection window
          this.applyFilters();
          this.renderActiveFilters();
          this.showListView();
        }
      }
    });

    // Also support live typing (without filter syntax conversion)
    this.elements.searchBox.addEventListener('input', (e) => {
      const searchValue = e.target.value; // Don't trim yet - need to detect "! " vs "!"
      const trimmedValue = searchValue.trim();

      this.updateSearchClearButton();
      this.updatePrefixHint(trimmedValue);  // Check if prefixes are present

      // Check if search contains filter syntax that needs Enter to process
      // Match patterns like: y:, !y:, f:, !f:, !word (but not just "!" alone or "! ")
      const hasFilterSyntax = /(?:^|\s)!?\w+:\S*|(?:^|\s)!\S+/.test(searchValue);

      // Also check if it's just "!" or starts with "!" but incomplete
      const isIncompleteNegative = /^!\s*$/.test(trimmedValue);

      if (hasFilterSyntax || isIncompleteNegative) {
        // Don't apply filters automatically - wait for Enter key
        // Just show the hint that Enter is needed
        return;
      }

      // For live typing without filter syntax, only update simple search
      this.currentFilters.search = trimmedValue;

      this.debounce(() => {
        this.applyFilters();
        this.renderActiveFilters();
        this.showListView();
      }, 300);
    });

    // Clear search button - clears ALL filters
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.clearAllFilters();
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Sort
    this.elements.sortBy.addEventListener('change', (e) => {
      this.sortMode = e.target.value;
      this.sortLetters();
      if (this.currentView === 'list') {
        this.renderLettersList();
      }
    });

    // Clear filters
    this.elements.clearFilters.addEventListener('click', () => this.clearAllFilters());

    // Filter buttons
    this.elements.filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filterType = button.dataset.filter;

        // Switch to list view if in letter view
        if (this.currentView === 'letter') {
          this.showListView();
        }

        this.showFilterOptions(filterType);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Close filter options
    this.elements.closeFilterOptions.addEventListener('click', () => {
      this.hideFilterOptions();
    });

    // Navigation
    this.elements.prevButton.addEventListener('click', () => this.navigatePrevious());
    this.elements.nextButton.addEventListener('click', () => this.navigateNext());
    this.elements.backButton.addEventListener('click', () => this.showListView());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Advanced search modal
    this.elements.advancedSearchBtn.addEventListener('click', () => this.showAdvancedSearch());
    this.elements.closeModal.addEventListener('click', () => this.hideAdvancedSearch());
    this.elements.cancelAdvanced.addEventListener('click', () => this.hideAdvancedSearch());
    this.elements.advancedSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.applyAdvancedSearch();
    });

    // Close modal on backdrop click
    this.elements.advancedSearchModal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      this.hideAdvancedSearch();
    });

    // Search help modal
    this.elements.searchHelpBtn?.addEventListener('click', () => this.showSearchHelp());
    this.elements.closeSearchHelp?.addEventListener('click', () => this.hideSearchHelp());
    this.elements.closeSearchHelpBtn?.addEventListener('click', () => this.hideSearchHelp());

    // Close search help modal on backdrop click
    this.elements.searchHelpModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      this.hideSearchHelp();
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.elements.advancedSearchModal.hidden) {
          this.hideAdvancedSearch();
        }
        if (!this.elements.searchHelpModal.hidden) {
          this.hideSearchHelp();
        }
      }
    });

    // Reset filters button
    document.getElementById('reset-filters')?.addEventListener('click', () => {
      this.clearAllFilters();
    });
  }

  /**
   * Show filter options in main area
   */
  showFilterOptions(filterType) {
    const titles = {
      'years': 'Select Year',
      'creators': 'Select Creator',
      'tags': 'Select Tag',
      'locations': 'Select Location',
      'destinations': 'Select Destination'
    };

    const hints = {
      'years': '',
      'tags': 'Click to toggle tags (select multiple, must have ALL selected tags)',
      'creators': 'Click to select one creator',
      'locations': 'Click to select one location',
      'destinations': 'Click to select one destination'
    };

    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;

    // If switching filter types on mobile, hide the previous one first
    if (isMobile && this.currentOpenFilterType && this.currentOpenFilterType !== filterType) {
      this.elements.mobileFilterOptions.hidden = true;
    }

    this.currentOpenFilterType = filterType; // Track which panel is open

    if (isMobile) {
      // Use mobile inline filter options
      this.elements.mobileFilterHint.textContent = hints[filterType];
      this.elements.mobileFilterOptions.hidden = false;
    } else {
      // Use desktop filter options
      this.elements.filterOptionsTitle.textContent = titles[filterType];
      this.elements.filterHint.textContent = hints[filterType];
      this.elements.filterOptions.hidden = false;
    }

    // Get items for this filter type
    const items = this.metadata[filterType] || [];

    // Update filter button active state (do this before early return for years)
    this.elements.filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });

    // Special rendering for years - show bar chart
    if (filterType === 'years') {
      this.renderYearChart(items, isMobile);
      return;
    }

    // Determine which container to use
    const chipsContainer = isMobile ? this.elements.mobileFilterOptionsChips : this.elements.filterOptionsChips;

    // Render chips for other filter types
    const isAndFilter = ['tags', 'creators', 'locations', 'destinations'].includes(filterType);
    chipsContainer.innerHTML = items.map(item => {
      const isActive = this.currentFilters[filterType].has(item);
      const activeClass = isActive ? (isAndFilter ? 'active-and' : 'active') : '';
      return `<span class="filter-chip ${activeClass}" data-filter="${filterType}" data-value="${this.escapeHtml(item)}">${this.escapeHtml(item)}</span>`;
    }).join('');

    // Add click handlers
    chipsContainer.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const filterType = chip.dataset.filter;
        const value = chip.dataset.value;

        // Single-selection filters: creators, locations, destinations
        const isSingleSelection = ['creators', 'locations', 'destinations'].includes(filterType);

        if (isSingleSelection) {
          // For single-selection filters: toggle if clicking same one, otherwise replace
          if (this.currentFilters[filterType].has(value)) {
            // Clicking the already-selected item: deselect it
            this.currentFilters[filterType].delete(value);
          } else {
            // Clicking a new item: clear and select it
            this.currentFilters[filterType].clear();
            this.currentFilters[filterType].add(value);
          }
          this.applyFilters();
          this.renderActiveFilters();
        } else {
          // Multi-selection filters: years, tags
          // Click always toggles (add if not present, remove if already selected)
          this.toggleFilter(filterType, value);
        }

        // Update the display
        this.showFilterOptions(filterType);
      });
    });
  }

  /**
   * Render year chart visualization
   */
  renderYearChart(years, isMobile = false) {
    // Determine which container to use
    const chipsContainer = isMobile ? this.elements.mobileFilterOptionsChips : this.elements.filterOptionsChips;

    // Count letters per year
    const yearCounts = {};
    years.forEach(year => {
      if (year && year !== 'Unknown') {
        yearCounts[year] = 0;
      }
    });

    this.letters.forEach(letter => {
      const yearStr = (letter.metadata.LetterDate?.[0] || '').trim();
      const year = yearStr ? yearStr.substring(0, 4) : '';
      if (year && yearCounts.hasOwnProperty(year)) {
        yearCounts[year]++;
      }
    });

    // Get sorted years (excluding unknowns)
    const sortedYears = Object.keys(yearCounts).sort();
    if (sortedYears.length === 0) {
      chipsContainer.innerHTML = '<p>No year data available</p>';
      return;
    }

    const minYear = parseInt(sortedYears[0]);
    const maxYear = parseInt(sortedYears[sortedYears.length - 1]);
    const yearRange = maxYear - minYear + 1;

    // Determine bar grouping based on available width
    const containerWidth = chipsContainer.offsetWidth || 800;
    const maxBars = Math.floor(containerWidth / 40); // Minimum 40px per bar
    const yearsPerBar = Math.max(1, Math.ceil(yearRange / maxBars));

    // Group years into bins
    const bins = [];
    for (let year = minYear; year <= maxYear; year += yearsPerBar) {
      const endYear = Math.min(year + yearsPerBar - 1, maxYear);
      let count = 0;
      const yearsInBin = [];

      for (let y = year; y <= endYear; y++) {
        const yearStr = y.toString();
        if (yearCounts[yearStr] !== undefined) {
          count += yearCounts[yearStr];
          if (yearCounts[yearStr] > 0) {
            yearsInBin.push(yearStr);
          }
        }
      }

      // Only add bins that have at least one letter
      if (count > 0) {
        bins.push({
          startYear: year,
          endYear: endYear,
          years: yearsInBin,
          count: count,
          label: yearsPerBar === 1 ? year.toString() : `${year}-${endYear}`
        });
      }
    }

    const maxCount = Math.max(...bins.map(b => b.count), 1);

    // Use square root scale to prevent outliers from compressing other bars
    const maxSqrt = Math.sqrt(maxCount);

    // Render chart
    const chartHTML = `
      <div class="year-chart">
        <div class="year-chart-bars">
          ${bins.map(bin => {
            // Square root scale for better visualization
            const sqrtValue = Math.sqrt(bin.count);
            const heightPercent = Math.max(8, (sqrtValue / maxSqrt) * 100);
            const isActive = bin.years.some(y => this.currentFilters.years.has(y));
            return `<div class="year-bar-container" title="${bin.label}: ${bin.count} letter${bin.count !== 1 ? 's' : ''}">
<div class="year-bar ${isActive ? 'active' : ''}" data-years="${bin.years.join(',')}" data-label="${bin.label}" style="height: ${heightPercent}%;">
<span class="year-bar-count">${bin.count > 0 ? bin.count : ''}</span>
</div>
<span class="year-bar-label">${bin.label}</span>
</div>`;
          }).join('')}
        </div>
      </div>
    `;

    chipsContainer.innerHTML = chartHTML;

    // Add click handlers
    chipsContainer.querySelectorAll('.year-bar').forEach(bar => {
      bar.addEventListener('click', (e) => {
        const years = bar.dataset.years.split(',');

        if (e.shiftKey) {
          // Shift+click: toggle these years
          years.forEach(year => {
            if (this.currentFilters.years.has(year)) {
              this.currentFilters.years.delete(year);
            } else {
              this.currentFilters.years.add(year);
            }
          });
        } else {
          // Normal click: clear all filters and select these years
          this.currentFilters.creators.clear();
          this.currentFilters.tags.clear();
          this.currentFilters.years.clear();
          this.currentFilters.locations.clear();
          this.currentFilters.destinations.clear();
          years.forEach(year => this.currentFilters.years.add(year));
        }

        this.applyFilters();
        this.renderActiveFilters();
        this.renderYearChart(this.metadata.years); // Re-render to show active state
      });
    });
  }

  /**
   * Hide filter options
   */
  hideFilterOptions() {
    this.elements.filterOptions.hidden = true;
    this.elements.mobileFilterOptions.hidden = true;
    this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
    this.currentOpenFilterType = null; // Clear tracked filter panel
  }

  /**
   * Toggle a filter on/off
   */
  toggleFilter(filterType, value) {
    if (this.currentFilters[filterType].has(value)) {
      this.currentFilters[filterType].delete(value);
    } else {
      this.currentFilters[filterType].add(value);
    }

    this.applyFilters();
    this.renderActiveFilters();
  }

  /**
   * Render active filters display
   * Note: Simple search (this.currentFilters.search) is NOT shown as a button here
   * It stays in the search box instead
   */
  renderActiveFilters() {
    const activeFilters = [];

    // Title search (quoted if contains spaces) - use 'n' prefix
    if (this.currentFilters.titleSearch) {
      const titleDisplay = this.currentFilters.titleSearch.includes(' ')
        ? `n:"${this.currentFilters.titleSearch}"`
        : `n:${this.currentFilters.titleSearch}`;
      activeFilters.push({ type: 'titleSearch', value: this.currentFilters.titleSearch, displayValue: titleDisplay });
    }

    // Text search (quoted if contains spaces)
    if (this.currentFilters.textSearch) {
      const textDisplay = this.currentFilters.textSearch.includes(' ')
        ? `text:"${this.currentFilters.textSearch}"`
        : `text:${this.currentFilters.textSearch}`;
      activeFilters.push({ type: 'textSearch', value: this.currentFilters.textSearch, displayValue: textDisplay });
    }

    // Years
    this.currentFilters.years.forEach(year => {
      activeFilters.push({ type: 'years', value: year, displayValue: `y:${year}` });
    });

    // Creators (use 'f' prefix for Active Filters on left)
    this.currentFilters.creators.forEach(creator => {
      const displayValue = creator.includes(' ') ? `f:"${creator}"` : `f:${creator}`;
      activeFilters.push({ type: 'creators', value: creator, displayValue });
    });

    // Tags
    this.currentFilters.tags.forEach(tag => {
      const displayValue = tag.includes(' ') ? `t:"${tag}"` : `t:${tag}`;
      activeFilters.push({ type: 'tags', value: tag, displayValue });
    });

    // Locations
    this.currentFilters.locations.forEach(location => {
      const displayValue = location.includes(' ') ? `l:"${location}"` : `l:${location}`;
      activeFilters.push({ type: 'locations', value: location, displayValue });
    });

    // Destinations
    this.currentFilters.destinations.forEach(destination => {
      const displayValue = destination.includes(' ') ? `d:"${destination}"` : `d:${destination}`;
      activeFilters.push({ type: 'destinations', value: destination, displayValue });
    });

    // NEGATIVE FILTERS (with isNegative flag for styling)

    // Negative simple search
    if (this.currentFilters.searchNegative) {
      activeFilters.push({
        type: 'searchNegative',
        value: this.currentFilters.searchNegative,
        displayValue: `!${this.currentFilters.searchNegative}`,
        isNegative: true
      });
    }

    // Negative years
    this.currentFilters.yearsNegative.forEach(year => {
      activeFilters.push({ type: 'yearsNegative', value: year, displayValue: `!y:${year}`, isNegative: true });
    });

    // Negative creators
    this.currentFilters.creatorsNegative.forEach(creator => {
      const displayValue = creator.includes(' ') ? `!f:"${creator}"` : `!f:${creator}`;
      activeFilters.push({ type: 'creatorsNegative', value: creator, displayValue, isNegative: true });
    });

    // Negative tags
    this.currentFilters.tagsNegative.forEach(tag => {
      const displayValue = tag.includes(' ') ? `!t:"${tag}"` : `!t:${tag}`;
      activeFilters.push({ type: 'tagsNegative', value: tag, displayValue, isNegative: true });
    });

    // Negative locations
    this.currentFilters.locationsNegative.forEach(location => {
      const displayValue = location.includes(' ') ? `!l:"${location}"` : `!l:${location}`;
      activeFilters.push({ type: 'locationsNegative', value: location, displayValue, isNegative: true });
    });

    // Negative destinations
    this.currentFilters.destinationsNegative.forEach(destination => {
      const displayValue = destination.includes(' ') ? `!d:"${destination}"` : `!d:${destination}`;
      activeFilters.push({ type: 'destinationsNegative', value: destination, displayValue, isNegative: true });
    });

    // Check if any filters are active (including simple search)
    const hasAnyFilters = activeFilters.length > 0 || this.currentFilters.search || this.currentFilters.searchNegative;

    // Show/hide active filters section
    if (activeFilters.length > 0) {
      this.elements.activeFilters.hidden = false;
      this.elements.activeFiltersList.innerHTML = activeFilters.map(filter => {
        const isAndFilter = ['tags', 'creators', 'locations', 'destinations'].includes(filter.type);
        const andClass = isAndFilter ? 'and-filter' : '';
        const negativeClass = filter.isNegative ? 'negative-filter' : '';
        return `<span class="filter-chip active-filter ${andClass} ${negativeClass}" data-type="${filter.type}" data-value="${this.escapeHtml(filter.value)}">
          ${this.escapeHtml(filter.displayValue)} <span class="remove">×</span>
        </span>`;
      }).join('');

      // Add click handlers to remove individual filters
      this.elements.activeFiltersList.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const type = chip.dataset.type;
          const value = chip.dataset.value;

          if (type === 'titleSearch') {
            this.currentFilters.titleSearch = '';
          } else if (type === 'textSearch') {
            this.currentFilters.textSearch = '';
          } else if (type === 'searchNegative') {
            this.currentFilters.searchNegative = '';
          } else {
            this.currentFilters[type].delete(value);
          }

          this.applyFilters();
          this.renderActiveFilters();

          // If the filter panel for this type is currently open, refresh it
          if (this.currentOpenFilterType === type) {
            this.showFilterOptions(type);
          }
        });
      });
    } else {
      this.elements.activeFilters.hidden = true;
    }

    // Show/hide reset button based on whether any filters are active (including simple search)
    if (this.elements.resetAllBtn) {
      this.elements.resetAllBtn.hidden = !hasAnyFilters;
    }

    // Update search summary
    this.updateSearchSummary();
  }

  /**
   * Update the search summary display
   */
  updateSearchSummary() {
    const summaryParts = [];

    // Special display for correspondence pairs (takes precedence)
    if (this.currentFilters.correspondencePair.length === 2) {
      const [loc1, loc2] = this.currentFilters.correspondencePair;
      summaryParts.push(`Letters between ${loc1} and ${loc2}`);
    }

    // Simple search (no prefix)
    if (this.currentFilters.search) {
      summaryParts.push(this.currentFilters.search);
    }

    // Negative simple search (with NOT prefix)
    if (this.currentFilters.searchNegative) {
      summaryParts.push(`NOT ${this.currentFilters.searchNegative}`);
    }

    // Title search (quoted if contains spaces)
    if (this.currentFilters.titleSearch) {
      if (this.currentFilters.titleSearch.includes(' ')) {
        summaryParts.push(`title:"${this.currentFilters.titleSearch}"`);
      } else {
        summaryParts.push(`title:${this.currentFilters.titleSearch}`);
      }
    }

    // Text search (quoted if contains spaces)
    if (this.currentFilters.textSearch) {
      if (this.currentFilters.textSearch.includes(' ')) {
        summaryParts.push(`text:"${this.currentFilters.textSearch}"`);
      } else {
        summaryParts.push(`text:${this.currentFilters.textSearch}`);
      }
    }

    // Filter by year (individual items)
    if (this.currentFilters.years.size > 0) {
      const years = Array.from(this.currentFilters.years).sort();
      years.forEach(year => summaryParts.push(`year:${year}`));
    }

    // Negative filter by year (with NOT prefix)
    if (this.currentFilters.yearsNegative.size > 0) {
      const years = Array.from(this.currentFilters.yearsNegative).sort();
      years.forEach(year => summaryParts.push(`NOT year:${year}`));
    }

    // Filter by creator (quote only if contains spaces)
    if (this.currentFilters.creators.size > 0) {
      const creators = Array.from(this.currentFilters.creators);
      creators.forEach(creator => {
        if (creator.includes(' ')) {
          summaryParts.push(`from:"${creator}"`);
        } else {
          summaryParts.push(`from:${creator}`);
        }
      });
    }

    // Negative filter by creator (with NOT prefix)
    if (this.currentFilters.creatorsNegative.size > 0) {
      const creators = Array.from(this.currentFilters.creatorsNegative);
      creators.forEach(creator => {
        if (creator.includes(' ')) {
          summaryParts.push(`NOT from:"${creator}"`);
        } else {
          summaryParts.push(`NOT from:${creator}`);
        }
      });
    }

    // Filter by tags (individual items, quoted if contains spaces)
    if (this.currentFilters.tags.size > 0) {
      const tags = Array.from(this.currentFilters.tags);
      tags.forEach(tag => {
        if (tag.includes(' ')) {
          summaryParts.push(`tag:"${tag}"`);
        } else {
          summaryParts.push(`tag:${tag}`);
        }
      });
    }

    // Negative filter by tags (with NOT prefix)
    if (this.currentFilters.tagsNegative.size > 0) {
      const tags = Array.from(this.currentFilters.tagsNegative);
      tags.forEach(tag => {
        if (tag.includes(' ')) {
          summaryParts.push(`NOT tag:"${tag}"`);
        } else {
          summaryParts.push(`NOT tag:${tag}`);
        }
      });
    }

    // Filter by location (quote only if contains spaces)
    if (this.currentFilters.locations.size > 0) {
      const locations = Array.from(this.currentFilters.locations);
      locations.forEach(location => {
        if (location.includes(' ')) {
          summaryParts.push(`location:"${location}"`);
        } else {
          summaryParts.push(`location:${location}`);
        }
      });
    }

    // Negative filter by location (with NOT prefix)
    if (this.currentFilters.locationsNegative.size > 0) {
      const locations = Array.from(this.currentFilters.locationsNegative);
      locations.forEach(location => {
        if (location.includes(' ')) {
          summaryParts.push(`NOT location:"${location}"`);
        } else {
          summaryParts.push(`NOT location:${location}`);
        }
      });
    }

    // Filter by destination (quote only if contains spaces)
    if (this.currentFilters.destinations.size > 0) {
      const destinations = Array.from(this.currentFilters.destinations);
      destinations.forEach(destination => {
        if (destination.includes(' ')) {
          summaryParts.push(`destination:"${destination}"`);
        } else {
          summaryParts.push(`destination:${destination}`);
        }
      });
    }

    // Negative filter by destination (with NOT prefix)
    if (this.currentFilters.destinationsNegative.size > 0) {
      const destinations = Array.from(this.currentFilters.destinationsNegative);
      destinations.forEach(destination => {
        if (destination.includes(' ')) {
          summaryParts.push(`NOT destination:"${destination}"`);
        } else {
          summaryParts.push(`NOT destination:${destination}`);
        }
      });
    }

    // Show or hide the summary
    if (summaryParts.length > 0) {
      this.elements.searchSummaryText.textContent = summaryParts.join(' ');
      this.elements.searchSummary.hidden = false;
    } else {
      this.elements.searchSummary.hidden = true;
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.currentFilters = {
      search: '',
      searchNegative: '',
      titleSearch: '',
      textSearch: '',
      creators: new Set(),
      tags: new Set(),
      years: new Set(),
      locations: new Set(),
      destinations: new Set(),
      dateRange: { before: null, after: null },
      letterIds: new Set(),
      correspondencePair: [],
      // Negative filters
      creatorsNegative: new Set(),
      tagsNegative: new Set(),
      yearsNegative: new Set(),
      locationsNegative: new Set(),
      destinationsNegative: new Set()
    };

    this.elements.searchBox.value = '';
    this.updateSearchClearButton();
    this.applyFilters();
    this.renderActiveFilters();
    this.hideFilterOptions();
  }

  /**
   * Apply current filters to letters
   */
  applyFilters() {
    // On mobile, close the sidebar when applying filters
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.elements.sidebar && this.elements.sidebar.classList.contains('open')) {
      this.elements.sidebar.classList.remove('open');
      this.elements.sidebarToggle.setAttribute('aria-expanded', 'false');

      const toggleText = this.elements.sidebarToggle.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = 'Filters & Search';
      }
    }

    this.filteredLetters = this.letters.filter(letter => {
      // Filter by specific letter IDs if set
      if (this.currentFilters.letterIds.size > 0) {
        if (!this.currentFilters.letterIds.has(String(letter.id))) {
          return false;
        }
      }

      // Filter by correspondence pair (special bidirectional filter for map links)
      // This handles pairs like Stjørdal ↔ Dell Rapids where we want letters going either direction
      if (this.currentFilters.correspondencePair.length === 2) {
        const [loc1, loc2] = this.currentFilters.correspondencePair;
        const location = (letter.metadata.Location?.[0] || '').trim().toLowerCase();
        const destination = (letter.metadata.Destination?.[0] || '').trim().toLowerCase();

        // Match if (location=loc1 AND destination=loc2) OR (location=loc2 AND destination=loc1)
        const matchesForward = location.includes(loc1.toLowerCase()) &&
                              destination.includes(loc2.toLowerCase());
        const matchesReverse = location.includes(loc2.toLowerCase()) &&
                              destination.includes(loc1.toLowerCase());

        if (!matchesForward && !matchesReverse) {
          return false;
        }
      }

      // Full-text search (simple search) - supports AND and quoted phrases
      if (this.currentFilters.search) {
        const searchableText = this.getSearchableText(letter);

        if (!this.matchesSearchQuery(searchableText, this.currentFilters.search)) {
          return false;
        }
      }

      // Advanced search: Title contains - supports AND and quoted phrases
      if (this.currentFilters.titleSearch) {
        const title = letter.metadata.Title?.[0] || '';
        if (!this.matchesSearchQuery(title, this.currentFilters.titleSearch)) {
          return false;
        }
      }

      // Advanced search: Text contains - supports AND and quoted phrases
      if (this.currentFilters.textSearch) {
        const text = letter.metadata.Text?.[0] || '';
        if (!this.matchesSearchQuery(text, this.currentFilters.textSearch)) {
          return false;
        }
      }

      // Filter by creators (partial match - creator name contains the search term)
      if (this.currentFilters.creators.size > 0) {
        const creators = (letter.metadata.Creator || [])
          .map(c => c.trim())
          .filter(c => !c.match(/Siri Lawson.*trans/i));

        // Check if any creator contains any of the search terms
        const hasMatchingCreator = Array.from(this.currentFilters.creators).some(searchTerm => {
          return creators.some(creator => creator.toLowerCase().includes(searchTerm.toLowerCase()));
        });

        if (!hasMatchingCreator) {
          return false;
        }
      }

      // Filter by tags (AND logic - letter must have ALL selected tags, partial match)
      if (this.currentFilters.tags.size > 0) {
        const tags = (letter.tags || []).map(t => t.trim());
        // Check if letter has ALL selected tags (using partial/contains matching)
        const hasAllTags = Array.from(this.currentFilters.tags).every(selectedTag =>
          tags.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))
        );
        if (!hasAllTags) {
          return false;
        }
      }

      // Filter by year
      if (this.currentFilters.years.size > 0) {
        const letterDate = (letter.metadata.LetterDate?.[0] || '').trim();
        const year = letterDate ? letterDate.substring(0, 4) : '';
        if (!this.currentFilters.years.has(year)) {
          return false;
        }
      }

      // Filter by location (partial match - location contains the search term)
      if (this.currentFilters.locations.size > 0) {
        const location = (letter.metadata.Location?.[0] || '').trim();
        if (!location) {
          return false;
        }

        // Check if location contains any of the search terms
        const hasMatchingLocation = Array.from(this.currentFilters.locations).some(searchTerm =>
          location.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (!hasMatchingLocation) {
          return false;
        }
      }

      // Filter by destination (partial match - destination contains the search term)
      if (this.currentFilters.destinations.size > 0) {
        const destination = (letter.metadata.Destination?.[0] || '').trim();
        if (!destination) {
          return false;
        }

        // Check if destination contains any of the search terms
        const hasMatchingDestination = Array.from(this.currentFilters.destinations).some(searchTerm =>
          destination.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (!hasMatchingDestination) {
          return false;
        }
      }

      // Filter by date range
      if (this.currentFilters.dateRange.before || this.currentFilters.dateRange.after) {
        const letterDate = letter.metadata.LetterDate?.[0];
        if (letterDate) {
          const date = new Date(letterDate);
          if (this.currentFilters.dateRange.before && date > new Date(this.currentFilters.dateRange.before)) {
            return false;
          }
          if (this.currentFilters.dateRange.after && date < new Date(this.currentFilters.dateRange.after)) {
            return false;
          }
        }
      }

      // NEGATIVE FILTERS - exclude letters that match these criteria

      // Negative simple search
      if (this.currentFilters.searchNegative) {
        const searchText = this.getSearchableText(letter).toLowerCase();
        const negativeTerms = this.currentFilters.searchNegative.split(' ').filter(t => t);
        // If ANY negative term matches, exclude this letter
        if (negativeTerms.some(term => searchText.includes(term.toLowerCase()))) {
          return false;
        }
      }

      // Negative creators
      if (this.currentFilters.creatorsNegative.size > 0) {
        const creators = (letter.metadata.Creator || [])
          .map(c => c.trim())
          .filter(c => !c.match(/Siri Lawson.*trans/i));

        // If ANY negative creator matches, exclude this letter
        const hasExcludedCreator = Array.from(this.currentFilters.creatorsNegative).some(searchTerm => {
          return creators.some(creator => creator.toLowerCase().includes(searchTerm.toLowerCase()));
        });

        if (hasExcludedCreator) {
          return false;
        }
      }

      // Negative tags
      if (this.currentFilters.tagsNegative.size > 0) {
        const tags = (letter.tags || []).map(t => t.trim());
        // If ANY negative tag matches, exclude this letter
        const hasExcludedTag = Array.from(this.currentFilters.tagsNegative).some(selectedTag =>
          tags.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))
        );
        if (hasExcludedTag) {
          return false;
        }
      }

      // Negative years
      if (this.currentFilters.yearsNegative.size > 0) {
        const letterDate = (letter.metadata.LetterDate?.[0] || '').trim();
        const year = letterDate ? letterDate.substring(0, 4) : '';
        if (this.currentFilters.yearsNegative.has(year)) {
          return false;
        }
      }

      // Negative locations
      if (this.currentFilters.locationsNegative.size > 0) {
        const location = (letter.metadata.Location?.[0] || '').trim();
        if (location) {
          const hasExcludedLocation = Array.from(this.currentFilters.locationsNegative).some(searchTerm =>
            location.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (hasExcludedLocation) {
            return false;
          }
        }
      }

      // Negative destinations
      if (this.currentFilters.destinationsNegative.size > 0) {
        const destination = (letter.metadata.Destination?.[0] || '').trim();
        if (destination) {
          const hasExcludedDestination = Array.from(this.currentFilters.destinationsNegative).some(searchTerm =>
            destination.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (hasExcludedDestination) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort filtered letters
    this.sortLetters();

    // Check if we need to load a specific letter from URL
    if (this.letterIdToLoad) {
      const letterId = this.letterIdToLoad;
      this.letterIdToLoad = null; // Clear the flag

      // Find the letter with this ID in the filtered results
      const letterIndex = this.filteredLetters.findIndex(letter => letter.id == letterId);
      if (letterIndex !== -1) {
        // Show the letter view
        this.currentIndex = letterIndex;
        this.currentView = 'letter';
        this.elements.listView.classList.remove('active');
        this.elements.letterView.classList.add('active');
        this.displayCurrentLetter();
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Update results count
        this.elements.resultsCount.textContent = this.filteredLetters.length;
        this.elements.resultsCountDisplay.textContent = `(${this.filteredLetters.length})`;

        // Update URL to reflect current state
        this.updateURL();
        return; // Skip the rest of the normal applyFilters logic
      }
    }

    // Reset to first letter
    this.currentIndex = 0;

    // Update results count
    this.elements.resultsCount.textContent = this.filteredLetters.length;
    this.elements.resultsCountDisplay.textContent = `(${this.filteredLetters.length})`;

    // Update view
    if (this.currentView === 'list') {
      this.renderLettersList();
    } else {
      this.displayCurrentLetter();
    }

    // Update URL to reflect current filters
    this.updateURL();
  }

  /**
   * Get searchable text from a letter (title, description, text)
   */
  getSearchableText(letter) {
    return [
      letter.metadata.Title?.[0] || '',
      letter.metadata.Description?.[0] || '',
      letter.metadata.Text?.[0] || ''
    ].join(' ');
  }

  /**
   * Sort filtered letters based on current sort mode
   */
  sortLetters() {
    this.filteredLetters.sort((a, b) => {
      switch (this.sortMode) {
        case 'date-asc':
          const dateA = a.metadata.LetterDate?.[0] || '';
          const dateB = b.metadata.LetterDate?.[0] || '';
          // Put empty dates at the end
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.localeCompare(dateB);

        case 'date-desc':
          const dateDscA = a.metadata.LetterDate?.[0] || '';
          const dateDscB = b.metadata.LetterDate?.[0] || '';
          // Put empty dates at the end
          if (!dateDscA && !dateDscB) return 0;
          if (!dateDscA) return 1;
          if (!dateDscB) return -1;
          return dateDscB.localeCompare(dateDscA);

        case 'creator':
          const creatorA = ((a.metadata.Creator || []).map(c => c.trim()).filter(c => !c.match(/Siri Lawson.*trans/i))[0] || '').trim();
          const creatorB = ((b.metadata.Creator || []).map(c => c.trim()).filter(c => !c.match(/Siri Lawson.*trans/i))[0] || '').trim();
          return creatorA.localeCompare(creatorB);

        case 'location':
          const locationA = (a.metadata.Location?.[0] || '').trim();
          const locationB = (b.metadata.Location?.[0] || '').trim();
          return locationA.localeCompare(locationB);

        case 'destination':
          const destinationA = (a.metadata.Destination?.[0] || '').trim();
          const destinationB = (b.metadata.Destination?.[0] || '').trim();
          return destinationA.localeCompare(destinationB);

        case 'length':
          const lengthA = (a.metadata.Text?.[0] || '').length;
          const lengthB = (b.metadata.Text?.[0] || '').length;
          return lengthB - lengthA; // Longest first

        default:
          return 0;
      }
    });
  }

  /**
   * Render letters list view
   */
  renderLettersList() {
    if (this.filteredLetters.length === 0) {
      this.elements.lettersList.innerHTML = '';
      this.elements.noResults.hidden = false;
      this.elements.listBottomNav.hidden = true;
      return;
    }

    this.elements.noResults.hidden = true;
    this.elements.listBottomNav.hidden = false;

    this.elements.lettersList.innerHTML = this.filteredLetters.map((letter, index) => {
      const title = (letter.metadata.Title?.[0] || 'Untitled').trim();
      const date = (letter.metadata.LetterDate?.[0] || '').trim();
      const year = date ? date.substring(0, 4) : '';
      const creatorsArray = (letter.metadata.Creator || [])
        .map(c => c.trim())
        .filter(c => !c.match(/Siri Lawson.*trans/i));
      const location = (letter.metadata.Location?.[0] || '').trim();
      const destination = (letter.metadata.Destination?.[0] || '').trim();

      // Create individually clickable creator links
      const creatorsHTML = creatorsArray.length > 0
        ? creatorsArray.map(creator =>
            `<span class="clickable-creator" data-filter="creators" data-value="${this.escapeHtml(creator)}">${this.escapeHtml(creator)}</span>`
          ).join('<span class="creator-separator">, </span>')
        : '';

      // Format date with clickable year
      const formattedDate = this.formatDate(date);
      let dateHTML;
      if (year && formattedDate !== 'Unknown date') {
        // Replace the year in the formatted date with a clickable span
        dateHTML = formattedDate.replace(year, `<span class="clickable-year" data-filter="years" data-value="${year}">${year}</span>`);
      } else {
        dateHTML = formattedDate;
      }

      return `
        <li class="letter-list-item" data-index="${index}" tabindex="0" role="button">
          <div class="letter-header">
            <h3>${this.escapeHtml(title)}</h3>
            <time datetime="${date}">${dateHTML}</time>
          </div>
          <div class="letter-meta">
            ${creatorsHTML ? `<span class="creator">From: ${creatorsHTML}</span>` : ''}
            ${location || destination ?
              `<span class="route-info">
                ${location ? `<span class="clickable-location" data-filter="locations" data-value="${this.escapeHtml(location)}">${this.escapeHtml(location)}</span>` : '<span>—</span>'}
                <span class="arrow">→</span>
                ${destination ? `<span class="clickable-destination" data-filter="destinations" data-value="${this.escapeHtml(destination)}">${this.escapeHtml(destination)}</span>` : '<span>—</span>'}
              </span>`
              : ''}
          </div>
          <div class="letter-tags">
            ${(letter.tags || []).slice(0, 20).map(tag =>
              `<span class="tag">${this.escapeHtml(tag)}</span>`
            ).join('')}
            ${letter.tags?.length > 20 ? `<span class="more">+${letter.tags.length - 20} more</span>` : ''}
          </div>
        </li>
      `;
    }).join('');

    // Add click handlers for letter items
    this.elements.lettersList.querySelectorAll('.letter-list-item').forEach(item => {
      const clickHandler = () => {
        const index = parseInt(item.dataset.index);
        this.showLetterView(index);
      };

      item.addEventListener('click', clickHandler);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      });
    });

    // Add click handlers for creator/location/destination/year links (prevent card click)
    this.elements.lettersList.querySelectorAll('.clickable-creator, .clickable-location, .clickable-destination, .clickable-year').forEach(elem => {
      elem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        e.preventDefault();
        const filterType = elem.dataset.filter;
        const value = elem.dataset.value;

        if (e.shiftKey) {
          // Shift+click: add this filter, keep others
          this.currentFilters[filterType].add(value);
        } else {
          // Normal click: clear ALL filters and add only this one
          this.currentFilters.creators.clear();
          this.currentFilters.tags.clear();
          this.currentFilters.years.clear();
          this.currentFilters.locations.clear();
          this.currentFilters.destinations.clear();
          this.currentFilters[filterType].add(value);
        }

        this.applyFilters();
        this.renderActiveFilters();
        this.updateURL();
        this.hideFilterOptions(); // Hide filter options since filters changed

        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /**
   * Display single letter view
   */
  displayCurrentLetter() {
    if (this.filteredLetters.length === 0) {
      this.elements.currentLetter.innerHTML = '<p>No letters found.</p>';
      return;
    }

    const letter = this.filteredLetters[this.currentIndex];

    const title = (letter.metadata.Title?.[0] || 'Untitled').trim();
    const date = (letter.metadata.LetterDate?.[0] || '').trim();
    const creators = (letter.metadata.Creator || [])
      .map(c => c.trim())
      .filter(c => !c.match(/Siri Lawson.*trans/i))
      .join(', ');
    const location = (letter.metadata.Location?.[0] || '').trim();
    const destination = (letter.metadata.Destination?.[0] || '').trim();

    const description = this.getDisplayText(
      letter.metadata.Description?.[0],
      '<-SPLITDESC->'
    );

    const text = this.getDisplayText(
      letter.metadata.Text?.[0],
      '<-SPLITTLETTER->'
    );

    // Collect search terms for highlighting (both phrases and individual words)
    const searchTermsForText = [];
    const searchTermsForDescription = [];

    // Simple search highlights in both description and text
    if (this.currentFilters.search) {
      const { phrases, words } = this.parseSearchQuery(this.currentFilters.search);
      searchTermsForText.push(...phrases, ...words);
      searchTermsForDescription.push(...phrases, ...words);
    }

    // Advanced textSearch only highlights in letter text
    if (this.currentFilters.textSearch) {
      const { phrases, words } = this.parseSearchQuery(this.currentFilters.textSearch);
      searchTermsForText.push(...phrases, ...words);
    }

    // PDF link
    const pdfLink = letter.files?.length && letter.files[0].filename
      ? `<div class="letter-pdf">
           <a href="pdfs/${letter.files[0].filename}" target="_blank" class="pdf-link">
             📄 View Original PDF
           </a>
         </div>`
      : '';

    // Tags
    const tagsHtml = letter.tags?.length
      ? `<footer class="letter-tags">
           <h4>Tags:</h4>
           ${letter.tags.map(tag =>
             `<span class="tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
           ).join(' ')}
         </footer>`
      : '';

    // TF-IDF terms (relatively distinct terms)
    let tfidfHtml = '';
    const showNorwegianTfidf = (this.languageMode === 'both' || this.languageMode === 'norwegian') && letter['norwegian-tfidf']?.length;
    const showEnglishTfidf = (this.languageMode === 'both' || this.languageMode === 'english') && letter['english-tfidf']?.length;

    if (showNorwegianTfidf || showEnglishTfidf) {
      const norwegianTermsHtml = showNorwegianTfidf
        ? letter['norwegian-tfidf'].map(item =>
            `<span class="tfidf-term tfidf-norwegian">${this.escapeHtml(item.term)}</span>`
          ).join(' ')
        : '';

      const englishTermsHtml = showEnglishTfidf
        ? letter['english-tfidf'].map(item =>
            `<span class="tfidf-term tfidf-english">${this.escapeHtml(item.term)}</span>`
          ).join(' ')
        : '';

      tfidfHtml = `<footer class="letter-tfidf">
           <h4>Relatively distinct terms (TF-IDF):</h4>
           ${norwegianTermsHtml}
           ${englishTermsHtml}
         </footer>`;
    }

    // Format date with clickable year
    const year = date ? date.substring(0, 4) : '';
    const formattedDate = this.formatDate(date);
    let dateHTML;
    if (year && formattedDate !== 'Unknown date') {
      // Replace the year in the formatted date with a clickable span
      dateHTML = formattedDate.replace(year, `<span class="clickable" data-filter="years" data-value="${year}">${year}</span>`);
    } else {
      dateHTML = formattedDate;
    }

    this.elements.currentLetter.innerHTML = `<header class="letter-header">
<div class="letter-title-row">
  <h2>${this.escapeHtml(title)}</h2>
  <span class="letter-id">ID: ${letter.id}</span>
</div>
<time datetime="${date}">${dateHTML}</time>
</header>
<div class="letter-metadata">
${creators ? `<p><strong>From:</strong> <span class="clickable" data-filter="creators" data-value="${this.escapeHtml(creators)}">${this.escapeHtml(creators)}</span></p>` : ''}
${location ? `<p><strong>Location:</strong> <span class="clickable" data-filter="locations" data-value="${this.escapeHtml(location)}">${this.escapeHtml(location)}</span></p>` : ''}
${destination ? `<p><strong>Destination:</strong> <span class="clickable" data-filter="destinations" data-value="${this.escapeHtml(destination)}">${this.escapeHtml(destination)}</span></p>` : ''}
</div>
${description ? `<section class="letter-description"><h3>Description</h3><div>${this.formatText(description, searchTermsForDescription)}</div></section>` : ''}
<section class="letter-text"><h3>Letter</h3><div>${this.formatText(text, searchTermsForText)}</div></section>
${pdfLink}
${tagsHtml}
${tfidfHtml}`;

    // Update navigation
    this.elements.currentIndex.textContent = this.currentIndex + 1;
    this.elements.totalLetters.textContent = this.filteredLetters.length;

    // Enable/disable navigation buttons
    this.elements.prevButton.disabled = this.currentIndex === 0;
    this.elements.nextButton.disabled = this.currentIndex === this.filteredLetters.length - 1;

    // Add click handlers for tags
    this.elements.currentLetter.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        const tagName = tag.dataset.tag;

        if (e.shiftKey) {
          // Shift+click: add tag, keep other filters
          this.currentFilters.tags.add(tagName);
        } else {
          // Normal click: clear all filters, add only this tag
          this.currentFilters.creators.clear();
          this.currentFilters.tags.clear();
          this.currentFilters.years.clear();
          this.currentFilters.locations.clear();
          this.currentFilters.destinations.clear();
          this.currentFilters.tags.add(tagName);
        }

        this.applyFilters();
        this.renderActiveFilters();
        this.hideFilterOptions(); // Hide filter options since filters changed
        this.showListView();
      });
    });

    // Add click handlers for TF-IDF terms
    this.elements.currentLetter.querySelectorAll('.tfidf-term').forEach(term => {
      term.addEventListener('click', () => {
        const searchTerm = term.textContent.trim();

        // Clear all filters and set search to the clicked term
        this.currentFilters.creators.clear();
        this.currentFilters.tags.clear();
        this.currentFilters.years.clear();
        this.currentFilters.locations.clear();
        this.currentFilters.destinations.clear();
        this.currentFilters.search = searchTerm;
        this.currentFilters.textSearch = '';

        // Update search input
        this.elements.searchBox.value = searchTerm;
        this.updateSearchClearButton();

        this.applyFilters();
        this.renderActiveFilters();
        this.hideFilterOptions(); // Hide filter options since filters changed
        this.showListView();
      });
    });

    // Add click handlers for clickable metadata (year, creator, location, destination)
    this.elements.currentLetter.querySelectorAll('.clickable').forEach(elem => {
      elem.addEventListener('click', (e) => {
        const filterType = elem.dataset.filter;
        const value = elem.dataset.value;

        if (e.shiftKey) {
          // Shift+click: add filter, keep others
          this.currentFilters[filterType].add(value);
        } else {
          // Normal click: clear all filters, add only this one
          this.currentFilters.creators.clear();
          this.currentFilters.tags.clear();
          this.currentFilters.years.clear();
          this.currentFilters.locations.clear();
          this.currentFilters.destinations.clear();
          this.currentFilters[filterType].add(value);
        }

        this.applyFilters();
        this.renderActiveFilters();
        this.hideFilterOptions(); // Hide filter options since filters changed
        this.showListView();
      });
    });
  }

  /**
   * Get display text based on language mode
   */
  getDisplayText(text, separator) {
    if (!text) return '';

    const parts = text.split(separator);
    const norwegian = parts[0]?.trim() || '';
    const english = parts[1]?.trim() || '';

    switch (this.languageMode) {
      case 'norwegian':
        return norwegian || english;

      case 'english':
        return english || norwegian;

      case 'both':
      default:
        if (norwegian && english) {
          return `${norwegian}\n───\n${english}`;
        }
        return norwegian || english;
    }
  }

  /**
   * Format text for display (preserve line breaks, trim excessive blank lines)
   */
  formatText(text, highlightTerms = null) {
    if (!text) return '';

    // Normalize line endings to \n
    let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove trailing/leading whitespace from each line and convert whitespace-only lines to empty lines
    normalized = normalized.split('\n').map(line => {
      const trimmed = line.trim();
      return trimmed === '' ? '' : line.trimEnd();
    }).join('\n');

    // Remove leading and trailing blank lines
    normalized = normalized.trim();

    // Replace any sequence of 2+ blank lines with just 1 blank line
    // This matches 2 or more consecutive newlines and replaces with just 2
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    let escaped = this.escapeHtml(normalized);

    // Apply highlighting if search terms provided
    if (highlightTerms && highlightTerms.length > 0) {
      escaped = this.highlightSearchTerms(escaped, highlightTerms);
    }

    return escaped;
  }

  /**
   * Highlight search terms in text
   */
  highlightSearchTerms(text, terms) {
    if (!text || !terms || terms.length === 0) return text;

    let result = text;
    terms.forEach(term => {
      if (!term || term.trim() === '') return;

      // For multi-word phrases, create a regex that allows any whitespace (including newlines) between words
      const words = term.trim().split(/\s+/);

      if (words.length > 1) {
        // Multi-word phrase - allow any whitespace between words
        const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const pattern = escapedWords.join('\\s+');
        const regex = new RegExp(`(${pattern})`, 'gi');
        result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
      } else {
        // Single word - escape and search
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
      }
    });

    return result;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return 'Unknown date';

    try {
      const trimmed = dateString.trim();

      // Check if date is only a year (YYYY)
      // Length 4 indicates just year (e.g., "1947" or "2000")
      if (trimmed.length === 4 && /^\d{4}$/.test(trimmed)) {
        return trimmed;
      }

      // Check if date is only year-month format (YYYY-MM or YYYY.MM)
      // Length 7 indicates no day (e.g., "1945-12" or "2000-11")
      if (trimmed.length === 7 && (trimmed.includes('-') || trimmed.includes('.'))) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      }

      // Full date with day
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show list view
   */
  showListView() {
    this.currentView = 'list';
    this.elements.listView.classList.add('active');
    this.elements.letterView.classList.remove('active');
    this.renderLettersList();
    // Update URL to remove letter parameter
    this.updateURL();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Show letter view
   */
  showLetterView(index) {
    this.currentIndex = index;
    this.currentView = 'letter';
    this.elements.listView.classList.remove('active');
    this.elements.letterView.classList.add('active');
    this.displayCurrentLetter();

    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Update URL to include letter ID
    this.updateURL();

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      this.elements.sidebar.classList.remove('open');
    }
  }

  /**
   * Navigate to previous letter
   */
  navigatePrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.displayCurrentLetter();
      this.updateURL();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Navigate to next letter
   */
  navigateNext() {
    if (this.currentIndex < this.filteredLetters.length - 1) {
      this.currentIndex++;
      this.displayCurrentLetter();
      this.updateURL();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(e) {
    // Don't handle if modal is open
    if (!this.elements.advancedSearchModal.hidden) return;

    // Only handle in letter view
    if (this.currentView !== 'letter') return;

    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.navigatePrevious();
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.navigateNext();
        break;

      case 'Escape':
        e.preventDefault();
        this.showListView();
        break;
    }
  }

  /**
   * Set language mode
   */
  setLanguageMode(mode) {
    this.languageMode = mode;

    // Update button states
    this.elements.languageToggle.forEach(button => {
      const isActive = button.dataset.lang === mode;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive);
    });

    // Re-render current view
    if (this.currentView === 'list') {
      this.renderLettersList();
    } else {
      this.displayCurrentLetter();
    }
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);

    // Initialize font size
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    this.setFontSize(savedFontSize);
  }

  /**
   * Increase font size
   */
  increaseFontSize() {
    const sizes = ['small', 'medium', 'large', 'xlarge', 'xxlarge', 'xxxlarge'];
    const currentIndex = sizes.indexOf(this.fontSize);
    if (currentIndex < sizes.length - 1) {
      this.setFontSize(sizes[currentIndex + 1]);
    }
  }

  /**
   * Decrease font size
   */
  decreaseFontSize() {
    const sizes = ['small', 'medium', 'large', 'xlarge', 'xxlarge', 'xxxlarge'];
    const currentIndex = sizes.indexOf(this.fontSize);
    if (currentIndex > 0) {
      this.setFontSize(sizes[currentIndex - 1]);
    }
  }

  /**
   * Set font size
   */
  setFontSize(size) {
    this.fontSize = size;
    // Remove existing font size classes from html element
    document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '').trim();
    document.documentElement.classList.add(`font-${size}`);
    localStorage.setItem('fontSize', size);
  }

  /**
   * Initialize sidebar state for mobile devices
   */
  initMobileSidebar() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Ensure sidebar starts closed on mobile
      this.elements.sidebar.classList.remove('open');
      this.elements.sidebarToggle.setAttribute('aria-expanded', 'false');

      // Update button text
      const toggleText = this.elements.sidebarToggle.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = 'Filters & Search';
      }
    }

    // Listen for window resize to handle transitions between mobile and desktop
    window.addEventListener('resize', () => {
      const nowMobile = window.innerWidth <= 768;

      if (nowMobile && !isMobile) {
        // Switched to mobile - close sidebar
        this.elements.sidebar.classList.remove('open');
        this.elements.sidebarToggle.setAttribute('aria-expanded', 'false');

        const toggleText = this.elements.sidebarToggle.querySelector('.toggle-text');
        if (toggleText) {
          toggleText.textContent = 'Filters & Search';
        }
      } else if (!nowMobile && isMobile) {
        // Switched to desktop - hide mobile filter options
        if (this.elements.mobileFilterOptions) {
          this.elements.mobileFilterOptions.hidden = true;
        }
        // Also close sidebar if it's open
        this.elements.sidebar.classList.remove('open');
        this.elements.sidebarToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /**
   * Toggle sidebar (mobile)
   */
  toggleSidebar() {
    this.elements.sidebar.classList.toggle('open');
    const isOpen = this.elements.sidebar.classList.contains('open');
    this.elements.sidebarToggle.setAttribute('aria-expanded', isOpen);

    // Update button text
    const toggleText = this.elements.sidebarToggle.querySelector('.toggle-text');
    if (toggleText) {
      toggleText.textContent = isOpen ? 'Hide Filters' : 'Filters & Search';
    }
  }

  /**
   * Update visibility of search clear button
   */
  updateSearchClearButton() {
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
      clearBtn.hidden = !this.elements.searchBox.value;
    }
  }

  /**
   * Update visibility of prefix hint
   * Shows hint if search box contains recognized filter prefixes or negative filters
   */
  updatePrefixHint(searchValue) {
    if (!this.elements.prefixHint) return;

    // Check if search value contains any filter prefixes or negative filters
    // Match: y:, f:, !y:, !f:, etc. (with colon) OR !word (simple negative like !Axel)
    const hasColonPrefix = /(?:!)?(?:from|f|creator|c|year|y|tag|t|location|l|destination|d|title|n|text):/i.test(searchValue);
    const hasSimpleNegative = /(?:^|\s)!\S+/.test(searchValue);

    this.elements.prefixHint.hidden = !(hasColonPrefix || hasSimpleNegative);
  }

  /**
   * Show advanced search modal
   */
  showAdvancedSearch() {
    // Close sidebar on mobile to ensure modal is fully visible
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.elements.sidebar) {
      this.elements.sidebar.classList.remove('open');
      this.elements.sidebarToggle?.setAttribute('aria-expanded', 'false');

      const toggleText = this.elements.sidebarToggle?.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = 'Filters & Search';
      }
    }

    this.elements.advancedSearchModal.hidden = false;
    this.elements.advancedSearchForm.querySelector('input').focus();
  }

  /**
   * Hide advanced search modal
   */
  hideAdvancedSearch() {
    this.elements.advancedSearchModal.hidden = true;
  }

  /**
   * Show search help modal
   */
  showSearchHelp() {
    // Close sidebar on mobile to ensure modal is fully visible
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.elements.sidebar) {
      this.elements.sidebar.classList.remove('open');
      this.elements.sidebarToggle?.setAttribute('aria-expanded', 'false');

      const toggleText = this.elements.sidebarToggle?.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = 'Filters & Search';
      }
    }

    this.elements.searchHelpModal.hidden = false;
  }

  /**
   * Hide search help modal
   */
  hideSearchHelp() {
    this.elements.searchHelpModal.hidden = true;
  }

  /**
   * Apply advanced search
   */
  /**
   * Normalize date input to YYYY-MM-DD format
   * Accepts: YYYY, YYYY-MM, or YYYY-MM-DD
   * For "after": year becomes Dec 31 of previous year, year-month becomes last day of previous month
   * For "before": year becomes Jan 1 of that year, year-month becomes first day of that month
   */
  normalizeDateInput(dateStr, isAfter = false) {
    if (!dateStr) return null;

    const trimmed = dateStr.trim();

    // Full date: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Year and month: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      if (isAfter) {
        // For "after YYYY-MM", use last day of previous month
        const [year, month] = trimmed.split('-').map(Number);
        if (month === 1) {
          // Previous year December
          return `${year - 1}-12-31`;
        } else {
          // Previous month's last day
          const prevMonth = month - 1;
          const lastDay = new Date(year, prevMonth, 0).getDate();
          return `${year}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }
      } else {
        // For "before YYYY-MM", use first day of that month
        return `${trimmed}-01`;
      }
    }

    // Year only: YYYY
    if (/^\d{4}$/.test(trimmed)) {
      if (isAfter) {
        // For "after YYYY", use Dec 31 of previous year
        const year = parseInt(trimmed);
        return `${year - 1}-12-31`;
      } else {
        // For "before YYYY", use Jan 1 of that year
        return `${trimmed}-01-01`;
      }
    }

    return null;
  }

  applyAdvancedSearch() {
    const formData = new FormData(this.elements.advancedSearchForm);

    // Build search string with new syntax
    const searchParts = [];

    const title = formData.get('title')?.trim();
    const text = formData.get('text')?.trim();
    const creator = formData.get('creator')?.trim();
    const tag = formData.get('tag')?.trim();
    const location = formData.get('location')?.trim();
    const destination = formData.get('destination')?.trim();
    const afterRaw = formData.get('after')?.trim();
    const beforeRaw = formData.get('before')?.trim();

    // Normalize date inputs
    const after = this.normalizeDateInput(afterRaw, true);
    const before = this.normalizeDateInput(beforeRaw, false);

    if (title) {
      searchParts.push(title.includes(' ') ? `title:"${title}"` : `title:${title}`);
    }
    if (text) {
      searchParts.push(text.includes(' ') ? `text:"${text}"` : `text:${text}`);
    }
    if (creator) searchParts.push(`from:"${creator}"`);
    if (tag) {
      if (tag.includes(' ')) {
        searchParts.push(`tag:"${tag}"`);
      } else {
        searchParts.push(`tag:${tag}`);
      }
    }
    if (location) searchParts.push(`location:"${location}"`);
    if (destination) searchParts.push(`destination:"${destination}"`);

    // Combine into search string
    const searchString = searchParts.join(' ');

    // Set the search box value
    this.elements.searchBox.value = searchString;

    // Parse and apply the search
    this.parseSearchBoxSyntax(searchString);

    // Date range (not supported in syntax yet, apply directly)
    if (after) this.currentFilters.dateRange.after = after;
    if (before) this.currentFilters.dateRange.before = before;

    // Apply filters
    this.applyFilters();
    this.renderActiveFilters();
    this.updateSearchClearButton();
    this.hideAdvancedSearch();
    this.showListView();

    // Reset form
    this.elements.advancedSearchForm.reset();
  }

  /**
   * Load filters from URL parameters
   */
  loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Load search
    const search = params.get('search');
    if (search) {
      this.currentFilters.search = search;
      this.elements.searchBox.value = search;
      this.updateSearchClearButton();
    }

    // Load advanced search fields
    const titleSearch = params.get('titleSearch');
    if (titleSearch) {
      this.currentFilters.titleSearch = titleSearch;
    }

    const textSearch = params.get('textSearch');
    if (textSearch) {
      this.currentFilters.textSearch = textSearch;
    }

    // Load filter arrays
    ['years', 'creators', 'tags', 'locations', 'destinations'].forEach(type => {
      const values = params.getAll(type);
      values.forEach(value => {
        this.currentFilters[type].add(value);
      });
    });

    // Load correspondence pair (special filter for map links)
    const pairLocations = params.getAll('pair');
    if (pairLocations.length === 2) {
      this.currentFilters.correspondencePair = pairLocations;
    }

    // Load letter IDs filter (semicolon-separated list)
    const ids = params.get('ids');
    if (ids) {
      ids.split(';').forEach(id => {
        if (id.trim()) {
          this.currentFilters.letterIds.add(id.trim());
        }
      });
    }

    // Load date range
    const dateBefore = params.get('before');
    const dateAfter = params.get('after');
    if (dateBefore) this.currentFilters.dateRange.before = dateBefore;
    if (dateAfter) this.currentFilters.dateRange.after = dateAfter;

    // Load sort mode
    const sort = params.get('sort');
    if (sort) {
      this.sortMode = sort;
      this.elements.sortBy.value = sort;
    }

    // Store letter ID to load after filters are applied
    this.letterIdToLoad = params.get('letter');
  }

  /**
   * Update URL to reflect current filters and current letter
   */
  updateURL() {
    const params = new URLSearchParams();

    // Add search
    if (this.currentFilters.search) {
      params.set('search', this.currentFilters.search);
    }

    // Add advanced search fields
    if (this.currentFilters.titleSearch) {
      params.set('titleSearch', this.currentFilters.titleSearch);
    }
    if (this.currentFilters.textSearch) {
      params.set('textSearch', this.currentFilters.textSearch);
    }

    // Add filter arrays
    ['years', 'creators', 'tags', 'locations', 'destinations'].forEach(type => {
      this.currentFilters[type].forEach(value => {
        params.append(type, value);
      });
    });

    // Add letter IDs filter (semicolon-separated)
    if (this.currentFilters.letterIds.size > 0) {
      params.set('ids', Array.from(this.currentFilters.letterIds).join(';'));
    }

    // Add correspondence pair (for bidirectional location ↔ destination filtering)
    if (this.currentFilters.correspondencePair.length === 2) {
      this.currentFilters.correspondencePair.forEach(loc => {
        params.append('pair', loc);
      });
    }

    // Add date range
    if (this.currentFilters.dateRange.before) {
      params.set('before', this.currentFilters.dateRange.before);
    }
    if (this.currentFilters.dateRange.after) {
      params.set('after', this.currentFilters.dateRange.after);
    }

    // Add sort mode if not default
    if (this.sortMode !== 'date-asc') {
      params.set('sort', this.sortMode);
    }

    // Add current letter if in letter view
    if (this.currentView === 'letter' && this.filteredLetters[this.currentIndex]) {
      params.set('letter', this.filteredLetters[this.currentIndex].id);
    }

    // Update URL without reloading page
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
  }

  /**
   * Show error message
   */
  showError(message) {
    this.elements.loading.innerHTML = `
      <div style="text-align: center; color: var(--color-error);">
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Parse search box syntax to extract special filters
   * Supports both full and abbreviated (case insensitive):
   * - from:/f:/creator:/c: creator
   * - year:/y: year
   * - tag:/t: tag
   * - location:/l: location
   * - destination:/d: destination
   * - title:/n: title (n for name)
   * - text: text content
   */
  parseSearchBoxSyntax(searchValue) {
    if (!searchValue) {
      this.currentFilters.search = '';
      this.currentFilters.searchNegative = '';
      this.currentFilters.titleSearch = '';
      this.currentFilters.textSearch = '';
      // Don't clear other filters - they may have been set via Browse by buttons
      return;
    }

    // Clear searchNegative at start - will be repopulated if ! terms are found
    this.currentFilters.searchNegative = '';

    // Extract special filter patterns (case insensitive)
    // Negative patterns use ! prefix (e.g., !y:1945, !f:Axel)
    const patterns = {
      from: /\b(?:from|f|creator|c):"([^"]+)"/gi,
      fromUnquoted: /\b(?:from|f|creator|c):([^"\s]+)/gi,
      fromNegative: /!\b(?:from|f|creator|c):"([^"]+)"/gi,
      fromNegativeUnquoted: /!\b(?:from|f|creator|c):([^"\s]+)/gi,
      year: /\b(?:year|y):(\d{4})/gi,
      yearNegative: /!\b(?:year|y):(\d{4})/gi,
      tag: /\b(?:tag|t):"([^"]+)"|\b(?:tag|t):([^"\s]+)/gi,
      tagNegative: /!\b(?:tag|t):"([^"]+)"|!\b(?:tag|t):([^"\s]+)/gi,
      location: /\b(?:location|l):"([^"]+)"/gi,
      locationUnquoted: /\b(?:location|l):([^"\s]+)/gi,
      locationNegative: /!\b(?:location|l):"([^"]+)"/gi,
      locationNegativeUnquoted: /!\b(?:location|l):([^"\s]+)/gi,
      destination: /\b(?:destination|d):"([^"]+)"/gi,
      destinationUnquoted: /\b(?:destination|d):([^"\s]+)/gi,
      destinationNegative: /!\b(?:destination|d):"([^"]+)"/gi,
      destinationNegativeUnquoted: /!\b(?:destination|d):([^"\s]+)/gi,
      title: /\b(?:title|n):"([^"]+)"|\b(?:title|n):([^"\s]+)/gi,
      text: /\btext:"([^"]+)"|\btext:([^"\s]+)/gi,
      simpleNegative: /!(\S+)/g  // Simple negative search like !Axel
    };

    let remainingSearch = searchValue;

    // Check which filters are present in the search string
    const hasYearFilter = patterns.year.test(searchValue);
    const hasFromFilter = patterns.from.test(searchValue) || patterns.fromUnquoted.test(searchValue);
    const hasTagFilter = patterns.tag.test(searchValue);
    const hasLocationFilter = patterns.location.test(searchValue) || patterns.locationUnquoted.test(searchValue);
    const hasDestinationFilter = patterns.destination.test(searchValue) || patterns.destinationUnquoted.test(searchValue);
    const hasTitleFilter = patterns.title.test(searchValue);
    const hasTextFilter = patterns.text.test(searchValue);

    // Check for negative filters
    const hasYearNegativeFilter = patterns.yearNegative.test(searchValue);
    const hasFromNegativeFilter = patterns.fromNegative.test(searchValue) || patterns.fromNegativeUnquoted.test(searchValue);
    const hasTagNegativeFilter = patterns.tagNegative.test(searchValue);
    const hasLocationNegativeFilter = patterns.locationNegative.test(searchValue) || patterns.locationNegativeUnquoted.test(searchValue);
    const hasDestinationNegativeFilter = patterns.destinationNegative.test(searchValue) || patterns.destinationNegativeUnquoted.test(searchValue);

    // Reset regex lastIndex after testing
    Object.values(patterns).forEach(p => p.lastIndex = 0);

    // Clear single-selection filters when they appear in search (replace behavior)
    // Multi-selection filters (years, tags) are NOT cleared - new values are appended
    if (hasFromFilter) this.currentFilters.creators.clear();
    if (hasLocationFilter) this.currentFilters.locations.clear();
    if (hasDestinationFilter) this.currentFilters.destinations.clear();
    if (hasTitleFilter) this.currentFilters.titleSearch = '';
    if (hasTextFilter) this.currentFilters.textSearch = '';

    // Clear negative filters when they appear
    if (hasFromNegativeFilter) this.currentFilters.creatorsNegative.clear();
    if (hasLocationNegativeFilter) this.currentFilters.locationsNegative.clear();
    if (hasDestinationNegativeFilter) this.currentFilters.destinationsNegative.clear();

    // IMPORTANT: Extract NEGATIVE filters FIRST to avoid double-matching
    // For example, !y:1945 should only match as negative, not both negative and positive

    let match;

    // Extract NEGATIVE filters first
    // Negative from: (creator) - quoted
    while ((match = patterns.fromNegative.exec(searchValue)) !== null) {
      this.currentFilters.creatorsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.fromNegative.lastIndex = 0;

    // Negative from: (creator) - unquoted
    while ((match = patterns.fromNegativeUnquoted.exec(searchValue)) !== null) {
      this.currentFilters.creatorsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.fromNegativeUnquoted.lastIndex = 0;

    // Negative year:
    while ((match = patterns.yearNegative.exec(searchValue)) !== null) {
      this.currentFilters.yearsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.yearNegative.lastIndex = 0;

    // Negative tag: (with or without quotes)
    while ((match = patterns.tagNegative.exec(searchValue)) !== null) {
      const tagValue = match[1] || match[2];
      if (tagValue) {
        this.currentFilters.tagsNegative.add(tagValue);
        remainingSearch = remainingSearch.replace(match[0], '');
      }
    }
    patterns.tagNegative.lastIndex = 0;

    // Negative location: - quoted
    while ((match = patterns.locationNegative.exec(searchValue)) !== null) {
      this.currentFilters.locationsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.locationNegative.lastIndex = 0;

    // Negative location: - unquoted
    while ((match = patterns.locationNegativeUnquoted.exec(searchValue)) !== null) {
      this.currentFilters.locationsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.locationNegativeUnquoted.lastIndex = 0;

    // Negative destination: - quoted
    while ((match = patterns.destinationNegative.exec(searchValue)) !== null) {
      this.currentFilters.destinationsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.destinationNegative.lastIndex = 0;

    // Negative destination: - unquoted
    while ((match = patterns.destinationNegativeUnquoted.exec(searchValue)) !== null) {
      this.currentFilters.destinationsNegative.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.destinationNegativeUnquoted.lastIndex = 0;

    // NOW extract POSITIVE filters from the remaining search string
    // Extract from: (creator) - quoted
    while ((match = patterns.from.exec(remainingSearch)) !== null) {
      this.currentFilters.creators.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.from.lastIndex = 0;

    // Extract from: (creator) - unquoted
    while ((match = patterns.fromUnquoted.exec(remainingSearch)) !== null) {
      this.currentFilters.creators.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.fromUnquoted.lastIndex = 0;

    // Extract year:
    while ((match = patterns.year.exec(remainingSearch)) !== null) {
      this.currentFilters.years.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.year.lastIndex = 0;

    // Extract tag: (with or without quotes)
    while ((match = patterns.tag.exec(remainingSearch)) !== null) {
      const tagValue = match[1] || match[2]; // match[1] is quoted, match[2] is unquoted
      if (tagValue) {
        this.currentFilters.tags.add(tagValue);
        remainingSearch = remainingSearch.replace(match[0], '');
      }
    }
    patterns.tag.lastIndex = 0;

    // Extract location: - quoted
    while ((match = patterns.location.exec(remainingSearch)) !== null) {
      this.currentFilters.locations.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.location.lastIndex = 0;

    // Extract location: - unquoted
    while ((match = patterns.locationUnquoted.exec(remainingSearch)) !== null) {
      this.currentFilters.locations.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.locationUnquoted.lastIndex = 0;

    // Extract destination: - quoted
    while ((match = patterns.destination.exec(remainingSearch)) !== null) {
      this.currentFilters.destinations.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.destination.lastIndex = 0;

    // Extract destination: - unquoted
    while ((match = patterns.destinationUnquoted.exec(remainingSearch)) !== null) {
      this.currentFilters.destinations.add(match[1]);
      remainingSearch = remainingSearch.replace(match[0], '');
    }
    patterns.destinationUnquoted.lastIndex = 0;

    // Extract title: (with or without quotes)
    if ((match = patterns.title.exec(remainingSearch)) !== null) {
      const titleValue = match[1] || match[2]; // match[1] is quoted, match[2] is unquoted
      if (titleValue) {
        this.currentFilters.titleSearch = titleValue;
        remainingSearch = remainingSearch.replace(match[0], '');
      }
    }
    patterns.title.lastIndex = 0;

    // Extract text: (with or without quotes)
    if ((match = patterns.text.exec(remainingSearch)) !== null) {
      const textValue = match[1] || match[2]; // match[1] is quoted, match[2] is unquoted
      if (textValue) {
        this.currentFilters.textSearch = textValue;
        remainingSearch = remainingSearch.replace(match[0], '');
      }
    }
    patterns.text.lastIndex = 0;

    // Extract simple negative searches (e.g., !Axel)
    // This should be done LAST to avoid matching prefix patterns
    // Use remainingSearch since all prefixed patterns have been extracted already
    let simpleNegativeTerms = [];
    while ((match = patterns.simpleNegative.exec(remainingSearch)) !== null) {
      const term = match[1];
      // Only add if it's not part of a prefix pattern (doesn't end with :)
      if (!term.endsWith(':') && !/^(?:from|f|creator|c|year|y|tag|t|location|l|destination|d|title|n|text):/i.test(term)) {
        simpleNegativeTerms.push(term);
        remainingSearch = remainingSearch.replace(match[0], '');
      }
    }
    this.currentFilters.searchNegative = simpleNegativeTerms.join(' ');
    patterns.simpleNegative.lastIndex = 0;

    // What remains is the simple search
    this.currentFilters.search = remainingSearch.trim();
  }

  /**
   * Parse search query to extract quoted phrases and individual words
   * Returns: { phrases: ['exact phrase'], words: ['word1', 'word2'] }
   */
  parseSearchQuery(query) {
    if (!query) return { phrases: [], words: [] };

    const phrases = [];
    const words = [];

    // Match quoted phrases (supports both single and double quotes)
    const quoteRegex = /"([^"]*)"|'([^']*)'/g;
    let match;
    let remainingQuery = query;

    // Extract quoted phrases
    while ((match = quoteRegex.exec(query)) !== null) {
      const phrase = (match[1] || match[2] || '').trim();
      if (phrase) {
        phrases.push(phrase);
      }
    }

    // Remove quoted phrases from query to get remaining words
    remainingQuery = query.replace(quoteRegex, ' ');

    // Split remaining text into individual words
    const individualWords = remainingQuery
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    words.push(...individualWords);

    return { phrases, words };
  }

  /**
   * Check if text matches search query with AND logic and phrase support
   * @param {string} text - Text to search in
   * @param {string} query - Search query (may contain quotes for exact phrases)
   * @returns {boolean} - True if all terms match
   */
  matchesSearchQuery(text, query) {
    if (!query || !text) return true;

    const lowerText = text.toLowerCase();
    const { phrases, words } = this.parseSearchQuery(query.toLowerCase());

    // All quoted phrases must be present (exact match)
    for (const phrase of phrases) {
      if (!lowerText.includes(phrase)) {
        return false;
      }
    }

    // All individual words must be present (AND logic)
    for (const word of words) {
      if (!lowerText.includes(word)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Debounce function for search input
   */
  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new LettersApp();
    window.app.init();
  });
} else {
  window.app = new LettersApp();
  window.app.init();
}
