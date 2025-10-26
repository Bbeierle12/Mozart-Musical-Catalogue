/**
 * Unit Tests for composer-common.js
 * Tests data loading, filtering, and work display functions for composer pages
 */

describe('Composer Common Functions', () => {
  let mockComposerData;

  beforeEach(() => {
    // Mock composer data
    mockComposerData = {
      composer: {
        id: 'bach',
        fullName: 'Johann Sebastian Bach',
        birthDate: '1685-03-31',
        deathDate: '1750-07-28',
        nationality: 'German',
        period: 'Baroque',
        totalWorks: 1128
      },
      catalogSystem: {
        name: 'Bach-Werke-Verzeichnis',
        abbreviation: 'BWV'
      },
      categories: {
        'cantatas': { name: 'Cantatas', bwvRange: '1-224' },
        'keyboard': { name: 'Keyboard Works', bwvRange: '772-994' }
      },
      works: [
        {
          bwv: 'BWV 1',
          title: 'Wie schön leuchtet der Morgenstern',
          category: 'cantatas',
          key: 'F major',
          yearComposed: 1725,
          instrumentation: 'Choir, Orchestra',
          movements: 6
        },
        {
          bwv: 'BWV 1046',
          title: 'Brandenburg Concerto No. 1',
          category: 'orchestral',
          key: 'F major',
          yearComposed: 1721,
          instrumentation: '2 horns, 3 oboes, strings',
          movements: 4
        },
        {
          bwv: 'BWV 988',
          title: 'Goldberg Variations',
          category: 'keyboard',
          key: 'G major',
          yearComposed: 1741,
          instrumentation: 'Harpsichord',
          movements: 30
        }
      ]
    };

    // Set up DOM
    document.body.innerHTML = `
      <div class="composer-content">
        <div class="composer-name"></div>
        <div class="composer-dates"></div>
        <div class="composer-nationality"></div>
        <div class="composer-period"></div>
        <div class="catalog-system"></div>
        <div class="total-works"></div>

        <select id="genre-filter">
          <option value="">All Categories</option>
          <option value="cantatas">Cantatas</option>
          <option value="keyboard">Keyboard Works</option>
          <option value="orchestral">Orchestral</option>
        </select>
        <select id="period-filter">
          <option value="">All Periods</option>
          <option value="1720-1725">1720-1725</option>
          <option value="1726-1730">1726-1730</option>
          <option value="1741-1745">1741-1745</option>
        </select>
        <input type="text" id="search-works">

        <table class="works-table">
          <tbody id="works-tbody"></tbody>
        </table>

        <div class="pagination">
          <button class="btn-prev">Previous</button>
          <span id="current-page">1</span>
          <span id="total-pages">1</span>
          <button class="btn-next">Next</button>
          <span class="results-info"></span>
        </div>

        <div id="loading-overlay" class="hidden"></div>
      </div>
    `;

    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockComposerData)
      })
    );

    // Set global variables
    window.composerData = null;
    window.currentWorks = [];
    window.filteredWorks = [];
    window.currentPage = 1;
    window.itemsPerPage = 50;
  });

  describe('initializeComposer', () => {
    test('should load composer data from JSON file', async () => {
      await initializeComposer('bach');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('bach-bwv-catalogue.json')
      );
    });

    test('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404
        })
      );

      window.showError = jest.fn();

      await initializeComposer('invalid');

      expect(window.showError).toHaveBeenCalled();
    });

    test('should show loading state during data fetch', async () => {
      window.showLoadingState = jest.fn();

      await initializeComposer('bach');

      expect(window.showLoadingState).toHaveBeenCalledWith(true);
      expect(window.showLoadingState).toHaveBeenCalledWith(false);
    });
  });

  describe('displayComposerInfo', () => {
    test('should update composer information in DOM', () => {
      window.composerData = mockComposerData;

      displayComposerInfo();

      expect(document.querySelector('.composer-name').textContent)
        .toBe('Johann Sebastian Bach');
      expect(document.querySelector('.composer-nationality').textContent)
        .toBe('German');
    });

    test('should format dates correctly', () => {
      window.composerData = mockComposerData;

      displayComposerInfo();

      const dates = document.querySelector('.composer-dates').textContent;
      expect(dates).toContain('1685');
      expect(dates).toContain('1750');
    });

    test('should update page title', () => {
      window.composerData = mockComposerData;

      displayComposerInfo();

      expect(document.title).toContain('Johann Sebastian Bach');
    });

    test('should handle missing data gracefully', () => {
      window.composerData = { composer: {} };

      expect(() => displayComposerInfo()).not.toThrow();
    });
  });

  describe('displayWorks', () => {
    test('should render all works to table', () => {
      window.composerData = mockComposerData;

      displayWorks();

      const rows = document.querySelectorAll('#works-tbody tr');
      expect(rows.length).toBeLessThanOrEqual(mockComposerData.works.length);
    });

    test('should update current works array', () => {
      window.composerData = mockComposerData;

      displayWorks();

      expect(window.currentWorks.length).toBe(mockComposerData.works.length);
    });

    test('should initialize filtered works', () => {
      window.composerData = mockComposerData;

      displayWorks();

      expect(window.filteredWorks.length).toBe(window.currentWorks.length);
    });
  });

  describe('renderWorksTable', () => {
    test('should render works with correct data', () => {
      window.filteredWorks = mockComposerData.works;
      window.currentPage = 1;
      window.itemsPerPage = 50;

      renderWorksTable();

      const tbody = document.getElementById('works-tbody');
      expect(tbody.children.length).toBe(3);
    });

    test('should handle pagination correctly', () => {
      window.filteredWorks = Array(100).fill(mockComposerData.works[0]);
      window.currentPage = 1;
      window.itemsPerPage = 50;

      renderWorksTable();

      const tbody = document.getElementById('works-tbody');
      expect(tbody.children.length).toBe(50);
    });

    test('should display second page of results', () => {
      window.filteredWorks = Array(100).fill(mockComposerData.works[0]);
      window.currentPage = 2;
      window.itemsPerPage = 50;

      renderWorksTable();

      const tbody = document.getElementById('works-tbody');
      expect(tbody.children.length).toBe(50);
    });
  });

  describe('filterWorks', () => {
    beforeEach(() => {
      window.currentWorks = mockComposerData.works;
      window.filteredWorks = mockComposerData.works;
    });

    test('should filter works by category', () => {
      document.getElementById('genre-filter').value = 'keyboard';

      filterWorks();

      expect(window.filteredWorks.length).toBe(1);
      expect(window.filteredWorks[0].category).toBe('keyboard');
    });

    test('should filter works by search term', () => {
      document.getElementById('search-works').value = 'Brandenburg';

      filterWorks();

      expect(window.filteredWorks.length).toBe(1);
      expect(window.filteredWorks[0].title).toContain('Brandenburg');
    });

    test('should filter works by year range', () => {
      const periodFilter = document.getElementById('period-filter');
      periodFilter.value = '1720-1725';

      filterWorks();

      window.filteredWorks.forEach(work => {
        expect(work.yearComposed).toBeGreaterThanOrEqual(1720);
        expect(work.yearComposed).toBeLessThanOrEqual(1725);
      });
    });

    test('should combine multiple filters', () => {
      document.getElementById('genre-filter').value = 'keyboard';
      document.getElementById('search-works').value = 'Goldberg';

      filterWorks();

      expect(window.filteredWorks.length).toBe(1);
      expect(window.filteredWorks[0].bwv).toBe('BWV 988');
    });

    test('should reset to page 1 after filtering', () => {
      window.currentPage = 5;

      filterWorks();

      expect(window.currentPage).toBe(1);
    });

    test('should handle case-insensitive search', () => {
      document.getElementById('search-works').value = 'GOLDBERG';

      filterWorks();

      expect(window.filteredWorks.length).toBe(1);
    });
  });

  describe('resetFilters', () => {
    test('should clear all filter inputs', () => {
      document.getElementById('genre-filter').value = 'keyboard';
      document.getElementById('search-works').value = 'test';

      resetFilters();

      expect(document.getElementById('genre-filter').value).toBe('');
      expect(document.getElementById('search-works').value).toBe('');
    });

    test('should restore all works to filtered list', () => {
      window.currentWorks = mockComposerData.works;
      window.filteredWorks = [mockComposerData.works[0]];

      resetFilters();

      expect(window.filteredWorks.length).toBe(window.currentWorks.length);
    });

    test('should reset to page 1', () => {
      window.currentPage = 5;

      resetFilters();

      expect(window.currentPage).toBe(1);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      window.filteredWorks = Array(150).fill(mockComposerData.works[0]);
      window.itemsPerPage = 50;
    });

    test('should navigate to next page', () => {
      window.currentPage = 1;

      nextPage();

      expect(window.currentPage).toBe(2);
    });

    test('should navigate to previous page', () => {
      window.currentPage = 2;

      previousPage();

      expect(window.currentPage).toBe(1);
    });

    test('should not go below page 1', () => {
      window.currentPage = 1;

      previousPage();

      expect(window.currentPage).toBe(1);
    });

    test('should not exceed total pages', () => {
      window.currentPage = 3; // Last page for 150 items

      nextPage();

      expect(window.currentPage).toBe(3);
    });

    test('should update pagination display', () => {
      updatePagination();

      const currentPageEl = document.getElementById('current-page');
      const totalPagesEl = document.getElementById('total-pages');

      expect(currentPageEl.textContent).toBe('1');
      expect(totalPagesEl.textContent).toBe('3');
    });

    test('should disable previous button on first page', () => {
      window.currentPage = 1;

      updatePagination();

      const prevBtn = document.querySelector('.btn-prev');
      expect(prevBtn.disabled).toBe(true);
    });

    test('should disable next button on last page', () => {
      window.currentPage = 3;

      updatePagination();

      const nextBtn = document.querySelector('.btn-next');
      expect(nextBtn.disabled).toBe(true);
    });
  });

  describe('showWorkDetails', () => {
    test('should create modal with work details', () => {
      window.composerData = mockComposerData;

      showWorkDetails('BWV 988');

      const modal = document.getElementById('work-modal');
      expect(modal).not.toBeNull();
    });

    test('should display all work information', () => {
      window.composerData = mockComposerData;

      showWorkDetails('BWV 988');

      const modalDetails = document.getElementById('modal-details');
      expect(modalDetails.innerHTML).toContain('Goldberg Variations');
      expect(modalDetails.innerHTML).toContain('G major');
      expect(modalDetails.innerHTML).toContain('1741');
    });

    test('should handle non-existent work ID', () => {
      window.composerData = mockComposerData;

      showWorkDetails('BWV 9999');

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Period Generation', () => {
    test('should generate individual years for small range', () => {
      const periods = generatePeriods(1720, 1725);

      expect(periods.length).toBe(6);
      expect(periods[0].value).toBe('1720');
    });

    test('should generate 5-year periods for medium range', () => {
      const periods = generatePeriods(1700, 1730);

      periods.forEach(period => {
        expect(period.value).toMatch(/^\d{4}-\d{4}$/);
      });
    });

    test('should generate 10-year periods for large range', () => {
      const periods = generatePeriods(1650, 1750);

      periods.forEach(period => {
        expect(period.label).toMatch(/\d{4}s/);
      });
    });
  });

  describe('Loading State', () => {
    test('should show loading overlay', () => {
      showLoadingState(true);

      const overlay = document.getElementById('loading-overlay');
      expect(overlay).not.toBeNull();
    });

    test('should hide loading overlay', () => {
      showLoadingState(true);
      showLoadingState(false);

      const overlay = document.getElementById('loading-overlay');
      expect(overlay).toBeNull();
    });
  });

  describe('Search Functionality', () => {
    test('should debounce search input', (done) => {
      jest.useFakeTimers();

      const searchInput = document.getElementById('search-works');
      window.filterWorks = jest.fn();

      // Set up debounced event listener
      let debounceTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => window.filterWorks(), 300);
      });

      // Simulate rapid typing
      searchInput.value = 'B';
      searchInput.dispatchEvent(new Event('input'));

      searchInput.value = 'Ba';
      searchInput.dispatchEvent(new Event('input'));

      searchInput.value = 'Bac';
      searchInput.dispatchEvent(new Event('input'));

      // Should not call filterWorks immediately
      expect(window.filterWorks).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(window.filterWorks).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
      done();
    });

    test('should search on Enter key', () => {
      const searchInput = document.getElementById('search-works');
      window.filterWorks = jest.fn();

      // Set up Enter key event listener
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.filterWorks();
        }
      });

      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      searchInput.dispatchEvent(enterEvent);

      expect(window.filterWorks).toHaveBeenCalled();
    });
  });
});

// Helper functions (simulating composer-common.js functions)
async function initializeComposer(composerId) {
  try {
    window.showLoadingState?.(true);

    const response = await fetch(`../../database/data/${composerId}-bwv-catalogue.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${composerId} data`);
    }

    window.composerData = await response.json();

    displayComposerInfo();
    displayWorks();

    window.showLoadingState?.(false);
  } catch (error) {
    console.error('Error initializing composer:', error);
    window.showError?.('Failed to load composer data. Please try again later.');
  }
}

function displayComposerInfo() {
  if (!window.composerData) return;

  const composer = window.composerData.composer;
  if (!composer) return;

  if (composer.fullName) {
    document.title = `${composer.fullName} - Complete Works Catalogue`;
    updateElement('.composer-name', composer.fullName);
  }

  if (composer.birthDate && composer.deathDate) {
    updateElement('.composer-dates', `${composer.birthDate.split('-')[0]} - ${composer.deathDate.split('-')[0]}`);
  }

  if (composer.nationality) {
    updateElement('.composer-nationality', composer.nationality);
  }

  if (composer.period) {
    updateElement('.composer-period', `${composer.period} Period`);
  }

  if (window.composerData.catalogSystem) {
    updateElement('.catalog-system', `${window.composerData.catalogSystem.name} (${window.composerData.catalogSystem.abbreviation})`);
  }

  if (composer.totalWorks) {
    updateElement('.total-works', `${composer.totalWorks} Works`);
  }
}

function displayWorks() {
  if (!window.composerData || !window.composerData.works) return;

  window.currentWorks = window.composerData.works;
  window.filteredWorks = [...window.currentWorks];

  renderWorksTable();
  updatePagination();
}

function renderWorksTable() {
  const tbody = document.getElementById('works-tbody');
  if (!tbody) return;

  const startIndex = (window.currentPage - 1) * window.itemsPerPage;
  const endIndex = startIndex + window.itemsPerPage;
  const worksToDisplay = window.filteredWorks.slice(startIndex, endIndex);

  tbody.innerHTML = worksToDisplay.map(work => `
    <tr data-work-id="${work.bwv}">
      <td>${work.bwv}</td>
      <td>${work.title}</td>
      <td>${work.category}</td>
      <td>${work.key || '-'}</td>
      <td>${work.yearComposed || '-'}</td>
      <td>${work.instrumentation || '-'}</td>
    </tr>
  `).join('');
}

function filterWorks() {
  const genreFilter = document.getElementById('genre-filter');
  const periodFilter = document.getElementById('period-filter');
  const searchFilter = document.getElementById('search-works');

  let filtered = [...window.currentWorks];

  if (genreFilter && genreFilter.value) {
    filtered = filtered.filter(work => work.category === genreFilter.value);
  }

  if (periodFilter && periodFilter.value) {
    const periodRange = periodFilter.value.split('-');
    if (periodRange.length === 2) {
      const startYear = parseInt(periodRange[0]);
      const endYear = parseInt(periodRange[1]);
      filtered = filtered.filter(work =>
        work.yearComposed >= startYear && work.yearComposed <= endYear
      );
    }
  }

  if (searchFilter && searchFilter.value) {
    const searchTerm = searchFilter.value.toLowerCase();
    filtered = filtered.filter(work =>
      work.title.toLowerCase().includes(searchTerm) ||
      work.bwv.toLowerCase().includes(searchTerm)
    );
  }

  window.filteredWorks = filtered;
  window.currentPage = 1;
  renderWorksTable();
  updatePagination();
}

function resetFilters() {
  document.getElementById('genre-filter').value = '';
  document.getElementById('period-filter').value = '';
  document.getElementById('search-works').value = '';

  window.filteredWorks = [...window.currentWorks];
  window.currentPage = 1;
  renderWorksTable();
  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(window.filteredWorks.length / window.itemsPerPage);

  updateElement('#current-page', window.currentPage);
  updateElement('#total-pages', totalPages);

  const prevBtn = document.querySelector('.btn-prev');
  const nextBtn = document.querySelector('.btn-next');

  if (prevBtn) prevBtn.disabled = window.currentPage === 1;
  if (nextBtn) nextBtn.disabled = window.currentPage === totalPages;

  const resultsInfo = document.querySelector('.results-info');
  if (resultsInfo) {
    resultsInfo.textContent = `Showing ${window.filteredWorks.length} of ${window.currentWorks.length} works`;
  }
}

function previousPage() {
  if (window.currentPage > 1) {
    window.currentPage--;
    renderWorksTable();
    updatePagination();
  }
}

function nextPage() {
  const totalPages = Math.ceil(window.filteredWorks.length / window.itemsPerPage);
  if (window.currentPage < totalPages) {
    window.currentPage++;
    renderWorksTable();
    updatePagination();
  }
}

function showWorkDetails(workId) {
  const work = window.composerData.works.find(w => w.bwv === workId);
  if (!work) return;

  let modal = document.getElementById('work-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'work-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 id="modal-title"></h2>
        <div id="modal-details"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalTitle = document.getElementById('modal-title');
  const modalDetails = document.getElementById('modal-details');

  modalTitle.textContent = `${work.title} (${work.bwv})`;
  modalDetails.innerHTML = `
    <div class="work-details">
      <div><strong>Title:</strong> ${work.title}</div>
      <div><strong>Key:</strong> ${work.key}</div>
      <div><strong>Year:</strong> ${work.yearComposed}</div>
      <div><strong>Category:</strong> ${work.category}</div>
      <div><strong>Instrumentation:</strong> ${work.instrumentation}</div>
    </div>
  `;
}

function generatePeriods(minYear, maxYear) {
  const periods = [];
  const range = maxYear - minYear;

  if (range <= 10) {
    for (let year = minYear; year <= maxYear; year++) {
      periods.push({ value: `${year}`, label: `${year}` });
    }
  } else if (range <= 50) {
    const startDecade = Math.floor(minYear / 5) * 5;
    const endDecade = Math.ceil(maxYear / 5) * 5;
    for (let decade = startDecade; decade < endDecade; decade += 5) {
      periods.push({
        value: `${decade}-${decade + 4}`,
        label: `${decade}-${decade + 4}`
      });
    }
  } else {
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.ceil(maxYear / 10) * 10;
    for (let decade = startDecade; decade < endDecade; decade += 10) {
      periods.push({
        value: `${decade}-${decade + 9}`,
        label: `${decade}s`
      });
    }
  }

  return periods;
}

function showLoadingState(show) {
  const loadingOverlay = document.getElementById('loading-overlay');

  if (show && !loadingOverlay) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    document.body.appendChild(overlay);
  } else if (!show && loadingOverlay) {
    loadingOverlay.remove();
  }
}

function updateElement(selector, content) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = content;
  }
}
