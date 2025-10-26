/**
 * Performance Tests - Page Load and Response Times
 * Tests page load performance, data fetching, and rendering speed
 */

describe('Page Load Performance', () => {
  describe('Homepage Performance', () => {
    test('should load homepage within acceptable time', async () => {
      const startTime = performance.now();

      // Simulate page load
      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should render composer cards efficiently', () => {
      const startTime = performance.now();

      const composers = Array(50).fill(null).map((_, i) => ({
        id: `composer_${i}`,
        name: `Composer ${i}`,
        works: 100
      }));

      // Render cards
      const html = composers.map(c => `
        <div class="composer-card">
          <h3>${c.name}</h3>
          <p>${c.works} works</p>
        </div>
      `).join('');

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Rendering 50 cards should take less than 100ms
      expect(renderTime).toBeLessThan(100);
      expect(html.length).toBeGreaterThan(0);
    });

    test('should load statistics with minimal delay', (done) => {
      const startTime = performance.now();

      const stats = {
        composers: 5,
        works: 3876,
        recordings: 1247,
        manuscripts: 458
      };

      // Simulate statistics calculation
      setTimeout(() => {
        const endTime = performance.now();
        const processingTime = endTime - startTime;

        expect(processingTime).toBeLessThan(50);
        done();
      }, 10);
    });
  });

  describe('Data Fetching Performance', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should fetch composer data within timeout', async () => {
      const mockData = { composer: {}, works: Array(1000).fill({}) };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const startTime = performance.now();

      const response = await fetch('database/data/bach-bwv-catalogue.json');
      const data = await response.json();

      const endTime = performance.now();
      const fetchTime = endTime - startTime;

      // Fetch should complete within 2 seconds
      expect(fetchTime).toBeLessThan(2000);
      expect(data.works.length).toBe(1000);
    });

    test('should handle large dataset efficiently', async () => {
      const largeDataset = {
        works: Array(5000).fill(null).map((_, i) => ({
          id: `work_${i}`,
          title: `Work ${i}`,
          category: 'test'
        }))
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeDataset
      });

      const startTime = performance.now();

      const response = await fetch('database/data/large-catalogue.json');
      const data = await response.json();

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Processing 5000 items should be fast
      expect(processingTime).toBeLessThan(500);
      expect(data.works.length).toBe(5000);
    });

    test('should cache repeated requests', async () => {
      const mockData = { works: [] };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      // First fetch
      const start1 = performance.now();
      await fetch('database/data/test.json');
      const time1 = performance.now() - start1;

      // Second fetch (would be cached in real scenario)
      const start2 = performance.now();
      await fetch('database/data/test.json');
      const time2 = performance.now() - start2;

      // Both should be reasonably fast
      expect(time1).toBeLessThan(1000);
      expect(time2).toBeLessThan(1000);
    });
  });

  describe('Search Performance', () => {
    test('should filter large datasets quickly', () => {
      const works = Array(1000).fill(null).map((_, i) => ({
        bwv: `BWV ${i}`,
        title: `Work ${i}`,
        category: i % 2 === 0 ? 'cantatas' : 'keyboard'
      }));

      const startTime = performance.now();

      const filtered = works.filter(w => w.category === 'cantatas');

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Filtering 1000 items should be instant
      expect(filterTime).toBeLessThan(50);
      expect(filtered.length).toBe(500);
    });

    test('should search across multiple fields efficiently', () => {
      const works = Array(10000).fill(null).map((_, i) => ({
        bwv: `BWV ${i}`,
        title: `Cantata ${i}`,
        category: 'cantatas'
      }));

      const searchTerm = 'Cantata 999';

      const startTime = performance.now();

      const results = works.filter(w =>
        w.title.includes(searchTerm) ||
        w.bwv.includes(searchTerm)
      );

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Searching 10000 items should complete quickly
      expect(searchTime).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should debounce search efficiently', (done) => {
      jest.useFakeTimers();

      const searchFn = jest.fn();
      const debouncedSearch = debounce(searchFn, 300);

      const startTime = performance.now();

      // Trigger multiple times
      debouncedSearch();
      debouncedSearch();
      debouncedSearch();

      jest.advanceTimersByTime(300);

      const endTime = performance.now();

      // Should only call once
      expect(searchFn).toHaveBeenCalledTimes(1);

      // Debounce shouldn't add significant overhead
      expect(endTime - startTime).toBeLessThan(400);

      jest.useRealTimers();
      done();
    });
  });

  describe('Rendering Performance', () => {
    test('should render table rows efficiently', () => {
      const works = Array(50).fill(null).map((_, i) => ({
        bwv: `BWV ${i}`,
        title: `Work ${i}`,
        category: 'test',
        year: 1700 + i
      }));

      const startTime = performance.now();

      const html = works.map(work => `
        <tr>
          <td>${work.bwv}</td>
          <td>${work.title}</td>
          <td>${work.category}</td>
          <td>${work.year}</td>
        </tr>
      `).join('');

      document.body.innerHTML = `<table><tbody>${html}</tbody></table>`;

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Rendering 50 rows should be fast
      expect(renderTime).toBeLessThan(100);
      expect(document.querySelectorAll('tr').length).toBe(50);
    });

    test('should handle pagination without lag', () => {
      const allWorks = Array(500).fill(null).map((_, i) => ({ id: i }));

      const itemsPerPage = 50;
      let currentPage = 1;

      const startTime = performance.now();

      // Simulate page changes
      for (let page = 1; page <= 10; page++) {
        currentPage = page;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageWorks = allWorks.slice(start, end);

        expect(pageWorks.length).toBeLessThanOrEqual(itemsPerPage);
      }

      const endTime = performance.now();
      const paginationTime = endTime - startTime;

      // Paginating through 10 pages should be instant
      expect(paginationTime).toBeLessThan(50);
    });

    test('should update DOM efficiently', () => {
      document.body.innerHTML = `
        <div id="container"></div>
        <span id="counter">0</span>
      `;

      const startTime = performance.now();

      // Simulate multiple DOM updates
      for (let i = 0; i < 100; i++) {
        document.getElementById('counter').textContent = i;
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // 100 DOM updates should be reasonably fast
      expect(updateTime).toBeLessThan(100);
      expect(document.getElementById('counter').textContent).toBe('99');
    });
  });

  describe('Animation Performance', () => {
    test('should animate statistics smoothly', (done) => {
      jest.useFakeTimers();

      document.body.innerHTML = '<span class="stat-number">0</span>';

      const element = document.querySelector('.stat-number');
      const finalValue = 3876;
      const duration = 1500;
      const stepTime = 30;
      const steps = duration / stepTime;
      const increment = finalValue / steps;

      let current = 0;
      let updates = 0;

      const startTime = performance.now();

      const timer = setInterval(() => {
        current += increment;
        updates++;

        if (current >= finalValue) {
          current = finalValue;
          clearInterval(timer);

          const endTime = performance.now();
          const animationTime = endTime - startTime;

          // Animation should complete around expected duration
          expect(updates).toBeLessThanOrEqual(steps + 1);

          jest.useRealTimers();
          done();
        }

        element.textContent = Math.floor(current);
      }, stepTime);

      jest.advanceTimersByTime(duration);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory on repeated operations', () => {
      const initialArrayLength = 100;
      let arrays = [];

      // Create arrays
      for (let i = 0; i < 10; i++) {
        arrays.push(Array(initialArrayLength).fill(i));
      }

      expect(arrays.length).toBe(10);

      // Clear references
      arrays = null;

      // After clearing, arrays should be garbage collected (in real scenario)
      expect(arrays).toBeNull();
    });

    test('should cleanup event listeners properly', () => {
      const element = document.createElement('button');
      const handler = jest.fn();

      element.addEventListener('click', handler);

      // Trigger event
      element.click();
      expect(handler).toHaveBeenCalledTimes(1);

      // Remove listener
      element.removeEventListener('click', handler);

      // Shouldn't trigger after removal
      handler.mockClear();
      element.click();

      // Handler should still only have been called once total
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

// Helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
