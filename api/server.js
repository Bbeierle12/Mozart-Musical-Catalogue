/**
 * Early Composers Catalogue - API Server
 * RESTful API for accessing catalogue data
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, '..', 'assets')));

// Data cache
let dataCache = {
    composers: null,
    bachWorks: null,
    recordings: null,
    lastUpdated: null
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Load data from JSON files
 */
async function loadData(filename) {
    try {
        const filePath = path.join(__dirname, '..', 'database', 'data', filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        throw error;
    }
}

/**
 * Check if cache is valid
 */
function isCacheValid() {
    if (!dataCache.lastUpdated) return false;
    return Date.now() - dataCache.lastUpdated < CACHE_DURATION;
}

/**
 * Refresh data cache
 */
async function refreshCache() {
    try {
        dataCache.bachWorks = await loadData('bach-bwv-catalogue.json');
        dataCache.recordings = await loadData('recordings-database.json');
        dataCache.lastUpdated = Date.now();
        console.log('Cache refreshed successfully');
    } catch (error) {
        console.error('Error refreshing cache:', error);
    }
}

// Initialize cache on startup
refreshCache();

// =====================================================
// API ROUTES
// =====================================================

/**
 * Root endpoint - API documentation
 */
app.get('/api', (req, res) => {
    res.json({
        name: 'Early Composers Musical Catalogue API',
        version: '1.0.0',
        endpoints: {
            composers: {
                list: 'GET /api/composers',
                detail: 'GET /api/composers/:id',
                works: 'GET /api/composers/:id/works',
                recordings: 'GET /api/composers/:id/recordings'
            },
            works: {
                list: 'GET /api/works',
                detail: 'GET /api/works/:id',
                search: 'GET /api/works/search?q=query',
                byComposer: 'GET /api/works/composer/:composerId',
                byGenre: 'GET /api/works/genre/:genre',
                byYear: 'GET /api/works/year/:year'
            },
            recordings: {
                list: 'GET /api/recordings',
                detail: 'GET /api/recordings/:id',
                byWork: 'GET /api/recordings/work/:workId',
                byPerformer: 'GET /api/recordings/performer/:name'
            },
            search: {
                global: 'GET /api/search?q=query',
                advanced: 'POST /api/search/advanced'
            },
            stats: {
                overview: 'GET /api/stats',
                composer: 'GET /api/stats/composer/:id'
            }
        },
        documentation: '/api/docs'
    });
});

/**
 * GET /api/composers
 * List all composers
 */
app.get('/api/composers', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const composers = [
            {
                id: 'bach',
                fullName: dataCache.bachWorks.composer.fullName,
                birthDate: dataCache.bachWorks.composer.birthDate,
                deathDate: dataCache.bachWorks.composer.deathDate,
                nationality: dataCache.bachWorks.composer.nationality,
                period: dataCache.bachWorks.composer.period,
                totalWorks: dataCache.bachWorks.works.length,
                catalogSystem: dataCache.bachWorks.catalogSystem.abbreviation
            }
        ];

        res.json({
            success: true,
            count: composers.length,
            data: composers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch composers',
            message: error.message
        });
    }
});

/**
 * GET /api/composers/:id
 * Get composer details
 */
app.get('/api/composers/:id', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const { id } = req.params;

        if (id === 'bach') {
            res.json({
                success: true,
                data: {
                    ...dataCache.bachWorks.composer,
                    catalogSystem: dataCache.bachWorks.catalogSystem,
                    categories: dataCache.bachWorks.categories,
                    totalWorks: dataCache.bachWorks.works.length
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Composer not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch composer',
            message: error.message
        });
    }
});

/**
 * GET /api/works
 * List all works with pagination and filtering
 */
app.get('/api/works', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const {
            composer,
            genre,
            year,
            key,
            page = 1,
            limit = 50,
            sort = 'catalog'
        } = req.query;

        let works = [...dataCache.bachWorks.works];

        // Apply filters
        if (composer) {
            works = works.filter(w => w.composer?.toLowerCase() === composer.toLowerCase());
        }
        if (genre) {
            works = works.filter(w => w.category === genre);
        }
        if (year) {
            works = works.filter(w => w.yearComposed == year);
        }
        if (key) {
            works = works.filter(w => w.key === key);
        }

        // Sorting
        if (sort === 'catalog') {
            works.sort((a, b) => a.bwv.localeCompare(b.bwv));
        } else if (sort === 'year') {
            works.sort((a, b) => (a.yearComposed || 0) - (b.yearComposed || 0));
        } else if (sort === 'title') {
            works.sort((a, b) => a.title.localeCompare(b.title));
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedWorks = works.slice(startIndex, endIndex);

        res.json({
            success: true,
            count: paginatedWorks.length,
            total: works.length,
            page: parseInt(page),
            totalPages: Math.ceil(works.length / limit),
            data: paginatedWorks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch works',
            message: error.message
        });
    }
});

/**
 * GET /api/works/:id
 * Get work details
 */
app.get('/api/works/:id', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const { id } = req.params;
        const work = dataCache.bachWorks.works.find(w => w.bwv === id);

        if (work) {
            res.json({
                success: true,
                data: work
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Work not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch work',
            message: error.message
        });
    }
});

/**
 * GET /api/works/search
 * Search works
 */
app.get('/api/works/search', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const { q, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query required'
            });
        }

        const query = q.toLowerCase();
        const results = dataCache.bachWorks.works.filter(work => {
            return work.title.toLowerCase().includes(query) ||
                   work.bwv.toLowerCase().includes(query) ||
                   work.germanTitle?.toLowerCase().includes(query) ||
                   work.category.toLowerCase().includes(query);
        }).slice(0, parseInt(limit));

        res.json({
            success: true,
            query: q,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
});

/**
 * GET /api/recordings
 * List all recordings
 */
app.get('/api/recordings', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const {
            work,
            performer,
            year,
            platform,
            page = 1,
            limit = 20
        } = req.query;

        let recordings = [...dataCache.recordings.recordings];

        // Apply filters
        if (work) {
            recordings = recordings.filter(r => r.workId === work);
        }
        if (performer) {
            const performerLower = performer.toLowerCase();
            recordings = recordings.filter(r => {
                const performers = JSON.stringify(r.performers).toLowerCase();
                return performers.includes(performerLower);
            });
        }
        if (year) {
            recordings = recordings.filter(r => r.recordingInfo.year == year);
        }
        if (platform) {
            recordings = recordings.filter(r =>
                r.streamingLinks.some(link => link.platform === platform)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedRecordings = recordings.slice(startIndex, endIndex);

        res.json({
            success: true,
            count: paginatedRecordings.length,
            total: recordings.length,
            page: parseInt(page),
            totalPages: Math.ceil(recordings.length / limit),
            data: paginatedRecordings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recordings',
            message: error.message
        });
    }
});

/**
 * GET /api/recordings/:id
 * Get recording details
 */
app.get('/api/recordings/:id', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const { id } = req.params;
        const recording = dataCache.recordings.recordings.find(r => r.id === id);

        if (recording) {
            res.json({
                success: true,
                data: recording
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Recording not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recording',
            message: error.message
        });
    }
});

/**
 * GET /api/search
 * Global search across all content
 */
app.get('/api/search', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const { q, limit = 50 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query required'
            });
        }

        const query = q.toLowerCase();
        const results = {
            works: [],
            recordings: [],
            composers: []
        };

        // Search works
        results.works = dataCache.bachWorks.works.filter(work =>
            work.title.toLowerCase().includes(query) ||
            work.bwv.toLowerCase().includes(query) ||
            work.germanTitle?.toLowerCase().includes(query)
        ).slice(0, 20);

        // Search recordings
        results.recordings = dataCache.recordings.recordings.filter(rec =>
            rec.workTitle.toLowerCase().includes(query) ||
            JSON.stringify(rec.performers).toLowerCase().includes(query)
        ).slice(0, 20);

        // Search composers
        if (dataCache.bachWorks.composer.fullName.toLowerCase().includes(query)) {
            results.composers.push(dataCache.bachWorks.composer);
        }

        const totalResults = results.works.length + results.recordings.length + results.composers.length;

        res.json({
            success: true,
            query: q,
            totalResults,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
});

/**
 * GET /api/stats
 * Get catalogue statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const stats = {
            composers: 1,
            works: dataCache.bachWorks.works.length,
            recordings: dataCache.recordings.recordings.length,
            categories: Object.keys(dataCache.bachWorks.categories).length,
            streamingPlatforms: Object.keys(dataCache.recordings.platforms).length,
            averageRating: calculateAverageRating(dataCache.recordings.recordings),
            worksByCategory: getWorksByCategory(dataCache.bachWorks.works),
            recordingsByDecade: getRecordingsByDecade(dataCache.recordings.recordings)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
});

/**
 * POST /api/search/advanced
 * Advanced search with multiple criteria
 */
app.post('/api/search/advanced', async (req, res) => {
    try {
        if (!isCacheValid()) await refreshCache();

        const criteria = req.body;
        let results = [...dataCache.bachWorks.works];

        // Apply all criteria
        if (criteria.composer) {
            results = results.filter(w => w.composer === criteria.composer);
        }
        if (criteria.genre) {
            results = results.filter(w => w.category === criteria.genre);
        }
        if (criteria.key) {
            results = results.filter(w => w.key === criteria.key);
        }
        if (criteria.yearFrom) {
            results = results.filter(w => w.yearComposed >= criteria.yearFrom);
        }
        if (criteria.yearTo) {
            results = results.filter(w => w.yearComposed <= criteria.yearTo);
        }
        if (criteria.instrumentation) {
            const inst = criteria.instrumentation.toLowerCase();
            results = results.filter(w =>
                w.instrumentation?.toLowerCase().includes(inst)
            );
        }

        res.json({
            success: true,
            count: results.length,
            criteria,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Advanced search failed',
            message: error.message
        });
    }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateAverageRating(recordings) {
    const ratings = recordings
        .map(r => r.criticalReception?.rating)
        .filter(r => r !== undefined);

    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2);
}

function getWorksByCategory(works) {
    const categories = {};
    works.forEach(work => {
        categories[work.category] = (categories[work.category] || 0) + 1;
    });
    return categories;
}

function getRecordingsByDecade(recordings) {
    const decades = {};
    recordings.forEach(rec => {
        const decade = Math.floor(rec.recordingInfo.year / 10) * 10;
        decades[decade] = (decades[decade] || 0) + 1;
    });
    return decades;
}

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: '/api'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// =====================================================
// SERVER START
// =====================================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║   Early Composers Musical Catalogue API Server        ║
║   Version: 1.0.0                                       ║
║   Port: ${PORT}                                           ║
║   Status: Running                                      ║
║   Documentation: http://localhost:${PORT}/api             ║
╚════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;