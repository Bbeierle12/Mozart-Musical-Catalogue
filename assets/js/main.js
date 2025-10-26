/**
 * Early Composers Musical Catalogue - Main JavaScript
 * Handles interactivity for the main catalogue interface
 */

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    setupEventListeners();
    loadStatistics();
    initializeSearch();
    checkUrlParameters();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Quick search input
    const searchInput = document.getElementById('quick-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performQuickSearch();
            }
        });

        // Auto-suggest functionality
        searchInput.addEventListener('input', debounce(handleSearchInput, 300));
    }

    // Composer card interactions
    document.querySelectorAll('.composer-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.btn-explore')) {
                const composerName = this.dataset.composer;
                showComposerPreview(composerName);
            }
        });
    });
}

/**
 * Perform quick search
 */
function performQuickSearch() {
    const searchTerm = document.getElementById('quick-search').value.trim();

    if (!searchTerm) {
        showNotification('Please enter a search term', 'warning');
        return;
    }

    // Show loading state
    showSearchLoading(true);

    // Simulate search (in production, this would call an API)
    setTimeout(() => {
        // Redirect to search results page
        window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
    }, 500);
}

/**
 * Handle search input for auto-suggestions
 */
function handleSearchInput(e) {
    const searchTerm = e.target.value.trim();

    if (searchTerm.length < 2) {
        hideSearchSuggestions();
        return;
    }

    // In production, this would call an API
    const suggestions = getSearchSuggestions(searchTerm);
    displaySearchSuggestions(suggestions);
}

/**
 * Get search suggestions (mock function)
 */
function getSearchSuggestions(term) {
    const allSuggestions = [
        { type: 'composer', name: 'Wolfgang Amadeus Mozart', id: 'mozart' },
        { type: 'composer', name: 'Johann Sebastian Bach', id: 'bach' },
        { type: 'work', name: 'Symphony No. 40 in G minor', catalog: 'K. 550' },
        { type: 'work', name: 'Brandenburg Concerto No. 3', catalog: 'BWV 1048' },
        { type: 'work', name: 'The Four Seasons', catalog: 'RV 269, 315, 293, 297' },
        { type: 'catalog', name: 'K. 550', work: 'Symphony No. 40' },
        { type: 'catalog', name: 'BWV 1007', work: 'Cello Suite No. 1' }
    ];

    return allSuggestions.filter(item =>
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        (item.catalog && item.catalog.toLowerCase().includes(term.toLowerCase()))
    ).slice(0, 5);
}

/**
 * Display search suggestions
 */
function displaySearchSuggestions(suggestions) {
    let suggestionsContainer = document.getElementById('search-suggestions');

    if (!suggestionsContainer) {
        suggestionsContainer = createSuggestionsContainer();
    }

    if (suggestions.length === 0) {
        hideSearchSuggestions();
        return;
    }

    const html = suggestions.map(item => {
        const icon = getIconForType(item.type);
        const secondary = item.catalog || item.work || '';
        return `
            <div class="suggestion-item" data-type="${item.type}" data-id="${item.id || ''}">
                <span class="suggestion-icon">${icon}</span>
                <div class="suggestion-content">
                    <span class="suggestion-primary">${item.name}</span>
                    ${secondary ? `<span class="suggestion-secondary">${secondary}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');

    suggestionsContainer.innerHTML = html;
    suggestionsContainer.style.display = 'block';

    // Add click handlers to suggestions
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => handleSuggestionClick(item));
    });
}

/**
 * Create suggestions container
 */
function createSuggestionsContainer() {
    const container = document.createElement('div');
    container.id = 'search-suggestions';
    container.className = 'search-suggestions';

    const searchContainer = document.querySelector('.quick-search');
    if (searchContainer) {
        searchContainer.appendChild(container);
    }

    return container;
}

/**
 * Hide search suggestions
 */
function hideSearchSuggestions() {
    const container = document.getElementById('search-suggestions');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Handle suggestion click
 */
function handleSuggestionClick(item) {
    const type = item.dataset.type;
    const id = item.dataset.id;

    if (type === 'composer' && id) {
        window.location.href = `composers/${id}/index.html`;
    } else {
        const searchTerm = item.querySelector('.suggestion-primary').textContent;
        document.getElementById('quick-search').value = searchTerm;
        performQuickSearch();
    }
}

/**
 * Get icon for suggestion type
 */
function getIconForType(type) {
    const icons = {
        'composer': '👤',
        'work': '🎵',
        'catalog': '📖'
    };
    return icons[type] || '📄';
}

/**
 * Toggle Tier 2 composers visibility
 */
function toggleTier2() {
    const tier2Cards = document.querySelectorAll('.composer-card.tier-2');
    const button = document.querySelector('.btn-show-more');

    tier2Cards.forEach(card => {
        card.classList.toggle('hidden');
    });

    if (button) {
        const isHidden = tier2Cards[0].classList.contains('hidden');
        button.textContent = isHidden ? 'Show More Composers' : 'Show Less Composers';
    }
}

/**
 * Show composer preview modal
 */
function showComposerPreview(composerName) {
    const composers = {
        'mozart': {
            name: 'Wolfgang Amadeus Mozart',
            years: '1756-1791',
            bio: 'Austrian composer of the Classical period, widely recognized as one of the greatest composers in the history of Western music.',
            works: 626,
            famous: ['Requiem K. 626', 'Don Giovanni K. 527', 'Symphony No. 40 K. 550']
        },
        'bach': {
            name: 'Johann Sebastian Bach',
            years: '1685-1750',
            bio: 'German composer and musician of the Baroque period, known for his intricate compositions and mastery of counterpoint.',
            works: 1100,
            famous: ['Mass in B minor BWV 232', 'The Well-Tempered Clavier', 'Brandenburg Concertos']
        },
        'handel': {
            name: 'George Frideric Handel',
            years: '1685-1759',
            bio: 'German-British Baroque composer known for his operas, oratorios, and instrumental compositions.',
            works: 600,
            famous: ['Messiah HWV 56', 'Water Music HWV 348-350', 'Music for the Royal Fireworks HWV 351']
        },
        'vivaldi': {
            name: 'Antonio Vivaldi',
            years: '1678-1741',
            bio: 'Italian Baroque composer and virtuoso violinist, best known for his violin concertos, especially The Four Seasons.',
            works: 800,
            famous: ['The Four Seasons RV 269, 315, 293, 297', 'Gloria RV 589', 'Stabat Mater RV 621']
        },
        'haydn': {
            name: 'Joseph Haydn',
            years: '1732-1809',
            bio: 'Austrian composer of the Classical period, instrumental in the development of the symphony and string quartet.',
            works: 750,
            famous: ['The Creation Hob. XXI:2', 'Symphony No. 104 "London"', 'String Quartets Op. 76']
        }
    };

    const composer = composers[composerName];
    if (!composer) return;

    // Create modal
    const modal = createModal({
        title: composer.name,
        content: `
            <div class="composer-preview">
                <p class="composer-years">${composer.years}</p>
                <p class="composer-bio">${composer.bio}</p>
                <div class="composer-stats">
                    <strong>Total Works:</strong> ~${composer.works}
                </div>
                <div class="famous-works">
                    <strong>Famous Works:</strong>
                    <ul>
                        ${composer.famous.map(work => `<li>${work}</li>`).join('')}
                    </ul>
                </div>
                <div class="modal-actions">
                    <a href="composers/${composerName}/index.html" class="btn-primary">
                        Explore Full Catalogue
                    </a>
                </div>
            </div>
        `
    });

    document.body.appendChild(modal);
}

/**
 * Create modal element
 */
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

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
        }
    });

    return modal;
}

/**
 * Close modal
 */
function closeModal(element) {
    const modal = element.closest('.modal-overlay') || element;
    if (modal) {
        modal.remove();
    }
}

/**
 * Load statistics dynamically
 */
function loadStatistics() {
    // In production, this would fetch from an API
    const stats = {
        composers: 5,
        works: 3876,
        recordings: 1247,
        manuscripts: 458
    };

    // Animate statistics on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatistics(stats);
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.statistics-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

/**
 * Animate statistics numbers
 */
function animateStatistics(stats) {
    Object.keys(stats).forEach((key, index) => {
        setTimeout(() => {
            animateNumber(key, stats[key]);
        }, index * 100);
    });
}

/**
 * Animate single number
 */
function animateNumber(statType, finalValue) {
    const element = document.querySelector(`.stat-card:nth-child(${getStatIndex(statType)}) .stat-number`);
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

/**
 * Get stat index for animation
 */
function getStatIndex(statType) {
    const types = ['composers', 'works', 'recordings', 'manuscripts'];
    return types.indexOf(statType) + 1;
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    // Set up keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for quick search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('quick-search')?.focus();
        }
    });
}

/**
 * Check URL parameters for actions
 */
function checkUrlParameters() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('composer')) {
        const composer = params.get('composer');
        setTimeout(() => {
            showComposerPreview(composer);
        }, 500);
    }

    if (params.has('welcome')) {
        showWelcomeMessage();
    }
}

/**
 * Show welcome message for first-time visitors
 */
function showWelcomeMessage() {
    showNotification('Welcome to the Early Composers Musical Catalogue! Start exploring by selecting a composer or using the search function.', 'info', 5000);
}

/**
 * Show notification
 */
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

/**
 * Show search loading state
 */
function showSearchLoading(show) {
    const button = document.querySelector('.quick-search button');
    if (button) {
        if (show) {
            button.textContent = 'Searching...';
            button.disabled = true;
        } else {
            button.textContent = 'Search';
            button.disabled = false;
        }
    }
}

/**
 * Debounce function for input events
 */
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

/**
 * Export functions for global use
 */
window.performQuickSearch = performQuickSearch;
window.toggleTier2 = toggleTier2;
window.closeModal = closeModal;
window.showNotification = showNotification;