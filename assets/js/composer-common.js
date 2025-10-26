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
 * Initialize composer page with data
 */
async function initializeComposer(composerId) {
    try {
        // Show loading state
        showLoadingState(true);

        // Load composer data from JSON
        const response = await fetch(`../../database/data/${composerId}-bwv-catalogue.json`);
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
    const work = composerData.works.find(w => w.bwv === workId);
    if (!work) return;

    const modal = document.getElementById('work-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDetails = document.getElementById('modal-details');

    if (!modal || !modalTitle || !modalDetails) {
        createWorkModal();
        return showWorkDetails(workId);
    }

    modalTitle.textContent = `${work.title} (${work.bwv})`;

    modalDetails.innerHTML = `
        <div class="work-details">
            <div class="detail-group">
                <strong>Catalogue Number:</strong> ${work.bwv}
            </div>
            ${work.germanTitle ? `
                <div class="detail-group">
                    <strong>German Title:</strong> ${work.germanTitle}
                </div>
            ` : ''}
            <div class="detail-group">
                <strong>Category:</strong> ${work.category}
            </div>
            ${work.key ? `
                <div class="detail-group">
                    <strong>Key:</strong> ${work.key}
                </div>
            ` : ''}
            ${work.yearComposed ? `
                <div class="detail-group">
                    <strong>Year Composed:</strong> ${work.yearComposed}
                </div>
            ` : ''}
            ${work.movements ? `
                <div class="detail-group">
                    <strong>Number of Movements:</strong> ${work.movements}
                </div>
            ` : ''}
            ${work.duration ? `
                <div class="detail-group">
                    <strong>Duration:</strong> ${work.duration} minutes
                </div>
            ` : ''}
            ${work.instrumentation ? `
                <div class="detail-group">
                    <strong>Instrumentation:</strong> ${work.instrumentation}
                </div>
            ` : ''}
            ${work.description ? `
                <div class="detail-group">
                    <strong>Description:</strong> ${work.description}
                </div>
            ` : ''}
            ${work.movementList ? `
                <div class="detail-group">
                    <strong>Movements:</strong>
                    <ol class="movement-list">
                        ${work.movementList.map(mov => `<li>${mov}</li>`).join('')}
                    </ol>
                </div>
            ` : ''}
            <div class="modal-actions">
                <button class="btn-primary" onclick="searchRecordings('${work.bwv}')">
                    Find Recordings
                </button>
                <button class="btn-secondary" onclick="viewManuscripts('${work.bwv}')">
                    View Manuscripts
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
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
 * Search for recordings of a work
 */
function searchRecordings(workId) {
    // In production, this would query the recordings database
    console.log(`Searching for recordings of ${workId}`);

    // For now, show a placeholder message
    alert(`Recording search for ${workId} will be available soon.`);
}

/**
 * View manuscripts for a work
 */
function viewManuscripts(workId) {
    // In production, this would query the manuscripts database
    console.log(`Viewing manuscripts for ${workId}`);

    // For now, show a placeholder message
    alert(`Manuscript information for ${workId} will be available soon.`);
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
window.showWorkDetails = showWorkDetails;
window.closeWorkModal = closeWorkModal;
window.filterWorks = filterWorks;
window.resetFilters = resetFilters;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.searchRecordings = searchRecordings;
window.viewManuscripts = viewManuscripts;