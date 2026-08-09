/**
 * Composer Common JavaScript
 * Handles data loading and interaction for individual composer pages
 */

// Global variables
let composerData = null;
let currentWorks = [];
let currentPage = 1;
let itemsPerPage = 50;
let filteredWorks = [];

/**
 * Which catalogue file backs each composer, and which field holds the
 * catalogue number inside its works.
 */
const CATALOGUES = {
    mozart: { file: 'mozart-kv-catalogue.json', key: 'kv' },
    bach: { file: 'bach-bwv-catalogue.json', key: 'bwv' },
    handel: { file: 'handel-hwv-catalogue.json', key: 'hwv' },
    vivaldi: { file: 'vivaldi-rv-catalogue.json', key: 'rv' }
};

// Populated by initializeWorkLinks() once the page's catalogue has loaded.
let workIndex = null;
let workCatalogKey = null;

/* ------------------- Work anchors & click-through ------------------- */

/**
 * Turn a catalogue number into a URL-safe anchor slug.
 * "K. 525" -> "k-525", "BWV 1046" -> "bwv-1046"
 * NOTE: search.js carries an identical copy (the pages load the two
 * scripts independently); keep them in sync.
 */
function slugifyCatalogNumber(catalogNumber) {
    return String(catalogNumber || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Build a slug -> work lookup for one catalogue. */
function buildWorkIndex(works, catalogKey) {
    const index = new Map();
    (works || []).forEach(work => {
        const slug = slugifyCatalogNumber(work[catalogKey]);
        if (slug && !index.has(slug)) index.set(slug, work);
    });
    return index;
}

/**
 * Which catalogued work, if any, does this text refer to?
 *
 * Table cells hold a bare catalogue number ("K. 525"); headings wrap one in
 * prose ("Spring (La Primavera) - RV 269", "BWV 4: Christ lag..."). Both
 * reduce to a slug, so a heading matches when a work's slug appears in it at
 * token boundaries. A slug followed by "-<digits>" is a range heading
 * ("Brandenburg Concertos (BWV 1046-1051)") and refers to a set, not to its
 * first work, so it deliberately matches nothing.
 */
function findWorkInText(text, index) {
    const haystack = slugifyCatalogNumber(text);
    if (!haystack) return null;

    const exact = index.get(haystack);
    if (exact) return { slug: haystack, work: exact };

    for (const [slug, work] of index) {
        const pattern = new RegExp(`(^|-)${slug}(?!-\\d)($|-)`);
        if (pattern.test(haystack)) return { slug, work };
    }
    return null;
}

/** Attach the modal to one element and give it the work's anchor id. */
function linkElementToWork(element, slug, work, catalogKey) {
    element.id = slug;
    element.classList.add('work-link');
    element.setAttribute('tabindex', '0');
    element.addEventListener('click', () => openWorkModal(work, catalogKey));
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openWorkModal(work, catalogKey);
        }
    });
}

/**
 * Make every static reference to a catalogued work clickable — table rows
 * (first cell = catalogue number) and section headings that name one.
 * Scanned in document order, first mention wins; anything that doesn't
 * resolve to a work is left exactly as authored.
 */
function enhanceWorkReferences(index, catalogKey) {
    const seen = new Set();
    const selector = '.works-table tr, .content-section h3, .content-section h4';

    document.querySelectorAll(selector).forEach(element => {
        const isRow = element.tagName === 'TR';

        // A row is identified by its first data cell; a heading by its text.
        const cell = isRow ? element.querySelector('td') : null;
        if (isRow && !cell) return;
        const text = isRow ? cell.textContent : element.textContent;

        const match = findWorkInText(text, index);
        if (!match || seen.has(match.slug)) return;

        seen.add(match.slug);
        linkElementToWork(element, match.slug, match.work, catalogKey);
    });
}

/** Open the modal for whatever work the URL hash points at, if any. */
function openWorkFromHash(index, catalogKey) {
    const slug = (window.location.hash || '').replace(/^#/, '');
    if (!slug) return;

    const work = index.get(slug);
    if (!work) return;

    const row = document.getElementById(slug);
    if (row && typeof row.scrollIntoView === 'function') {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    openWorkModal(work, catalogKey);
}

/** Render and show the work detail modal. */
function openWorkModal(work, catalogKey) {
    let modal = document.getElementById('work-modal');
    if (!modal) {
        createWorkModal();
        modal = document.getElementById('work-modal');
    }

    const catalogNumber = work[catalogKey] || work.catalogNumber || '';
    const detail = Array.isArray(work.movements_detail) ? work.movements_detail
        : Array.isArray(work.movementList) ? work.movementList
            : null;

    document.getElementById('modal-title').textContent =
        catalogNumber ? `${work.title} (${catalogNumber})` : work.title;

    const rows = [
        ['Catalogue Number', catalogNumber],
        ['German Title', work.germanTitle],
        ['Category', work.category],
        ['Key', work.key],
        ['Year Composed', work.yearComposed],
        ['Movements', typeof work.movements === 'number' ? work.movements : null],
        ['Duration', work.duration ? `${work.duration} minutes` : null],
        ['Instrumentation', work.instrumentation],
        ['Description', work.description]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');

    document.getElementById('modal-details').innerHTML = `
        <div class="work-details">
            ${rows.map(([label, value]) => `
                <div class="detail-group"><strong>${label}:</strong> ${value}</div>
            `).join('')}
            ${detail ? `
                <div class="detail-group">
                    <strong>Movements:</strong>
                    <ol class="movement-list">
                        ${detail.map(m => `<li>${m}</li>`).join('')}
                    </ol>
                </div>
            ` : ''}
            <div class="modal-actions">
                <a class="btn-primary find-recordings"
                   href="../../search.html?q=${encodeURIComponent(catalogNumber || work.title)}">
                    Search recordings &rarr;
                </a>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * Wire up click-through on a composer page. Reads the composer from
 * <body data-composer> and enhances whatever static tables it finds.
 */
async function initializeWorkLinks() {
    const composerId = document.body && document.body.dataset
        ? document.body.dataset.composer : null;
    const catalogue = composerId ? CATALOGUES[composerId] : null;
    if (!catalogue) return;

    let data;
    try {
        const response = await fetch(`../../database/data/${catalogue.file}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (error) {
        // Static tables still render; they just stay unclickable.
        console.warn('Work links unavailable:', error.message);
        return;
    }

    workIndex = buildWorkIndex(data.works, catalogue.key);
    workCatalogKey = catalogue.key;

    enhanceWorkReferences(workIndex, workCatalogKey);
    openWorkFromHash(workIndex, workCatalogKey);
    window.addEventListener('hashchange', () => openWorkFromHash(workIndex, workCatalogKey));
}

/**
 * Initialize composer page with data
 */
async function initializeComposer(composerId) {
    try {
        // Show loading state
        showLoadingState(true);

        // Load composer data from JSON
        const catalogue = CATALOGUES[composerId];
        if (!catalogue) {
            throw new Error(`Unknown composer: ${composerId}`);
        }
        const response = await fetch(`../../database/data/${catalogue.file}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${composerId} data`);
        }

        composerData = await response.json();

        // Initialize page components
        initializeNavigation();
        displayComposerInfo();
        displayWorks();
        initializeFilters();
        initializeSearch();

        // Hide loading state
        showLoadingState(false);

    } catch (error) {
        console.error('Error initializing composer:', error);
        showError('Failed to load composer data. Please try again later.');
    }
}

/**
 * Display composer information
 */
function displayComposerInfo() {
    if (!composerData) return;

    const composer = composerData.composer;

    // Update page title
    document.title = `${composer.fullName} - Complete Works Catalogue`;

    // Update composer details if elements exist
    updateElement('.composer-name', composer.fullName);
    updateElement('.composer-dates', `${composer.birthDate.split('-')[0]} - ${composer.deathDate.split('-')[0]}`);
    updateElement('.composer-nationality', composer.nationality);
    updateElement('.composer-period', `${composer.period} Period`);
    updateElement('.catalog-system', `${composerData.catalogSystem.name} (${composerData.catalogSystem.abbreviation})`);
    updateElement('.total-works', `${composer.totalWorks} Works`);
}

/**
 * Display works in table or grid format
 */
function displayWorks() {
    if (!composerData || !composerData.works) return;

    currentWorks = composerData.works;
    filteredWorks = [...currentWorks];

    renderWorksTable();
    updatePagination();
}

/**
 * Render works table
 */
function renderWorksTable() {
    const tbody = document.getElementById('works-tbody');
    if (!tbody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const worksToDisplay = filteredWorks.slice(startIndex, endIndex);

    tbody.innerHTML = worksToDisplay.map(work => `
        <tr data-work-id="${work.bwv}" onclick="showWorkDetails('${work.bwv}')">
            <td>${work.bwv}</td>
            <td>${work.title}</td>
            <td>${work.category}</td>
            <td>${work.key || '-'}</td>
            <td>${work.yearComposed || '-'}</td>
            <td>${work.instrumentation || '-'}</td>
            <td>
                <button class="btn-details" onclick="event.stopPropagation(); showWorkDetails('${work.bwv}')">
                    Details
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Show work details in modal
 */
function showWorkDetails(workId) {
    // Preferred path: the index built by initializeWorkLinks(), which is what
    // the inline onclick="showWorkDetails('HWV 56')" handlers rely on.
    if (workIndex) {
        const indexed = workIndex.get(slugifyCatalogNumber(workId));
        if (indexed) return openWorkModal(indexed, workCatalogKey);
    }

    // Legacy path: pages driven by initializeComposer().
    if (!composerData || !composerData.works) return;
    const catalogKey = (CATALOGUES[composerData.composer && composerData.composer.id] || {}).key;
    const work = composerData.works.find(w => w[catalogKey] === workId);
    if (work) openWorkModal(work, catalogKey);
}

/**
 * Create work modal if it doesn't exist
 */
function createWorkModal() {
    const modal = document.createElement('div');
    modal.id = 'work-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="closeWorkModal()">&times;</span>
            <h2 id="modal-title">Work Title</h2>
            <div id="modal-details">
                <!-- Work details loaded dynamically -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWorkModal();
        }
    });
}

/**
 * Close work modal
 */
function closeWorkModal() {
    const modal = document.getElementById('work-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Initialize filters
 */
function initializeFilters() {
    // Genre filter
    const genreFilter = document.getElementById('genre-filter');
    if (genreFilter && composerData.categories) {
        const genres = Object.keys(composerData.categories);
        genreFilter.innerHTML = `
            <option value="">All Genres</option>
            ${genres.map(genre => `
                <option value="${genre}">${composerData.categories[genre].name}</option>
            `).join('')}
        `;
    }

    // Period filter (for composers with distinct periods)
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter) {
        // Extract unique years from works
        const years = [...new Set(composerData.works
            .map(w => w.yearComposed)
            .filter(y => y)
        )].sort();

        if (years.length > 0) {
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const periods = generatePeriods(minYear, maxYear);

            periodFilter.innerHTML = `
                <option value="">All Periods</option>
                ${periods.map(period => `
                    <option value="${period.value}">${period.label}</option>
                `).join('')}
            `;
        }
    }
}

/**
 * Generate period options based on year range
 */
function generatePeriods(minYear, maxYear) {
    const periods = [];
    const range = maxYear - minYear;

    if (range <= 10) {
        // Individual years
        for (let year = minYear; year <= maxYear; year++) {
            periods.push({ value: `${year}`, label: `${year}` });
        }
    } else if (range <= 50) {
        // 5-year periods
        const startDecade = Math.floor(minYear / 5) * 5;
        const endDecade = Math.ceil(maxYear / 5) * 5;
        for (let decade = startDecade; decade < endDecade; decade += 5) {
            periods.push({
                value: `${decade}-${decade + 4}`,
                label: `${decade}-${decade + 4}`
            });
        }
    } else {
        // 10-year periods
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

/**
 * Filter works based on criteria
 */
function filterWorks() {
    const genreFilter = document.getElementById('genre-filter');
    const periodFilter = document.getElementById('period-filter');
    const searchFilter = document.getElementById('search-works');

    let filtered = [...currentWorks];

    // Apply genre filter
    if (genreFilter && genreFilter.value) {
        filtered = filtered.filter(work => work.category === genreFilter.value);
    }

    // Apply period filter
    if (periodFilter && periodFilter.value) {
        const periodRange = periodFilter.value.split('-');
        if (periodRange.length === 1) {
            // Single year
            const year = parseInt(periodRange[0]);
            filtered = filtered.filter(work => work.yearComposed === year);
        } else {
            // Year range
            const startYear = parseInt(periodRange[0]);
            const endYear = parseInt(periodRange[1]);
            filtered = filtered.filter(work =>
                work.yearComposed >= startYear && work.yearComposed <= endYear
            );
        }
    }

    // Apply search filter
    if (searchFilter && searchFilter.value) {
        const searchTerm = searchFilter.value.toLowerCase();
        filtered = filtered.filter(work =>
            work.title.toLowerCase().includes(searchTerm) ||
            work.bwv.toLowerCase().includes(searchTerm) ||
            (work.germanTitle && work.germanTitle.toLowerCase().includes(searchTerm))
        );
    }

    filteredWorks = filtered;
    currentPage = 1;
    renderWorksTable();
    updatePagination();
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('genre-filter').value = '';
    document.getElementById('period-filter').value = '';
    document.getElementById('search-works').value = '';

    filteredWorks = [...currentWorks];
    currentPage = 1;
    renderWorksTable();
    updatePagination();
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-works');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterWorks();
        }, 300));

        // Enter key to filter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterWorks();
            }
        });
    }
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);

    updateElement('#current-page', currentPage);
    updateElement('#total-pages', totalPages);

    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }

    // Update results count
    const resultsInfo = document.querySelector('.results-info');
    if (resultsInfo) {
        resultsInfo.textContent = `Showing ${filteredWorks.length} of ${currentWorks.length} works`;
    }
}

/**
 * Navigate to previous page
 */
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderWorksTable();
        updatePagination();
        scrollToTop();
    }
}

/**
 * Navigate to next page
 */
function nextPage() {
    const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderWorksTable();
        updatePagination();
        scrollToTop();
    }
}

/**
 * Initialize navigation smooth scrolling
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.composer-nav a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            e.target.classList.add('active');

            // Smooth scroll to section
            const targetId = e.target.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

/**
 * Utility function to update element text content
 */
function updateElement(selector, content) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Show loading state
 */
function showLoadingState(show) {
    const loadingOverlay = document.getElementById('loading-overlay');

    if (show && !loadingOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading composer data...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else if (!show && loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Reload Page</button>
        </div>
    `;

    const mainContent = document.querySelector('.composer-content');
    if (mainContent) {
        mainContent.insertBefore(errorContainer, mainContent.firstChild);
    }
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Debounce function
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
window.initializeComposer = initializeComposer;
window.initializeWorkLinks = initializeWorkLinks;
window.showWorkDetails = showWorkDetails;
window.closeWorkModal = closeWorkModal;
window.filterWorks = filterWorks;
window.resetFilters = resetFilters;
window.previousPage = previousPage;
window.nextPage = nextPage;

// Every composer page carries <body data-composer="...">; wire up the
// work anchors and modal as soon as the DOM is ready.
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWorkLinks);
    } else {
        initializeWorkLinks();
    }
}

// Exposed for the Jest suite; harmless in the browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CATALOGUES,
        slugifyCatalogNumber,
        buildWorkIndex,
        enhanceWorkReferences,
        openWorkFromHash,
        openWorkModal,
        initializeWorkLinks,
        showWorkDetails,
        closeWorkModal
    };
}