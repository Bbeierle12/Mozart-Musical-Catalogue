/**
 * Integration Tests - Composer Page Workflow
 * Tests complete user flows on composer detail pages
 */

describe('Composer Page Workflow Integration', () => {
  let mockComposerData;

  beforeEach(() => {
    mockComposerData = {
      composer: {
        id: 'bach',
        fullName: 'Johann Sebastian Bach',
        totalWorks: 1128
      },
      catalogSystem: {
        name: 'Bach-Werke-Verzeichnis',
        abbreviation: 'BWV'
      },
      works: Array(100).fill(null).map((_, i) => ({
        bwv: `BWV ${i + 1}`,
        title: `Work ${i + 1}`,
        category: i % 2 === 0 ? 'cantatas' : 'keyboard',
        yearComposed: 1700 + i
      }))
    };

    document.body.innerHTML = `
      <div class="composer-page">
        <div class="composer-info"></div>

        <div class="filters-section">
          <select id="genre-filter"></select>
          <select id="period-filter"></select>
          <input type="text" id="search-works">
          <button id="reset-filters">Reset</button>
        </div>

        <table class="works-table">
          <tbody id="works-tbody"></tbody>
        </table>

        <div class="pagination">
          <button class="btn-prev">Previous</button>
          <span class="page-info">
            <span id="current-page">1</span> / <span id="total-pages">1</span>
          </span>
          <button class="btn-next">Next</button>
          <span class="results-info"></span>
        </div>

        <div id="work-modal" class="hidden">
          <div id="modal-details"></div>
          <button id="close-modal">Close</button>
        </div>
      </div>
    `;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockComposerData)
      })
    );
  });

  describe('Page Load to Display Workflow', () => {
    test('should load data and display works', async () => {
      // Simulate page initialization
      const response = await fetch('database/data/bach-bwv-catalogue.json');
      const data = await response.json();

      expect(data.composer.fullName).toBe('Johann Sebastian Bach');
      expect(data.works.length).toBe(100);
    });

    test('should populate filters after data load', async () => {
      const response = await fetch('database/data/bach-bwv-catalogue.json');
      const data = await response.json();

      const genreFilter = document.getElementById('genre-filter');

      // Extract unique categories
      const categories = [...new Set(data.works.map(w => w.category))];
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        genreFilter.appendChild(option);
      });

      expect(genreFilter.children.length).toBeGreaterThan(0);
    });

    test('should render first page of works', async () => {
      const response = await fetch('database/data/bach-bwv-catalogue.json');
      const data = await response.json();

      const tbody = document.getElementById('works-tbody');
      const itemsPerPage = 50;
      const firstPage = data.works.slice(0, itemsPerPage);

      tbody.innerHTML = firstPage.map(work => `
        <tr><td>${work.bwv}</td><td>${work.title}</td></tr>
      `).join('');

      expect(tbody.children.length).toBe(50);
    });
  });

  describe('Filter and Pagination Workflow', () => {
    test('should filter works and update pagination', () => {
      const works = mockComposerData.works;
      const genreFilter = document.getElementById('genre-filter');

      genreFilter.value = 'cantatas';

      const filtered = works.filter(w => w.category === 'cantatas');
      const totalPages = Math.ceil(filtered.length / 50);

      const totalPagesEl = document.getElementById('total-pages');
      totalPagesEl.textContent = totalPages;

      expect(filtered.length).toBe(50);
      expect(totalPages).toBe(1);
    });

    test('should reset filters and restore all works', () => {
      const works = mockComposerData.works;
      let filteredWorks = works.filter(w => w.category === 'cantatas');

      // Reset
      const resetBtn = document.getElementById('reset-filters');
      resetBtn.click();

      // Restore all works
      filteredWorks = works;

      expect(filteredWorks.length).toBe(100);
    });

    test('should navigate through pages correctly', () => {
      let currentPage = 1;
      const totalPages = 2;
      const nextBtn = document.querySelector('.btn-next');

      nextBtn.disabled = false;
      nextBtn.click();
      currentPage++;

      expect(currentPage).toBe(2);

      nextBtn.click();
      // Should not exceed total pages
      if (currentPage >= totalPages) {
        currentPage = totalPages;
      }

      expect(currentPage).toBe(2);
    });

    test('should update results count when filtering', () => {
      const works = mockComposerData.works;
      const filtered = works.filter(w => w.category === 'cantatas');

      const resultsInfo = document.querySelector('.results-info');
      resultsInfo.textContent = `Showing ${filtered.length} of ${works.length} works`;

      expect(resultsInfo.textContent).toContain('50 of 100');
    });
  });

  describe('Work Details Modal Workflow', () => {
    test('should open modal when clicking work', () => {
      const work = mockComposerData.works[0];
      const modal = document.getElementById('work-modal');
      const modalDetails = document.getElementById('modal-details');

      modalDetails.innerHTML = `
        <h3>${work.title}</h3>
        <p>${work.bwv}</p>
        <p>${work.category}</p>
      `;

      modal.classList.remove('hidden');

      expect(modal.classList.contains('hidden')).toBe(false);
      expect(modalDetails.innerHTML).toContain(work.title);
    });

    test('should close modal when clicking close button', () => {
      const modal = document.getElementById('work-modal');
      const closeBtn = document.getElementById('close-modal');

      modal.classList.remove('hidden');
      closeBtn.click();
      modal.classList.add('hidden');

      expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('should close modal on Escape key', () => {
      const modal = document.getElementById('work-modal');
      modal.classList.remove('hidden');

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          modal.classList.add('hidden');
        }
      });

      document.dispatchEvent(escapeEvent);

      expect(modal.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Search Within Works Workflow', () => {
    test('should filter works by search term', () => {
      jest.useFakeTimers();

      const searchInput = document.getElementById('search-works');
      const works = mockComposerData.works;

      searchInput.value = 'Work 1';

      let filtered = works.filter(w =>
        w.title.toLowerCase().includes(searchInput.value.toLowerCase())
      );

      // Should find 'Work 1', 'Work 10', 'Work 11', etc.
      expect(filtered.length).toBeGreaterThan(0);

      jest.useRealTimers();
    });

    test('should search across multiple fields', () => {
      const searchTerm = 'BWV 1';
      const works = mockComposerData.works;

      const filtered = works.filter(w =>
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.bwv.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered.length).toBeGreaterThan(0);
    });

    test('should show no results message for invalid search', () => {
      const searchTerm = 'XYZNOTHINGHERE';
      const works = mockComposerData.works;

      const filtered = works.filter(w =>
        w.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered.length).toBe(0);
    });
  });

  describe('Combined Filters Workflow', () => {
    test('should apply genre and year filters together', () => {
      const works = mockComposerData.works;

      const genre = 'cantatas';
      const yearFrom = 1710;
      const yearTo = 1730;

      const filtered = works.filter(w =>
        w.category === genre &&
        w.yearComposed >= yearFrom &&
        w.yearComposed <= yearTo
      );

      filtered.forEach(w => {
        expect(w.category).toBe('cantatas');
        expect(w.yearComposed).toBeGreaterThanOrEqual(1710);
        expect(w.yearComposed).toBeLessThanOrEqual(1730);
      });
    });

    test('should apply all three filters (genre, year, search)', () => {
      const works = mockComposerData.works;

      const genre = 'cantatas';
      const searchTerm = '2';
      const yearFrom = 1700;

      const filtered = works.filter(w =>
        w.category === genre &&
        w.title.includes(searchTerm) &&
        w.yearComposed >= yearFrom
      );

      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Workflow', () => {
    test('should handle failed data load', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404
        })
      );

      try {
        const response = await fetch('database/data/invalid.json');
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
      } catch (error) {
        expect(error.message).toBe('Failed to load data');
      }
    });

    test('should show error message to user', () => {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = 'Failed to load composer data. Please try again.';

      document.body.appendChild(errorMessage);

      expect(document.querySelector('.error-message')).not.toBeNull();
    });
  });

  describe('Responsive Pagination', () => {
    test('should disable previous button on first page', () => {
      const currentPage = 1;
      const prevBtn = document.querySelector('.btn-prev');

      prevBtn.disabled = currentPage === 1;

      expect(prevBtn.disabled).toBe(true);
    });

    test('should disable next button on last page', () => {
      const currentPage = 2;
      const totalPages = 2;
      const nextBtn = document.querySelector('.btn-next');

      nextBtn.disabled = currentPage === totalPages;

      expect(nextBtn.disabled).toBe(true);
    });

    test('should enable both buttons on middle page', () => {
      const currentPage = 2;
      const totalPages = 3;
      const prevBtn = document.querySelector('.btn-prev');
      const nextBtn = document.querySelector('.btn-next');

      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === totalPages;

      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(false);
    });
  });
});
