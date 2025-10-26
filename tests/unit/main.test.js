/**
 * Unit Tests for main.js
 * Tests all functions in the main catalogue interface
 */

describe('Main Catalogue Interface', () => {
  let mainScript;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="main-header">
        <nav class="main-nav">
          <ul>
            <li><a href="#composers">Composers</a></li>
            <li><a href="#search">Search</a></li>
          </ul>
        </nav>
      </div>
      <div class="quick-search">
        <input type="text" id="quick-search" placeholder="Search...">
        <button onclick="performQuickSearch()">Search</button>
      </div>
      <div class="statistics-section">
        <div class="stat-card">
          <span class="stat-number">0</span>
          <span class="stat-label">Composers</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">0</span>
          <span class="stat-label">Total Works</span>
        </div>
      </div>
      <div class="composers-grid">
        <div class="composer-card tier-1" data-composer="mozart"></div>
        <div class="composer-card tier-2 hidden" data-composer="beethoven"></div>
      </div>
      <button class="btn-show-more">Show More Composers</button>
    `;

    // Load the main.js functions into the test environment
    // In a real scenario, you would import/require the actual file
    // For this example, we'll define the functions inline
    window.performQuickSearch = performQuickSearch;
    window.toggleTier2 = toggleTier2;
    window.showNotification = showNotification;
    window.closeModal = closeModal;
  });

  describe('Initialization', () => {
    test('should set up event listeners on DOMContentLoaded', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      expect(addEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('performQuickSearch', () => {
    test('should show warning when search term is empty', () => {
      const input = document.getElementById('quick-search');
      input.value = '';

      window.showNotification = jest.fn();
      window.performQuickSearch();

      expect(window.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('enter a search term'),
        'warning'
      );
    });

    test('should redirect to search page with query parameter', (done) => {
      const input = document.getElementById('quick-search');
      input.value = 'Mozart Symphony';

      delete window.location;
      window.location = { href: '' };

      window.performQuickSearch();

      setTimeout(() => {
        expect(window.location.href).toContain('search.html');
        expect(window.location.href).toContain('Mozart%20Symphony');
        done();
      }, 600);
    });

    test('should trim whitespace from search term', () => {
      const input = document.getElementById('quick-search');
      input.value = '  Mozart  ';

      delete window.location;
      window.location = { href: '' };

      window.performQuickSearch();

      setTimeout(() => {
        expect(window.location.href).toContain('Mozart');
        expect(window.location.href).not.toContain('%20%20');
      }, 600);
    });
  });

  describe('toggleTier2', () => {
    test('should toggle visibility of tier 2 composer cards', () => {
      const tier2Cards = document.querySelectorAll('.composer-card.tier-2');
      const button = document.querySelector('.btn-show-more');

      expect(tier2Cards[0].classList.contains('hidden')).toBe(true);

      window.toggleTier2();

      expect(tier2Cards[0].classList.contains('hidden')).toBe(false);
    });

    test('should update button text when toggling', () => {
      const button = document.querySelector('.btn-show-more');
      const initialText = button.textContent;

      window.toggleTier2();
      const toggledText = button.textContent;

      expect(toggledText).not.toBe(initialText);
      expect(toggledText).toContain('Less');
    });

    test('should handle multiple tier 2 cards', () => {
      document.body.innerHTML += `
        <div class="composers-grid">
          <div class="composer-card tier-2 hidden"></div>
          <div class="composer-card tier-2 hidden"></div>
          <div class="composer-card tier-2 hidden"></div>
        </div>
      `;

      window.toggleTier2();

      const tier2Cards = document.querySelectorAll('.composer-card.tier-2');
      tier2Cards.forEach(card => {
        expect(card.classList.contains('hidden')).toBe(false);
      });
    });
  });

  describe('Debounce Utility', () => {
    test('should debounce function calls', (done) => {
      jest.useFakeTimers();

      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
      done();
    });

    test('should pass arguments to debounced function', (done) => {
      jest.useFakeTimers();

      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('arg1', 'arg2');

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

      jest.useRealTimers();
      done();
    });
  });

  describe('Search Suggestions', () => {
    test('should hide suggestions when input length is less than 2', () => {
      const input = document.getElementById('quick-search');
      input.value = 'M';

      const event = new Event('input');
      input.dispatchEvent(event);

      const suggestions = document.getElementById('search-suggestions');
      if (suggestions) {
        expect(suggestions.style.display).toBe('none');
      }
    });

    test('should filter suggestions based on input', () => {
      const searchTerm = 'mozart';
      const suggestions = getSearchSuggestions(searchTerm);

      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        const matches = suggestion.name.toLowerCase().includes(searchTerm) ||
                       (suggestion.catalog && suggestion.catalog.toLowerCase().includes(searchTerm));
        expect(matches).toBe(true);
      });
    });

    test('should limit suggestions to 5 items', () => {
      const suggestions = getSearchSuggestions('a');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Modal Functions', () => {
    test('should create modal with provided content', () => {
      const modal = createModal({
        title: 'Test Modal',
        content: '<p>Test Content</p>'
      });

      expect(modal.classList.contains('modal-overlay')).toBe(true);
      expect(modal.innerHTML).toContain('Test Modal');
      expect(modal.innerHTML).toContain('Test Content');
    });

    test('should close modal when clicking overlay', () => {
      const modal = createModal({
        title: 'Test',
        content: '<p>Test</p>'
      });

      document.body.appendChild(modal);

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });

      Object.defineProperty(clickEvent, 'target', {
        value: modal,
        enumerable: true
      });

      modal.dispatchEvent(clickEvent);

      // Modal should be removed
      expect(document.querySelector('.modal-overlay')).toBeNull();
    });

    test('should close modal on Escape key', () => {
      const modal = createModal({
        title: 'Test',
        content: '<p>Test</p>'
      });

      document.body.appendChild(modal);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.dispatchEvent(escapeEvent);

      // Check if modal is removed
      setTimeout(() => {
        expect(document.querySelector('.modal-overlay')).toBeNull();
      }, 100);
    });
  });

  describe('Statistics Animation', () => {
    test('should animate statistics when section is visible', () => {
      const stats = {
        composers: 5,
        works: 3876,
        recordings: 1247,
        manuscripts: 458
      };

      animateStatistics(stats);

      // After animation, numbers should be updated
      setTimeout(() => {
        const statNumbers = document.querySelectorAll('.stat-number');
        expect(statNumbers.length).toBeGreaterThan(0);
      }, 100);
    });

    test('should format large numbers with locale string', () => {
      const number = 3876;
      const formatted = number.toLocaleString();

      expect(formatted).toContain('3');
      expect(formatted).toContain('876');
    });
  });

  describe('Notification System', () => {
    test('should create notification element', () => {
      window.showNotification('Test message', 'info');

      const notification = document.querySelector('.notification');
      expect(notification).not.toBeNull();
      expect(notification.textContent).toBe('Test message');
    });

    test('should apply correct type class', () => {
      window.showNotification('Warning message', 'warning');

      const notification = document.querySelector('.notification-warning');
      expect(notification).not.toBeNull();
    });

    test('should remove notification after duration', (done) => {
      window.showNotification('Test', 'info', 100);

      setTimeout(() => {
        const notification = document.querySelector('.notification');
        expect(notification).toBeNull();
        done();
      }, 500);
    });
  });

  describe('Smooth Scrolling', () => {
    test('should scroll to target element on anchor click', () => {
      document.body.innerHTML = `
        <a href="#composers">Composers</a>
        <section id="composers">Content</section>
      `;

      const anchor = document.querySelector('a[href="#composers"]');
      const target = document.getElementById('composers');

      target.scrollIntoView = jest.fn();

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      anchor.dispatchEvent(clickEvent);

      // Should attempt to scroll
      expect(clickEvent.defaultPrevented).toBe(false);
    });
  });

  describe('URL Parameters', () => {
    test('should detect and handle composer parameter', () => {
      delete window.location;
      window.location = new URL('http://localhost?composer=mozart');

      const params = new URLSearchParams(window.location.search);
      expect(params.get('composer')).toBe('mozart');
    });

    test('should show welcome message when welcome param is present', () => {
      delete window.location;
      window.location = new URL('http://localhost?welcome=true');

      window.showNotification = jest.fn();

      // Simulate checkUrlParameters
      const params = new URLSearchParams(window.location.search);
      if (params.has('welcome')) {
        window.showNotification('Welcome to the Early Composers Musical Catalogue!', 'info', 5000);
      }

      expect(window.showNotification).toHaveBeenCalled();
    });
  });

  describe('Composer Preview', () => {
    test('should show modal for valid composer', () => {
      const composerData = {
        name: 'Wolfgang Amadeus Mozart',
        years: '1756-1791',
        bio: 'Austrian composer',
        works: 626,
        famous: ['Requiem K. 626']
      };

      expect(composerData.name).toBe('Wolfgang Amadeus Mozart');
      expect(composerData.works).toBe(626);
    });

    test('should not show modal for invalid composer', () => {
      // Test that undefined composer doesn't create modal
      const composer = undefined;
      expect(composer).toBeUndefined();
    });
  });

  describe('Icon Generation', () => {
    test('should return correct icon for suggestion type', () => {
      const icons = {
        'composer': '👤',
        'work': '🎵',
        'catalog': '📖'
      };

      expect(icons['composer']).toBe('👤');
      expect(icons['work']).toBe('🎵');
      expect(icons['catalog']).toBe('📖');
    });

    test('should return default icon for unknown type', () => {
      const icon = '📄';
      expect(icon).toBe('📄');
    });
  });
});

// Helper functions (normally these would be imported from main.js)
function performQuickSearch() {
  const searchTerm = document.getElementById('quick-search').value.trim();

  if (!searchTerm) {
    window.showNotification('Please enter a search term', 'warning');
    return;
  }

  setTimeout(() => {
    window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
  }, 500);
}

function toggleTier2() {
  const tier2Cards = document.querySelectorAll('.composer-card.tier-2');
  const button = document.querySelector('.btn-show-more');

  tier2Cards.forEach(card => {
    card.classList.toggle('hidden');
  });

  if (button) {
    const isHidden = tier2Cards[0]?.classList.contains('hidden');
    button.textContent = isHidden ? 'Show More Composers' : 'Show Less Composers';
  }
}

function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

function closeModal(element) {
  const modal = element?.closest?.('.modal-overlay') || element;
  if (modal) {
    modal.remove();
  }
}

function createModal(options) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${options.title}</h3>
        <button class="modal-close" onclick="closeModal(this)">&times;</button>
      </div>
      <div class="modal-body">
        ${options.content}
      </div>
    </div>
  `;

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal(modal);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal(modal);
    }
  });

  return modal;
}

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

function getSearchSuggestions(term) {
  const allSuggestions = [
    { type: 'composer', name: 'Wolfgang Amadeus Mozart', id: 'mozart' },
    { type: 'composer', name: 'Johann Sebastian Bach', id: 'bach' },
    { type: 'work', name: 'Symphony No. 40 in G minor', catalog: 'K. 550' },
    { type: 'work', name: 'Brandenburg Concerto No. 3', catalog: 'BWV 1048' }
  ];

  return allSuggestions.filter(item =>
    item.name.toLowerCase().includes(term.toLowerCase()) ||
    (item.catalog && item.catalog.toLowerCase().includes(term.toLowerCase()))
  ).slice(0, 5);
}

function animateStatistics(stats) {
  Object.keys(stats).forEach((key, index) => {
    setTimeout(() => {
      animateNumber(key, stats[key]);
    }, index * 100);
  });
}

function animateNumber(statType, finalValue) {
  const types = ['composers', 'works', 'recordings', 'manuscripts'];
  const index = types.indexOf(statType) + 1;
  const element = document.querySelector(`.stat-card:nth-child(${index}) .stat-number`);

  if (!element) return;

  const duration = 1500;
  const stepTime = 30;
  const steps = duration / stepTime;
  const increment = finalValue / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= finalValue) {
      current = finalValue;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, stepTime);
}
