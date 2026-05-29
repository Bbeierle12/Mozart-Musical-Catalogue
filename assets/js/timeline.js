/**
 * Interactive Timeline
 * Renders composer lifespans and historical events across 1600-1850
 * and wires up the view/period/zoom controls used by timeline.html.
 */

const TIMELINE_START = 1600;
const TIMELINE_END = 1850;
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

const COMPOSERS = [
    { id: 'monteverdi', name: 'Monteverdi', birth: 1567, death: 1643, period: 'transition', filter: 'baroque',
      contribution: 'Pioneered opera and developed the seconda pratica.',
      works: ["L'Orfeo (1607)", "Vespro della Beata Vergine (1610)", "L'incoronazione di Poppea (1643)"] },
    { id: 'purcell', name: 'Purcell', birth: 1659, death: 1695, period: 'baroque', filter: 'baroque',
      contribution: 'Leading English Baroque composer.',
      works: ['Dido and Aeneas (1689)', 'The Fairy-Queen (1692)'] },
    { id: 'vivaldi', name: 'Vivaldi', birth: 1678, death: 1741, period: 'baroque', filter: 'baroque',
      contribution: 'Virtuoso violinist; created The Four Seasons.', link: 'composers/vivaldi/index.html',
      works: ['The Four Seasons (1723)', 'Gloria RV 589', "L'estro armonico (1711)"] },
    { id: 'bach', name: 'Bach', birth: 1685, death: 1750, period: 'baroque', filter: 'baroque',
      contribution: 'Master of counterpoint and sacred music.', link: 'composers/bach/index.html',
      works: ['Brandenburg Concertos (1721)', 'Mass in B minor', 'Goldberg Variations (1741)'] },
    { id: 'handel', name: 'Handel', birth: 1685, death: 1759, period: 'baroque', filter: 'baroque',
      contribution: 'Oratorio master; composed Messiah.', link: 'composers/handel/index.html',
      works: ['Water Music (1717)', 'Messiah (1741)', 'Music for the Royal Fireworks (1749)'] },
    { id: 'haydn', name: 'Haydn', birth: 1732, death: 1809, period: 'classical', filter: 'classical',
      contribution: 'Father of the Symphony and String Quartet.',
      works: ['Symphony No. 94 "Surprise"', 'The Creation (1798)', 'String Quartets Op. 76'] },
    { id: 'mozart', name: 'Mozart', birth: 1756, death: 1791, period: 'classical', filter: 'classical',
      contribution: 'Prodigy who mastered every musical form.', link: 'composers/mozart/index.html',
      works: ['Le nozze di Figaro (1786)', 'Symphony No. 40 (1788)', 'Requiem (1791)'] },
    { id: 'beethoven', name: 'Beethoven', birth: 1770, death: 1827, period: 'transition', filter: 'classical',
      contribution: 'Bridged the Classical and Romantic eras.',
      works: ['Symphony No. 5 (1808)', 'Symphony No. 9 (1824)', 'Fidelio (1805)'] },
    { id: 'schubert', name: 'Schubert', birth: 1797, death: 1828, period: 'romantic', filter: 'romantic',
      contribution: 'Master of the German Lied.',
      works: ['Erlkönig (1815)', 'Symphony No. 8 "Unfinished"', 'Winterreise (1827)'] }
];

const EVENTS = [
    { year: 1607, label: "Monteverdi's L'Orfeo" },
    { year: 1685, label: 'Bach & Handel born' },
    { year: 1723, label: 'Vivaldi: Four Seasons' },
    { year: 1741, label: "Handel's Messiah begun" },
    { year: 1791, label: "Mozart's death" },
    { year: 1824, label: "Beethoven's Symphony No. 9" }
];

let zoom = 100;
let currentPeriod = 'all';
let currentView = 'lifespans';

function yearToPercent(year) {
    const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, year));
    return ((clamped - TIMELINE_START) / TIMELINE_SPAN) * 100;
}

function renderTimeline() {
    const track = document.getElementById('timeline-track');
    const eventsTrack = document.getElementById('events-track');
    if (!track) return;

    track.innerHTML = '';
    if (eventsTrack) eventsTrack.innerHTML = '';

    const visible = COMPOSERS.filter(c =>
        currentPeriod === 'all' || c.filter === currentPeriod
    );

    const showLifespans = currentView === 'lifespans' || currentView === 'all' || currentView === 'works';
    const showEvents = currentView === 'events' || currentView === 'all';

    if (showLifespans) {
        visible.forEach((c, i) => {
            const left = yearToPercent(c.birth);
            const right = yearToPercent(c.death);
            const bar = document.createElement('div');
            bar.className = `composer-lifespan ${c.period}`;
            bar.style.left = left + '%';
            bar.style.width = Math.max(right - left, 4) + '%';
            bar.style.top = (i * 52) + 'px';
            bar.textContent = `${c.name} (${c.birth}–${c.death})`;
            bar.setAttribute('role', 'button');
            bar.setAttribute('tabindex', '0');
            bar.dataset.composer = c.id;
            bar.addEventListener('click', () => showDetails(c.id));
            bar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetails(c.id); }
            });
            track.appendChild(bar);
        });
        track.style.minHeight = (visible.length * 52 + 40) + 'px';
    }

    if (showEvents && eventsTrack) {
        EVENTS.forEach(ev => {
            const dot = document.createElement('div');
            dot.className = 'timeline-event';
            dot.style.left = yearToPercent(ev.year) + '%';
            dot.innerHTML = `<span class="event-label">${ev.year}: ${ev.label}</span>`;
            eventsTrack.appendChild(dot);
        });
    }
}

function showDetails(composerId) {
    const c = COMPOSERS.find(x => x.id === composerId);
    const panel = document.getElementById('details-panel');
    const content = document.getElementById('details-content');
    if (!c || !panel || !content) return;

    content.innerHTML = `
        <h3 class="detail-composer-name">${c.name}</h3>
        <p class="detail-years">${c.birth} – ${c.death}</p>
        <div class="detail-section">
            <h4>Contribution</h4>
            <p>${c.contribution}</p>
        </div>
        <div class="detail-section">
            <h4>Notable Works</h4>
            <ul>${c.works.map(w => `<li>${w}</li>`).join('')}</ul>
        </div>
        ${c.link ? `<div class="detail-section"><a class="btn-explore" href="${c.link}">Explore Catalogue</a></div>` : ''}
    `;
    panel.classList.add('active');
}

function closeDetailsPanel() {
    const panel = document.getElementById('details-panel');
    if (panel) panel.classList.remove('active');
}

function showComposerOnTimeline(composerId) {
    // Ensure the composer is visible under the current period filter
    const c = COMPOSERS.find(x => x.id === composerId);
    if (c && currentPeriod !== 'all' && c.filter !== currentPeriod) {
        currentPeriod = 'all';
        const periodFilter = document.getElementById('period-filter');
        if (periodFilter) periodFilter.value = 'all';
        renderTimeline();
    }
    const bar = document.querySelector(`.composer-lifespan[data-composer="${composerId}"]`);
    if (bar) {
        bar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bar.style.outline = '3px solid var(--accent-color)';
        setTimeout(() => { bar.style.outline = ''; }, 1500);
    }
    showDetails(composerId);
}

function changeViewMode(value) {
    currentView = value;
    renderTimeline();
}

function filterByPeriod(value) {
    currentPeriod = value;
    renderTimeline();
}

function applyZoom() {
    const container = document.getElementById('timeline-container');
    const label = document.getElementById('zoom-level');
    if (container) container.style.width = zoom + '%';
    if (label) label.textContent = zoom + '%';
}

function zoomIn() {
    zoom = Math.min(zoom + 25, 300);
    applyZoom();
}

function zoomOut() {
    zoom = Math.max(zoom - 25, 50);
    applyZoom();
}

function resetTimeline() {
    zoom = 100;
    currentPeriod = 'all';
    currentView = 'lifespans';
    const viewMode = document.getElementById('view-mode');
    const periodFilter = document.getElementById('period-filter');
    if (viewMode) viewMode.value = 'lifespans';
    if (periodFilter) periodFilter.value = 'all';
    applyZoom();
    renderTimeline();
    closeDetailsPanel();
}

document.addEventListener('DOMContentLoaded', () => {
    renderTimeline();
    applyZoom();
});

// Expose handlers used by inline onclick attributes
window.changeViewMode = changeViewMode;
window.filterByPeriod = filterByPeriod;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetTimeline = resetTimeline;
window.closeDetailsPanel = closeDetailsPanel;
window.showComposerOnTimeline = showComposerOnTimeline;
