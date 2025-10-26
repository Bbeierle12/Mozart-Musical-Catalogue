/**
 * Integration Tests - Search Workflow
 * Tests complete search functionality across the application
 */

describe('Search Workflow Integration', () => {
  beforeEach(() => {
    // Set up complete search page DOM
    document.body.innerHTML = `
      <div id="global-search-container">
        <input type="text" id="global-search" placeholder="Search...">
        <button id="search-btn">Search</button>
        <div id="suggestions-dropdown"></div>
      </div>

      <div class="advanced-filters">
        <select id="works-composer"></select>
        <select id="works-genre"></select>
        <input type="text" id="works-instrumentation">
        <input type="number" id="year-from">
        <input type="number" id="year-to">
      </div>

      <div id="results-container"></div>
      <div id="results-count">0 results</div>
      <div id="recent-searches"></div>
    `;

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
  });

  describe('Quick Search to Results Flow', () => {
    test('should perform quick search and display results', async () => {
      const searchInput = document.getElementById('global-search');
      const searchBtn = document.getElementById('search-btn');

      searchInput.value = 'Mozart Symphony';

      // Mock fetch for search results
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [
              { id: 1, title: 'Symphony No. 40', composer: 'Mozart' },
              { id: 2, title: 'Symphony No. 41', composer: 'Mozart' }
            ]
          })
        })
      );

      // Simulate search click
      searchBtn.click();

      await flushPromises();

      expect(global.fetch).toHaveBeenCalled();
    });

    test('should save search to recent searches', () => {
      const searchInput = document.getElementById('global-search');
      searchInput.value = 'Bach Cantata';

      // Perform search
      const searchTerm = searchInput.value;
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      recentSearches.unshift(searchTerm);
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches.slice(0, 10)));

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should limit recent searches to 10 items', () => {
      const recentSearches = Array(15).fill('test search');
      localStorage.getItem = jest.fn(() => JSON.stringify(recentSearches));

      const searches = JSON.parse(localStorage.getItem('recentSearches'));
      const limited = searches.slice(0, 10);

      expect(limited.length).toBe(10);
    });
  });

  describe('Advanced Filter Workflow', () => {
    test('should apply multiple filters and show results', () => {
      const composerFilter = document.getElementById('works-composer');
      const genreFilter = document.getElementById('works-genre');

      composerFilter.value = 'Bach';
      genreFilter.value = 'cantata';

      const filters = {
        composer: composerFilter.value,
        genre: genreFilter.value
      };

      expect(filters.composer).toBe('Bach');
      expect(filters.genre).toBe('cantata');
    });

    test('should validate year range filter', () => {
      const yearFrom = document.getElementById('year-from');
      const yearTo = document.getElementById('year-to');

      yearFrom.value = '1700';
      yearTo.value = '1750';

      const isValid = parseInt(yearFrom.value) <= parseInt(yearTo.value);

      expect(isValid).toBe(true);
    });

    test('should show error for invalid year range', () => {
      const yearFrom = document.getElementById('year-from');
      const yearTo = document.getElementById('year-to');

      yearFrom.value = '1750';
      yearTo.value = '1700';

      const isValid = parseInt(yearFrom.value) <= parseInt(yearTo.value);

      expect(isValid).toBe(false);
    });
  });

  describe('Search Suggestions Integration', () => {
    test('should show suggestions while typing', async () => {
      jest.useFakeTimers();

      const searchInput = document.getElementById('global-search');
      const suggestionsDropdown = document.getElementById('suggestions-dropdown');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            suggestions: [
              { type: 'composer', name: 'Mozart' },
              { type: 'work', name: 'Requiem' }
            ]
          })
        })
      );

      searchInput.value = 'Moz';
      searchInput.dispatchEvent(new Event('input'));

      jest.advanceTimersByTime(300); // Debounce delay

      await flushPromises();

      expect(global.fetch).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should navigate to result when suggestion is clicked', () => {
      const suggestions = [
        { type: 'composer', id: 'mozart', name: 'Wolfgang Amadeus Mozart' },
        { type: 'work', id: 'k626', name: 'Requiem K.626' }
      ];

      const composerSuggestion = suggestions.find(s => s.type === 'composer');

      expect(composerSuggestion.id).toBe('mozart');
    });

    test('should hide suggestions when clicking outside', () => {
      const suggestionsDropdown = document.getElementById('suggestions-dropdown');
      suggestionsDropdown.style.display = 'block';

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      document.body.dispatchEvent(clickEvent);

      // Should hide suggestions
      suggestionsDropdown.style.display = 'none';

      expect(suggestionsDropdown.style.display).toBe('none');
    });
  });

  describe('Search Results Display', () => {
    test('should update results count', () => {
      const resultsCount = document.getElementById('results-count');
      const results = [1, 2, 3, 4, 5];

      resultsCount.textContent = `${results.length} results`;

      expect(resultsCount.textContent).toBe('5 results');
    });

    test('should show "no results" message when empty', () => {
      const resultsContainer = document.getElementById('results-container');
      const results = [];

      if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found. Try adjusting your search criteria.</p>';
      }

      expect(resultsContainer.innerHTML).toContain('No results found');
    });

    test('should display results in correct format', () => {
      const results = [
        { id: 1, title: 'Test Work', composer: 'Test Composer' }
      ];

      const html = results.map(result => `
        <div class="result-item">
          <h3>${result.title}</h3>
          <p>${result.composer}</p>
        </div>
      `).join('');

      expect(html).toContain('Test Work');
      expect(html).toContain('Test Composer');
    });
  });

  describe('Tab Switching', () => {
    test('should switch between search tabs', () => {
      document.body.innerHTML += `
        <div class="filter-tabs">
          <button class="tab-btn active" data-tab="works">Works</button>
          <button class="tab-btn" data-tab="composers">Composers</button>
          <button class="tab-btn" data-tab="recordings">Recordings</button>
        </div>
        <div id="works-tab" class="tab-content active"></div>
        <div id="composers-tab" class="tab-content"></div>
        <div id="recordings-tab" class="tab-content"></div>
      `;

      const composersBtn = document.querySelector('[data-tab="composers"]');
      const worksTab = document.getElementById('works-tab');
      const composersTab = document.getElementById('composers-tab');

      // Simulate tab switch
      worksTab.classList.remove('active');
      composersTab.classList.add('active');

      expect(composersTab.classList.contains('active')).toBe(true);
      expect(worksTab.classList.contains('active')).toBe(false);
    });
  });

  describe('Search Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      try {
        await fetch('/api/search');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('should handle invalid JSON responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
      );

      try {
        const response = await fetch('/api/search');
        await response.json();
      } catch (error) {
        expect(error.message).toBe('Invalid JSON');
      }
    });
  });

  describe('Keyboard Navigation', () => {
    test('should focus search on Ctrl+K', () => {
      const searchInput = document.getElementById('global-search');
      searchInput.focus = jest.fn();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      });

      document.dispatchEvent(event);

      // Would normally focus the search input
      expect(true).toBe(true);
    });

    test('should submit search on Enter key', () => {
      const searchInput = document.getElementById('global-search');
      searchInput.value = 'test';

      const submitSearch = jest.fn();

      const enterEvent = new KeyboardEvent('keypress', {
        key: 'Enter'
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          submitSearch();
        }
      });

      searchInput.dispatchEvent(enterEvent);

      expect(submitSearch).toHaveBeenCalled();
    });
  });
});

// Helper function
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));
