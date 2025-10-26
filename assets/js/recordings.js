/**
 * Recordings Database JavaScript
 * Handles loading, filtering, and displaying recording data
 */

// Global variables
let allRecordings = [];
let filteredRecordings = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentView = 'grid';
let comparisonSlots = [null, null, null];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadRecordings();
    initializeEventListeners();
    displayRecordings();
    updateStatistics();
});

/**
 * Load recordings data from JSON
 */
async function loadRecordings() {
    try {
        const response = await fetch('database/data/recordings-database.json');
        if (!response.ok) {
            throw new Error('Failed to load recordings data');
        }

        const data = await response.json();
        allRecordings = data.recordings;
        filteredRecordings = [...allRecordings];

        console.log(`Loaded ${allRecordings.length} recordings`);
    } catch (error) {
        console.error('Error loading recordings:', error);
        showError('Failed to load recordings database. Please try again later.');
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Filter inputs
    const composerFilter = document.getElementById('composer-filter');
    const workFilter = document.getElementById('work-filter');
    const performerFilter = document.getElementById('performer-filter');
    const yearFilter = document.getElementById('year-filter');
    const platformFilter = document.getElementById('platform-filter');

    if (composerFilter) {
        composerFilter.addEventListener('change', () => applyFilters());
    }
    if (workFilter) {
        workFilter.addEventListener('input', debounce(() => applyFilters(), 300));
    }
    if (performerFilter) {
        performerFilter.addEventListener('input', debounce(() => applyFilters(), 300));
    }
    if (yearFilter) {
        yearFilter.addEventListener('change', () => applyFilters());
    }
    if (platformFilter) {
        platformFilter.addEventListener('change', () => applyFilters());
    }
}

/**
 * Apply all filters
 */
function applyFilters() {
    const composer = document.getElementById('composer-filter')?.value || '';
    const work = document.getElementById('work-filter')?.value.toLowerCase() || '';
    const performer = document.getElementById('performer-filter')?.value.toLowerCase() || '';
    const year = document.getElementById('year-filter')?.value || '';
    const platform = document.getElementById('platform-filter')?.value || '';

    filteredRecordings = allRecordings.filter(recording => {
        // Composer filter
        if (composer && recording.composer !== composer) return false;

        // Work filter
        if (work) {
            const matchTitle = recording.workTitle.toLowerCase().includes(work);
            const matchId = recording.workId.toLowerCase().includes(work);
            if (!matchTitle && !matchId) return false;
        }

        // Performer filter
        if (performer) {
            const performers = JSON.stringify(recording.performers).toLowerCase();
            if (!performers.includes(performer)) return false;
        }

        // Year filter
        if (year) {
            const recordingYear = recording.recordingInfo.year;
            switch(year) {
                case 'historical':
                    if (recordingYear >= 1980) return false;
                    break;
                case '1980s':
                    if (recordingYear < 1980 || recordingYear >= 1990) return false;
                    break;
                case '1990s':
                    if (recordingYear < 1990 || recordingYear >= 2000) return false;
                    break;
                case '2000s':
                    if (recordingYear < 2000 || recordingYear >= 2010) return false;
                    break;
                case '2010s':
                    if (recordingYear < 2010 || recordingYear >= 2020) return false;
                    break;
                case '2020s':
                    if (recordingYear < 2020) return false;
                    break;
            }
        }

        // Platform filter
        if (platform) {
            const hasplatform = recording.streamingLinks.some(link =>
                link.platform === platform
            );
            if (!hasplatform) return false;
        }

        return true;
    });

    currentPage = 1;
    displayRecordings();
    updateStatistics();
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('composer-filter').value = '';
    document.getElementById('work-filter').value = '';
    document.getElementById('performer-filter').value = '';
    document.getElementById('year-filter').value = '';
    document.getElementById('platform-filter').value = '';

    filteredRecordings = [...allRecordings];
    currentPage = 1;
    displayRecordings();
    updateStatistics();
}

/**
 * Display recordings based on current view
 */
function displayRecordings() {
    const container = document.getElementById('recordings-container');
    if (!container) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const recordingsToDisplay = filteredRecordings.slice(startIndex, endIndex);

    if (currentView === 'grid') {
        displayGridView(container, recordingsToDisplay);
    } else if (currentView === 'list') {
        displayListView(container, recordingsToDisplay);
    }

    updatePagination();
}

/**
 * Display recordings in grid view
 */
function displayGridView(container, recordings) {
    container.className = 'recordings-grid';

    if (recordings.length === 0) {
        container.innerHTML = '<p class="no-results">No recordings found matching your criteria.</p>';
        return;
    }

    container.innerHTML = recordings.map(recording => {
        const performer = getMainPerformer(recording);
        const rating = recording.criticalReception?.rating || 0;
        const stars = generateStars(rating);
        const isHistorical = recording.recordingInfo.year < 1980;

        return `
            <div class="recording-card" onclick="showRecordingDetails('${recording.id}')">
                <div class="recording-cover ${isHistorical ? 'historical' : ''}">
                    <span>🎵</span>
                    <div class="recording-year-badge">${recording.recordingInfo.year}</div>
                </div>
                <div class="recording-info">
                    <div class="recording-work">${recording.composer} · ${recording.workId}</div>
                    <h3 class="recording-title">${recording.workTitle}</h3>
                    <div class="recording-performers">
                        <strong>${performer}</strong>
                    </div>
                    <div class="recording-meta">
                        <span class="recording-label">${recording.recordingInfo.label}</span>
                        <div class="recording-rating">
                            <span class="rating-stars">${stars}</span>
                            <span class="rating-value">${rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <div class="streaming-links">
                        ${recording.streamingLinks.map(link =>
                            `<a href="${link.url}"
                                class="streaming-link ${link.platform.toLowerCase().replace(' ', '-')}"
                                target="_blank"
                                onclick="event.stopPropagation()">
                                ${link.platform}
                            </a>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Display recordings in list view
 */
function displayListView(container, recordings) {
    container.className = 'recordings-list';

    if (recordings.length === 0) {
        container.innerHTML = '<p class="no-results">No recordings found matching your criteria.</p>';
        return;
    }

    container.innerHTML = recordings.map(recording => {
        const performer = getMainPerformer(recording);
        const rating = recording.criticalReception?.rating || 0;

        return `
            <div class="recording-list-item" onclick="showRecordingDetails('${recording.id}')">
                <div class="list-item-icon">🎵</div>
                <div class="list-item-details">
                    <div class="recording-work">${recording.composer} · ${recording.workId}</div>
                    <h3 class="recording-title">${recording.workTitle}</h3>
                    <div class="recording-performers">${performer}</div>
                    <div class="recording-meta">
                        <span>${recording.recordingInfo.label} · ${recording.recordingInfo.year}</span>
                    </div>
                </div>
                <div class="list-item-actions">
                    <div class="recording-rating">
                        <span>${generateStars(rating)}</span>
                        <span>${rating.toFixed(1)}</span>
                    </div>
                    <button class="btn-compare" onclick="event.stopPropagation(); addToComparison('${recording.id}')">
                        Compare
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get main performer from recording
 */
function getMainPerformer(recording) {
    if (recording.performers.soloist) {
        return recording.performers.soloist;
    } else if (recording.performers.conductor) {
        return recording.performers.conductor;
    } else if (recording.performers.ensemble) {
        return recording.performers.ensemble;
    }
    return 'Various Artists';
}

/**
 * Generate star rating display
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return '★'.repeat(fullStars) +
           (halfStar ? '☆' : '') +
           '☆'.repeat(emptyStars);
}

/**
 * Show recording details in modal
 */
function showRecordingDetails(recordingId) {
    const recording = allRecordings.find(r => r.id === recordingId);
    if (!recording) return;

    const modal = document.getElementById('recording-modal');
    const detailsContainer = document.getElementById('modal-recording-details');

    if (!modal || !detailsContainer) return;

    const performer = getMainPerformer(recording);
    const rating = recording.criticalReception?.rating || 0;

    detailsContainer.innerHTML = `
        <div class="modal-header-recording">
            <div class="modal-work-title">${recording.workTitle}</div>
            <div class="modal-performers">${performer}</div>
            <div class="recording-work">${recording.composer} · ${recording.workId}</div>
        </div>

        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Recording Year</div>
                <div class="detail-value">${recording.recordingInfo.year}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Label</div>
                <div class="detail-value">${recording.recordingInfo.label}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Duration</div>
                <div class="detail-value">${recording.recordingInfo.duration} min</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Rating</div>
                <div class="detail-value">${generateStars(rating)} ${rating.toFixed(1)}/5.0</div>
            </div>
        </div>

        ${recording.performers.ensemble ? `
            <div class="detail-section">
                <h3>Performers</h3>
                ${recording.performers.conductor ? `<p><strong>Conductor:</strong> ${recording.performers.conductor}</p>` : ''}
                <p><strong>Ensemble:</strong> ${recording.performers.ensemble}</p>
                ${recording.performers.soloists ? `
                    <p><strong>Soloists:</strong> ${recording.performers.soloists.join(', ')}</p>
                ` : ''}
            </div>
        ` : ''}

        <div class="detail-section">
            <h3>Recording Information</h3>
            <p><strong>Venue:</strong> ${recording.recordingInfo.venue}</p>
            <p><strong>Format:</strong> ${recording.recordingInfo.format.join(', ')}</p>
            <p><strong>Audio Quality:</strong> ${recording.audioQuality.format}</p>
            ${recording.audioQuality.remastered ? `<p><strong>Remastered:</strong> ${recording.audioQuality.remasterYear}</p>` : ''}
        </div>

        ${recording.historicalSignificance ? `
            <div class="historical-badge">
                🏛️ Historical Significance: ${recording.historicalSignificance}
            </div>
        ` : ''}

        <div class="detail-section">
            <h3>Streaming Availability</h3>
            <div class="streaming-links">
                ${recording.streamingLinks.map(link => `
                    <a href="${link.url}"
                       class="streaming-link ${link.platform.toLowerCase().replace(' ', '-')}"
                       target="_blank">
                        ${link.platform} ${link.subscription ? '(Subscription)' : '(Free)'}
                    </a>
                `).join('')}
            </div>
        </div>

        ${recording.criticalReception?.reviews ? `
            <div class="reviews-section">
                <h3>Critical Reviews</h3>
                ${recording.criticalReception.reviews.map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="review-source">${review.source}</span>
                            <span class="review-rating">${review.rating}</span>
                        </div>
                        <p class="review-excerpt">"${review.excerpt}"</p>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    modal.classList.remove('hidden');
}

/**
 * Close recording modal
 */
function closeRecordingModal() {
    const modal = document.getElementById('recording-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Change view mode
 */
function changeView(view) {
    currentView = view;

    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

    // Show/hide comparison section
    const comparisonSection = document.getElementById('comparison-section');
    const recordingsSection = document.querySelector('.recordings-section');

    if (view === 'compare') {
        comparisonSection?.classList.remove('hidden');
        recordingsSection.style.display = 'none';
    } else {
        comparisonSection?.classList.add('hidden');
        recordingsSection.style.display = 'block';
        displayRecordings();
    }
}

/**
 * Update statistics
 */
function updateStatistics() {
    const totalRecordings = document.getElementById('total-recordings');
    const totalPerformers = document.getElementById('total-performers');
    const avgRating = document.getElementById('avg-rating');

    if (totalRecordings) {
        totalRecordings.textContent = filteredRecordings.length;
    }

    if (totalPerformers) {
        const performers = new Set();
        filteredRecordings.forEach(rec => {
            if (rec.performers.soloist) performers.add(rec.performers.soloist);
            if (rec.performers.conductor) performers.add(rec.performers.conductor);
            if (rec.performers.ensemble) performers.add(rec.performers.ensemble);
        });
        totalPerformers.textContent = performers.size;
    }

    if (avgRating && filteredRecordings.length > 0) {
        const avg = filteredRecordings.reduce((sum, rec) =>
            sum + (rec.criticalReception?.rating || 0), 0
        ) / filteredRecordings.length;
        avgRating.textContent = avg.toFixed(1);
    }
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);

    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');

    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

/**
 * Navigate to previous page
 */
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayRecordings();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Navigate to next page
 */
function nextPage() {
    const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayRecordings();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Add recording to comparison
 */
function addToComparison(recordingId) {
    // Find first empty slot
    const emptySlot = comparisonSlots.findIndex(slot => slot === null);

    if (emptySlot === -1) {
        alert('All comparison slots are full. Remove a recording first.');
        return;
    }

    const recording = allRecordings.find(r => r.id === recordingId);
    if (recording) {
        comparisonSlots[emptySlot] = recording;
        updateComparisonView();
        showNotification('Recording added to comparison', 'success');
    }
}

/**
 * Update comparison view
 */
function updateComparisonView() {
    // Implementation for comparison view
    console.log('Comparison slots:', comparisonSlots);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
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
    }, 3000);
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('recordings-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
    }
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

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('recording-modal');
    if (modal && e.target === modal) {
        closeRecordingModal();
    }
});

// Export functions for global use
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.changeView = changeView;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.showRecordingDetails = showRecordingDetails;
window.closeRecordingModal = closeRecordingModal;
window.addToComparison = addToComparison;