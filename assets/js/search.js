/**
 * Advanced Search
 * Loads the catalogue and recordings data and powers the Works / Composers /
 * Recordings / Manuscripts tabs on search.html.
 */

const CATALOGUE_FILES = [
    'database/data/bach-bwv-catalogue.json',
    'database/data/handel-hwv-catalogue.json',
    'database/data/vivaldi-rv-catalogue.json',
    'database/data/mozart-kv-catalogue.json'
];

let cache = null;

/** Load and normalise all data once, then cache it. */
async function loadData() {
    if (cache) return cache;

    const catalogues = await Promise.all(
        CATALOGUE_FILES.map(url => fetch(url).then(r => r.json()))
    );

    const works = [];
    const composers = [];
    const manuscripts = [];

    catalogues.forEach(cat => {
        const c = cat.composer;
        const composerName = c.lastName || c.fullName.split(' ').pop();
        composers.push({
            id: c.id,
            fullName: c.fullName,
            name: composerName,
            period: c.period,
            nationality: c.nationality,
            birth: parseInt((c.birthDate || '').split('-')[0], 10),
            death: parseInt((c.deathDate || '').split('-')[0], 10),
            totalWorks: c.totalWorks,
            biography: c.biography,
            link: `composers/${c.id}/index.html`
        });

        (cat.works || []).forEach(w => {
            works.push({
                catalogNumber: w.bwv || w.rv || w.hwv || w.kv || w.catalogNumber || '',
                title: w.title,
                category: w.category || '',
                key: w.key || '',
                yearComposed: w.yearComposed || null,
                instrumentation: w.instrumentation || '',
                duration: w.duration || null,
                description: w.description || '',
                composer: composerName,
                composerId: c.id
            });
        });

        (cat.manuscript_locations || []).forEach(loc => {
            manuscripts.push({ composer: composerName, location: loc });
        });
    });

    let recordings = [];
    try {
        const rec = await fetch('database/data/recordings-database.json').then(r => r.json());
        recordings = rec.recordings || [];
    } catch (e) {
        recordings = [];
    }

    cache = { works, composers, recordings, manuscripts };
    return cache;
}

/* ----------------------------- Tabs ----------------------------- */

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c =>
        c.classList.toggle('active', c.id === `${tab}-tab`));
}

/* --------------------------- Rendering -------------------------- */

function setCount(n) {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `${n} result${n === 1 ? '' : 's'}`;
}

function renderResults(html) {
    const container = document.getElementById('results-container');
    if (!container) return;
    container.innerHTML = html ||
        '<div class="no-results"><p>No matches found. Try broadening your search.</p></div>';
    const results = document.getElementById('search-results');
    if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Turn a catalogue number into a URL-safe anchor slug.
 * NOTE: composer-common.js carries an identical copy (the pages load the two
 * scripts independently); keep them in sync.
 */
function slugifyCatalogNumber(catalogNumber) {
    return String(catalogNumber || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function workCard(w) {
    const cataloguePage = `composers/${w.composerId}/index.html`;
    const slug = slugifyCatalogNumber(w.catalogNumber);
    const workUrl = slug ? `${cataloguePage}#${slug}` : cataloguePage;
    return `
        <div class="result-card">
            <h3><a href="${workUrl}">${w.title}</a></h3>
            <p class="result-meta">${[w.catalogNumber, w.composer].filter(Boolean).join(' · ')}</p>
            <p class="result-meta">${[w.category, w.key, w.yearComposed].filter(Boolean).join(' · ')}</p>
            ${w.instrumentation ? `<p class="result-sub">${w.instrumentation}</p>` : ''}
            <a href="${cataloguePage}">View ${w.composer} catalogue →</a>
        </div>`;
}

function composerCard(c) {
    return `
        <div class="result-card">
            <h3>${c.fullName}</h3>
            <p class="result-meta">${c.birth}–${c.death} · ${c.period} · ${c.nationality}</p>
            <p class="result-sub">~${c.totalWorks} works catalogued</p>
            <a href="${c.link}">Explore catalogue →</a>
        </div>`;
}

function recordingCard(r) {
    const perf = r.performers || {};
    const players = [perf.conductor, perf.soloist, perf.ensemble]
        .concat(perf.soloists || []).filter(Boolean).join(', ');
    const info = r.recordingInfo || {};
    const links = (r.streamingLinks || [])
        .map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.platform}</a>`).join(' · ');
    return `
        <div class="result-card">
            <h3>${r.workTitle}</h3>
            <p class="result-meta">${[r.composer, players].filter(Boolean).join(' · ')}</p>
            <p class="result-sub">${[info.label, info.year].filter(Boolean).join(', ')}</p>
            ${links ? `<p class="result-links">${links}</p>` : ''}
        </div>`;
}

function manuscriptCard(m) {
    return `
        <div class="result-card">
            <h3>${m.location}</h3>
            <p class="result-meta">${m.composer}</p>
        </div>`;
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function num(id) {
    const v = val(id);
    return v === '' ? null : parseInt(v, 10);
}

/* --------------------------- Searches --------------------------- */

async function performGlobalSearch() {
    const term = val('global-search').toLowerCase();
    const data = await loadData();
    if (!term) {
        renderResults('<div class="no-results"><p>Enter a search term to begin.</p></div>');
        setCount(0);
        return;
    }

    const works = data.works.filter(w =>
        w.title.toLowerCase().includes(term) ||
        w.catalogNumber.toLowerCase().includes(term) ||
        w.composer.toLowerCase().includes(term) ||
        w.category.toLowerCase().includes(term));
    const composers = data.composers.filter(c =>
        c.fullName.toLowerCase().includes(term) ||
        c.period.toLowerCase().includes(term) ||
        c.nationality.toLowerCase().includes(term));
    const recordings = data.recordings.filter(r =>
        (r.workTitle || '').toLowerCase().includes(term) ||
        (r.composer || '').toLowerCase().includes(term));

    const total = works.length + composers.length + recordings.length;
    setCount(total);

    let html = '';
    if (composers.length) html += '<h2 class="result-group">Composers</h2>' + composers.map(composerCard).join('');
    if (works.length) html += '<h2 class="result-group">Works</h2>' + works.slice(0, 50).map(workCard).join('');
    if (recordings.length) html += '<h2 class="result-group">Recordings</h2>' + recordings.map(recordingCard).join('');
    renderResults(html);
}

async function searchWorks() {
    const data = await loadData();
    const composer = val('works-composer');
    const genre = val('works-genre').toLowerCase();
    const key = val('works-key');
    const yearFrom = num('year-from');
    const yearTo = num('year-to');
    const instr = val('works-instrumentation').toLowerCase();
    const durMin = num('duration-min');
    const durMax = num('duration-max');

    const results = data.works.filter(w => {
        if (composer && w.composer !== composer) return false;
        if (genre && !(w.category.toLowerCase().includes(genre) || genre.includes(w.category.toLowerCase()))) return false;
        if (key && w.key !== key) return false;
        if (yearFrom != null && (w.yearComposed == null || w.yearComposed < yearFrom)) return false;
        if (yearTo != null && (w.yearComposed == null || w.yearComposed > yearTo)) return false;
        if (instr && !w.instrumentation.toLowerCase().includes(instr)) return false;
        if (durMin != null && (w.duration == null || w.duration < durMin)) return false;
        if (durMax != null && (w.duration == null || w.duration > durMax)) return false;
        return true;
    });

    setCount(results.length);
    renderResults(results.map(workCard).join(''));
}

async function searchComposers() {
    const data = await loadData();
    const period = val('composer-period');
    const nationality = val('composer-nationality');
    const birthFrom = num('birth-from');
    const birthTo = num('birth-to');

    const results = data.composers.filter(c => {
        if (period && c.period !== period) return false;
        if (nationality && c.nationality !== nationality) return false;
        if (birthFrom != null && c.birth < birthFrom) return false;
        if (birthTo != null && c.birth > birthTo) return false;
        return true;
    });

    setCount(results.length);
    renderResults(results.map(composerCard).join(''));
}

async function searchRecordings() {
    const data = await loadData();
    const performer = val('recording-performer').toLowerCase();
    const label = val('recording-label').toLowerCase();
    const yearFrom = num('rec-year-from');
    const yearTo = num('rec-year-to');
    const platform = val('recording-platform');
    const historicalEl = document.getElementById('historical-only');
    const historical = historicalEl ? historicalEl.checked : false;

    const results = data.recordings.filter(r => {
        const info = r.recordingInfo || {};
        const perf = r.performers || {};
        const performerStr = [perf.conductor, perf.soloist, perf.ensemble]
            .concat(perf.soloists || []).filter(Boolean).join(' ').toLowerCase();
        if (performer && !performerStr.includes(performer)) return false;
        if (label && !(info.label || '').toLowerCase().includes(label)) return false;
        if (yearFrom != null && (info.year == null || info.year < yearFrom)) return false;
        if (yearTo != null && (info.year == null || info.year > yearTo)) return false;
        if (platform && !(r.streamingLinks || []).some(l => l.platform === platform)) return false;
        if (historical && !(info.year != null && info.year < 1980)) return false;
        return true;
    });

    setCount(results.length);
    renderResults(results.map(recordingCard).join(''));
}

async function searchManuscripts() {
    const data = await loadData();
    const location = val('manuscript-location').toLowerCase();

    const results = data.manuscripts.filter(m =>
        !location || m.location.toLowerCase().includes(location));

    setCount(results.length);
    renderResults(results.map(manuscriptCard).join(''));
}

/* ------------------------- Initialisation ------------------------ */

document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill from ?q= and run a global search
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const input = document.getElementById('global-search');
    if (q && input) {
        input.value = q;
        performGlobalSearch();
    }
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performGlobalSearch();
        });
    }
    // Warm the cache so the first explicit search is instant
    loadData().catch(() => {});
});

window.performGlobalSearch = performGlobalSearch;
window.switchTab = switchTab;
window.searchWorks = searchWorks;
window.searchComposers = searchComposers;
window.searchRecordings = searchRecordings;
window.searchManuscripts = searchManuscripts;

// Exposed for the Jest suite; harmless in the browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { slugifyCatalogNumber, workCard, composerCard, loadData };
}
