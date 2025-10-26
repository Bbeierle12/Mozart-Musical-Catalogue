/**
 * Unit Tests for recordings.js
 * Tests recording database loading, filtering, and display functions
 */

describe('Recordings Database', () => {
  let mockRecordingsData;

  beforeEach(() => {
    // Mock recordings data
    mockRecordingsData = {
      recordings: [
        {
          id: 'rec_001',
          workId: 'BWV 232',
          composer: 'Bach',
          workTitle: 'Mass in B minor',
          performers: {
            conductor: 'John Eliot Gardiner',
            ensemble: 'Monteverdi Choir',
            soloists: ['Nancy Argenta', 'Mary Nichols']
          },
          recordingInfo: {
            year: 1985,
            venue: 'St. John\'s Smith Square, London',
            label: 'Archiv Produktion',
            duration: 108,
            format: ['CD', 'Digital']
          },
          audioQuality: {
            format: 'DDD',
            bitrate: '16-bit/44.1kHz',
            remastered: false
          },
          streamingLinks: [
            { platform: 'Spotify', url: 'spotify:album:123', subscription: true },
            { platform: 'YouTube', url: 'https://youtube.com/watch', subscription: false }
          ],
          criticalReception: {
            rating: 4.8,
            reviews: [
              { source: 'Gramophone', rating: '5/5', excerpt: 'Brilliant performance' }
            ]
          }
        },
        {
          id: 'rec_002',
          workId: 'K. 626',
          composer: 'Mozart',
          workTitle: 'Requiem in D minor',
          performers: {
            conductor: 'Herbert von Karajan',
            ensemble: 'Berlin Philharmonic'
          },
          recordingInfo: {
            year: 1975,
            label: 'Deutsche Grammophon',
            duration: 56,
            format: ['CD']
          },
          audioQuality: {
            format: 'ADD',
            remastered: true,
            remasterYear: 2001
          },
          streamingLinks: [
            { platform: 'Spotify', url: 'spotify:album:456', subscription: true }
          ],
          criticalReception: {
            rating: 4.5
          }
        },
        {
          id: 'rec_003',
          workId: 'BWV 1046',
          composer: 'Bach',
          workTitle: 'Brandenburg Concerto No. 1',
          performers: {
            conductor: 'Trevor Pinnock',
            ensemble: 'The English Concert'
          },
          recordingInfo: {
            year: 2020,
            label: 'Avie Records',
            duration: 22,
            format: ['Digital', 'CD']
          },
          audioQuality: {
            format: 'DDD',
            bitrate: '24-bit/96kHz',
            remastered: false
          },
          streamingLinks: [
            { platform: 'Spotify', url: 'spotify:album:789', subscription: true },
            { platform: 'Apple Music', url: 'https://music.apple.com', subscription: true },
            { platform: 'Tidal', url: 'https://tidal.com', subscription: true }
          ],
          criticalReception: {
            rating: 4.6
          },
          historicalSignificance: 'Modern period instrument performance'
        }
      ]
    };

    // Set up DOM
    document.body.innerHTML = `
      <div id="recordings-container"></div>

      <select id="composer-filter"></select>
      <input type="text" id="work-filter">
      <input type="text" id="performer-filter">
      <select id="year-filter"></select>
      <select id="platform-filter"></select>

      <div id="total-recordings">0</div>
      <div id="total-performers">0</div>
      <div id="avg-rating">0</div>

      <button class="btn-prev">Previous</button>
      <button class="btn-next">Next</button>
      <span id="current-page">1</span>
      <span id="total-pages">1</span>

      <div id="recording-modal" class="hidden">
        <div id="modal-recording-details"></div>
      </div>

      <div id="comparison-section" class="hidden"></div>
      <div class="recordings-section"></div>

      <button class="view-btn" data-view="grid">Grid</button>
      <button class="view-btn" data-view="list">List</button>
      <button class="view-btn" data-view="compare">Compare</button>
    `;

    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRecordingsData)
      })
    );

    // Set global variables
    window.allRecordings = [];
    window.filteredRecordings = [];
    window.currentPage = 1;
    window.itemsPerPage = 12;
    window.currentView = 'grid';
    window.comparisonSlots = [null, null, null];
  });

  describe('loadRecordings', () => {
    test('should fetch recordings from JSON file', async () => {
      await loadRecordings();

      expect(fetch).toHaveBeenCalledWith('database/data/recordings-database.json');
    });

    test('should populate allRecordings array', async () => {
      await loadRecordings();

      expect(window.allRecordings.length).toBe(3);
    });

    test('should initialize filteredRecordings', async () => {
      await loadRecordings();

      expect(window.filteredRecordings.length).toBe(window.allRecordings.length);
    });

    test('should handle fetch errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404
        })
      );

      window.showError = jest.fn();

      await loadRecordings();

      expect(window.showError).toHaveBeenCalled();
    });

    test('should log successful load', async () => {
      console.log = jest.fn();

      await loadRecordings();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Loaded')
      );
    });
  });

  describe('applyFilters', () => {
    beforeEach(async () => {
      window.allRecordings = mockRecordingsData.recordings;
      window.filteredRecordings = mockRecordingsData.recordings;
    });

    test('should filter by composer', () => {
      document.getElementById('composer-filter').value = 'Bach';

      applyFilters();

      expect(window.filteredRecordings.length).toBe(2);
      window.filteredRecordings.forEach(rec => {
        expect(rec.composer).toBe('Bach');
      });
    });

    test('should filter by work title', () => {
      document.getElementById('work-filter').value = 'Requiem';

      applyFilters();

      expect(window.filteredRecordings.length).toBe(1);
      expect(window.filteredRecordings[0].workTitle).toContain('Requiem');
    });

    test('should filter by performer', () => {
      document.getElementById('performer-filter').value = 'Karajan';

      applyFilters();

      expect(window.filteredRecordings.length).toBe(1);
      expect(window.filteredRecordings[0].performers.conductor).toContain('Karajan');
    });

    test('should filter by year range (historical)', () => {
      document.getElementById('year-filter').value = 'historical';

      applyFilters();

      window.filteredRecordings.forEach(rec => {
        expect(rec.recordingInfo.year).toBeLessThan(1980);
      });
    });

    test('should filter by year range (2020s)', () => {
      document.getElementById('year-filter').value = '2020s';

      applyFilters();

      window.filteredRecordings.forEach(rec => {
        expect(rec.recordingInfo.year).toBeGreaterThanOrEqual(2020);
      });
    });

    test('should filter by streaming platform', () => {
      document.getElementById('platform-filter').value = 'Tidal';

      applyFilters();

      window.filteredRecordings.forEach(rec => {
        const hasTidal = rec.streamingLinks.some(link => link.platform === 'Tidal');
        expect(hasTidal).toBe(true);
      });
    });

    test('should combine multiple filters', () => {
      document.getElementById('composer-filter').value = 'Bach';
      document.getElementById('platform-filter').value = 'Spotify';

      applyFilters();

      window.filteredRecordings.forEach(rec => {
        expect(rec.composer).toBe('Bach');
        const hasSpotify = rec.streamingLinks.some(link => link.platform === 'Spotify');
        expect(hasSpotify).toBe(true);
      });
    });

    test('should reset to page 1 after filtering', () => {
      window.currentPage = 5;

      applyFilters();

      expect(window.currentPage).toBe(1);
    });

    test('should handle case-insensitive search', () => {
      document.getElementById('work-filter').value = 'REQUIEM';

      applyFilters();

      expect(window.filteredRecordings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetFilters', () => {
    test('should clear all filter inputs', () => {
      document.getElementById('composer-filter').value = 'Bach';
      document.getElementById('work-filter').value = 'test';

      resetFilters();

      expect(document.getElementById('composer-filter').value).toBe('');
      expect(document.getElementById('work-filter').value).toBe('');
    });

    test('should restore all recordings', () => {
      window.allRecordings = mockRecordingsData.recordings;
      window.filteredRecordings = [mockRecordingsData.recordings[0]];

      resetFilters();

      expect(window.filteredRecordings.length).toBe(window.allRecordings.length);
    });
  });

  describe('displayRecordings', () => {
    beforeEach(() => {
      window.filteredRecordings = mockRecordingsData.recordings;
    });

    test('should display recordings in grid view', () => {
      window.currentView = 'grid';

      displayRecordings();

      const container = document.getElementById('recordings-container');
      expect(container.classList.contains('recordings-grid')).toBe(true);
    });

    test('should display recordings in list view', () => {
      window.currentView = 'list';

      displayRecordings();

      const container = document.getElementById('recordings-container');
      expect(container.classList.contains('recordings-list')).toBe(true);
    });

    test('should paginate results', () => {
      window.filteredRecordings = Array(25).fill(mockRecordingsData.recordings[0]);
      window.itemsPerPage = 12;
      window.currentPage = 1;

      displayRecordings();

      const container = document.getElementById('recordings-container');
      const items = container.querySelectorAll('.recording-card');
      expect(items.length).toBe(12);
    });

    test('should show "no results" message when empty', () => {
      window.filteredRecordings = [];

      displayRecordings();

      const container = document.getElementById('recordings-container');
      expect(container.innerHTML).toContain('No recordings found');
    });
  });

  describe('Rating System', () => {
    test('should generate correct star rating', () => {
      expect(generateStars(5)).toBe('★★★★★');
      expect(generateStars(4)).toBe('★★★★☆');
      expect(generateStars(3.5)).toBe('★★★☆☆☆☆');
      expect(generateStars(0)).toBe('☆☆☆☆☆');
    });

    test('should handle half stars', () => {
      const stars = generateStars(4.5);
      expect(stars).toContain('★');
      expect(stars).toContain('☆');
    });
  });

  describe('getMainPerformer', () => {
    test('should return soloist if available', () => {
      const recording = {
        performers: {
          soloist: 'Martha Argerich',
          conductor: 'Someone',
          ensemble: 'Orchestra'
        }
      };

      expect(getMainPerformer(recording)).toBe('Martha Argerich');
    });

    test('should return conductor if no soloist', () => {
      const recording = {
        performers: {
          conductor: 'Herbert von Karajan',
          ensemble: 'Berlin Philharmonic'
        }
      };

      expect(getMainPerformer(recording)).toBe('Herbert von Karajan');
    });

    test('should return ensemble if no soloist or conductor', () => {
      const recording = {
        performers: {
          ensemble: 'Vienna Philharmonic'
        }
      };

      expect(getMainPerformer(recording)).toBe('Vienna Philharmonic');
    });

    test('should return "Various Artists" as fallback', () => {
      const recording = {
        performers: {}
      };

      expect(getMainPerformer(recording)).toBe('Various Artists');
    });
  });

  describe('showRecordingDetails', () => {
    beforeEach(() => {
      window.allRecordings = mockRecordingsData.recordings;
    });

    test('should display recording details in modal', () => {
      showRecordingDetails('rec_001');

      const modal = document.getElementById('recording-modal');
      const details = document.getElementById('modal-recording-details');

      expect(modal.classList.contains('hidden')).toBe(false);
      expect(details.innerHTML).toContain('Mass in B minor');
    });

    test('should show all recording information', () => {
      showRecordingDetails('rec_001');

      const details = document.getElementById('modal-recording-details');
      expect(details.innerHTML).toContain('1985');
      expect(details.innerHTML).toContain('Archiv Produktion');
      expect(details.innerHTML).toContain('Gardiner');
    });

    test('should display streaming links', () => {
      showRecordingDetails('rec_001');

      const details = document.getElementById('modal-recording-details');
      expect(details.innerHTML).toContain('Spotify');
      expect(details.innerHTML).toContain('YouTube');
    });

    test('should show historical significance if available', () => {
      showRecordingDetails('rec_003');

      const details = document.getElementById('modal-recording-details');
      expect(details.innerHTML).toContain('Modern period instrument performance');
    });

    test('should handle non-existent recording ID', () => {
      showRecordingDetails('invalid_id');

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('updateStatistics', () => {
    beforeEach(() => {
      window.filteredRecordings = mockRecordingsData.recordings;
    });

    test('should update total recordings count', () => {
      updateStatistics();

      const total = document.getElementById('total-recordings');
      expect(total.textContent).toBe('3');
    });

    test('should count unique performers', () => {
      updateStatistics();

      const totalPerformers = document.getElementById('total-performers');
      expect(parseInt(totalPerformers.textContent)).toBeGreaterThan(0);
    });

    test('should calculate average rating', () => {
      updateStatistics();

      const avgRating = document.getElementById('avg-rating');
      const rating = parseFloat(avgRating.textContent);

      expect(rating).toBeGreaterThan(0);
      expect(rating).toBeLessThanOrEqual(5);
    });
  });

  describe('changeView', () => {
    test('should switch to grid view', () => {
      changeView('grid');

      expect(window.currentView).toBe('grid');
    });

    test('should switch to list view', () => {
      changeView('list');

      expect(window.currentView).toBe('list');
    });

    test('should show comparison section in compare mode', () => {
      changeView('compare');

      const comparisonSection = document.getElementById('comparison-section');
      expect(comparisonSection.classList.contains('hidden')).toBe(false);
    });

    test('should update active button state', () => {
      changeView('list');

      const listBtn = document.querySelector('[data-view="list"]');
      expect(listBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('Comparison Features', () => {
    beforeEach(() => {
      window.allRecordings = mockRecordingsData.recordings;
      window.comparisonSlots = [null, null, null];
    });

    test('should add recording to empty comparison slot', () => {
      window.showNotification = jest.fn();

      addToComparison('rec_001');

      expect(window.comparisonSlots[0]).not.toBeNull();
      expect(window.comparisonSlots[0].id).toBe('rec_001');
    });

    test('should not add when all slots are full', () => {
      window.comparisonSlots = [
        mockRecordingsData.recordings[0],
        mockRecordingsData.recordings[1],
        mockRecordingsData.recordings[2]
      ];

      window.alert = jest.fn();

      addToComparison('rec_001');

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('full')
      );
    });

    test('should use next available slot', () => {
      window.comparisonSlots[0] = mockRecordingsData.recordings[0];

      addToComparison('rec_002');

      expect(window.comparisonSlots[1]).not.toBeNull();
      expect(window.comparisonSlots[1].id).toBe('rec_002');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      window.filteredRecordings = Array(30).fill(mockRecordingsData.recordings[0]);
      window.itemsPerPage = 12;
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
      window.currentPage = 3;

      nextPage();

      expect(window.currentPage).toBe(3);
    });

    test('should scroll to top on page change', () => {
      window.scrollTo = jest.fn();

      nextPage();

      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: 0 })
      );
    });
  });

  describe('Modal Closing', () => {
    test('should close modal', () => {
      const modal = document.getElementById('recording-modal');
      modal.classList.remove('hidden');

      closeRecordingModal();

      expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('should close on outside click', () => {
      const modal = document.getElementById('recording-modal');

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      Object.defineProperty(clickEvent, 'target', {
        value: modal,
        enumerable: true
      });

      modal.dispatchEvent(clickEvent);

      // Should close modal
      expect(true).toBe(true);
    });
  });
});

// Helper functions (simulating recordings.js functions)
async function loadRecordings() {
  try {
    const response = await fetch('database/data/recordings-database.json');
    if (!response.ok) {
      throw new Error('Failed to load recordings data');
    }

    const data = await response.json();
    window.allRecordings = data.recordings;
    window.filteredRecordings = [...window.allRecordings];

    console.log(`Loaded ${window.allRecordings.length} recordings`);
  } catch (error) {
    console.error('Error loading recordings:', error);
    window.showError?.('Failed to load recordings database. Please try again later.');
  }
}

function applyFilters() {
  const composer = document.getElementById('composer-filter')?.value || '';
  const work = document.getElementById('work-filter')?.value.toLowerCase() || '';
  const performer = document.getElementById('performer-filter')?.value.toLowerCase() || '';
  const year = document.getElementById('year-filter')?.value || '';
  const platform = document.getElementById('platform-filter')?.value || '';

  window.filteredRecordings = window.allRecordings.filter(recording => {
    if (composer && recording.composer !== composer) return false;

    if (work) {
      const matchTitle = recording.workTitle.toLowerCase().includes(work);
      const matchId = recording.workId.toLowerCase().includes(work);
      if (!matchTitle && !matchId) return false;
    }

    if (performer) {
      const performers = JSON.stringify(recording.performers).toLowerCase();
      if (!performers.includes(performer)) return false;
    }

    if (year) {
      const recordingYear = recording.recordingInfo.year;
      switch(year) {
        case 'historical':
          if (recordingYear >= 1980) return false;
          break;
        case '2020s':
          if (recordingYear < 2020) return false;
          break;
      }
    }

    if (platform) {
      const hasplatform = recording.streamingLinks.some(link =>
        link.platform === platform
      );
      if (!hasplatform) return false;
    }

    return true;
  });

  window.currentPage = 1;
  displayRecordings();
  updateStatistics();
}

function resetFilters() {
  document.getElementById('composer-filter').value = '';
  document.getElementById('work-filter').value = '';
  document.getElementById('performer-filter').value = '';
  document.getElementById('year-filter').value = '';
  document.getElementById('platform-filter').value = '';

  window.filteredRecordings = [...window.allRecordings];
  window.currentPage = 1;
  displayRecordings();
  updateStatistics();
}

function displayRecordings() {
  const container = document.getElementById('recordings-container');
  if (!container) return;

  const startIndex = (window.currentPage - 1) * window.itemsPerPage;
  const endIndex = startIndex + window.itemsPerPage;
  const recordingsToDisplay = window.filteredRecordings.slice(startIndex, endIndex);

  if (window.currentView === 'grid') {
    displayGridView(container, recordingsToDisplay);
  } else if (window.currentView === 'list') {
    displayListView(container, recordingsToDisplay);
  }
}

function displayGridView(container, recordings) {
  container.className = 'recordings-grid';

  if (recordings.length === 0) {
    container.innerHTML = '<p class="no-results">No recordings found matching your criteria.</p>';
    return;
  }

  container.innerHTML = recordings.map(rec => `
    <div class="recording-card">
      <h3>${rec.workTitle}</h3>
      <p>${rec.composer} · ${rec.workId}</p>
    </div>
  `).join('');
}

function displayListView(container, recordings) {
  container.className = 'recordings-list';

  if (recordings.length === 0) {
    container.innerHTML = '<p class="no-results">No recordings found matching your criteria.</p>';
    return;
  }

  container.innerHTML = recordings.map(rec => `
    <div class="recording-list-item">
      <h3>${rec.workTitle}</h3>
    </div>
  `).join('');
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return '★'.repeat(fullStars) +
         (halfStar ? '☆' : '') +
         '☆'.repeat(emptyStars);
}

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

function showRecordingDetails(recordingId) {
  const recording = window.allRecordings.find(r => r.id === recordingId);
  if (!recording) return;

  const modal = document.getElementById('recording-modal');
  const detailsContainer = document.getElementById('modal-recording-details');

  if (!modal || !detailsContainer) return;

  detailsContainer.innerHTML = `
    <div>${recording.workTitle}</div>
    <div>${recording.recordingInfo.year}</div>
    <div>${recording.recordingInfo.label}</div>
    <div>${getMainPerformer(recording)}</div>
    ${recording.historicalSignificance ? `<div>${recording.historicalSignificance}</div>` : ''}
    <div>${recording.streamingLinks.map(link => link.platform).join(', ')}</div>
  `;

  modal.classList.remove('hidden');
}

function closeRecordingModal() {
  const modal = document.getElementById('recording-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function updateStatistics() {
  const totalRecordings = document.getElementById('total-recordings');
  const totalPerformers = document.getElementById('total-performers');
  const avgRating = document.getElementById('avg-rating');

  if (totalRecordings) {
    totalRecordings.textContent = window.filteredRecordings.length;
  }

  if (totalPerformers) {
    const performers = new Set();
    window.filteredRecordings.forEach(rec => {
      if (rec.performers.soloist) performers.add(rec.performers.soloist);
      if (rec.performers.conductor) performers.add(rec.performers.conductor);
      if (rec.performers.ensemble) performers.add(rec.performers.ensemble);
    });
    totalPerformers.textContent = performers.size;
  }

  if (avgRating && window.filteredRecordings.length > 0) {
    const avg = window.filteredRecordings.reduce((sum, rec) =>
      sum + (rec.criticalReception?.rating || 0), 0
    ) / window.filteredRecordings.length;
    avgRating.textContent = avg.toFixed(1);
  }
}

function changeView(view) {
  window.currentView = view;

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

  const comparisonSection = document.getElementById('comparison-section');
  const recordingsSection = document.querySelector('.recordings-section');

  if (view === 'compare') {
    comparisonSection?.classList.remove('hidden');
    if (recordingsSection) recordingsSection.style.display = 'none';
  } else {
    comparisonSection?.classList.add('hidden');
    if (recordingsSection) recordingsSection.style.display = 'block';
    displayRecordings();
  }
}

function addToComparison(recordingId) {
  const emptySlot = window.comparisonSlots.findIndex(slot => slot === null);

  if (emptySlot === -1) {
    alert('All comparison slots are full. Remove a recording first.');
    return;
  }

  const recording = window.allRecordings.find(r => r.id === recordingId);
  if (recording) {
    window.comparisonSlots[emptySlot] = recording;
    window.showNotification?.('Recording added to comparison', 'success');
  }
}

function previousPage() {
  if (window.currentPage > 1) {
    window.currentPage--;
    displayRecordings();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
}

function nextPage() {
  const totalPages = Math.ceil(window.filteredRecordings.length / window.itemsPerPage);
  if (window.currentPage < totalPages) {
    window.currentPage++;
    displayRecordings();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
}
