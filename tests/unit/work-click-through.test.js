/**
 * Work click-through (spec: docs/superpowers/specs/2026-08-08-work-click-through-design.md)
 *
 * Unlike the legacy suites, these tests load the REAL shipped modules
 * (assets/js/composer-common.js, assets/js/search.js) via their CommonJS
 * export guard, so they exercise the code the browser runs.
 */

const path = require('path');

const COMPOSER_COMMON = path.join(__dirname, '../../assets/js/composer-common.js');
const SEARCH = path.join(__dirname, '../../assets/js/search.js');

/** Small Mozart-shaped catalogue fixture. */
const mozartCatalogue = {
  composer: { id: 'mozart', fullName: 'Wolfgang Amadeus Mozart' },
  works: [
    {
      kv: 'K. 525',
      title: 'Eine kleine Nachtmusik (Serenade No. 13)',
      category: 'serenades',
      yearComposed: 1787,
      key: 'G major',
      movements: 4,
      duration: 18,
      instrumentation: 'String ensemble (2 violins, viola, cello, double bass)',
      description: "Perhaps Mozart's most recognisable work."
    },
    { kv: 'K. 551', title: 'Symphony No. 41 (Jupiter)', category: 'symphonies', movements: 4 }
  ]
};

/** Vivaldi-shaped work carrying a movements_detail list. */
const vivaldiCatalogue = {
  composer: { id: 'vivaldi', fullName: 'Antonio Vivaldi' },
  works: [
    {
      rv: 'RV 269',
      title: 'Spring (La primavera)',
      category: 'concertos',
      movements: 3,
      movements_detail: [
        'Allegro - Springtime arrives with bird songs',
        'Largo e pianissimo sempre - The goatherd sleeps',
        'Allegro pastorale - Nymphs and shepherds dance'
      ]
    }
  ]
};

function loadComposerCommon() {
  jest.resetModules();
  return require(COMPOSER_COMMON);
}

function loadSearch() {
  jest.resetModules();
  return require(SEARCH);
}

describe('slugifyCatalogNumber', () => {
  let mod;
  beforeEach(() => { mod = loadComposerCommon(); });

  test.each([
    ['K. 525', 'k-525'],
    ['BWV 1046', 'bwv-1046'],
    ['HWV 56', 'hwv-56'],
    ['RV 269', 'rv-269'],
    ['K. 626', 'k-626']
  ])('slugifies %s to %s', (input, expected) => {
    expect(mod.slugifyCatalogNumber(input)).toBe(expected);
  });

  test('returns empty string for blank input', () => {
    expect(mod.slugifyCatalogNumber('')).toBe('');
    expect(mod.slugifyCatalogNumber('   ')).toBe('');
  });
});

describe('buildWorkIndex', () => {
  test('maps slugs to works using the given catalog key', () => {
    const mod = loadComposerCommon();
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    expect(index.get('k-525').title).toBe('Eine kleine Nachtmusik (Serenade No. 13)');
    expect(index.get('k-551').title).toBe('Symphony No. 41 (Jupiter)');
    expect(index.size).toBe(2);
  });

  test('skips works whose catalog field is missing', () => {
    const mod = loadComposerCommon();
    const index = mod.buildWorkIndex([{ title: 'No number' }], 'kv');
    expect(index.size).toBe(0);
  });
});

describe('enhanceWorkReferences', () => {
  let mod;

  beforeEach(() => {
    document.body.innerHTML = `
      <table class="works-table">
        <tbody>
          <tr><td>K. 525</td><td>Eine kleine Nachtmusik</td></tr>
          <tr><td>K. 626</td><td>Requiem (not in fixture)</td></tr>
          <tr><td>BWV 846–869</td><td>Range row, never matches</td></tr>
        </tbody>
      </table>`;
    mod = loadComposerCommon();
  });

  test('matched row gets the slug id and work-link class', () => {
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    mod.enhanceWorkReferences(index, 'kv');

    const row = document.getElementById('k-525');
    expect(row).not.toBeNull();
    expect(row.classList.contains('work-link')).toBe(true);
  });

  test('unmatched rows are left untouched', () => {
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    mod.enhanceWorkReferences(index, 'kv');

    const rows = document.querySelectorAll('tr');
    expect(rows[1].id).toBe('');
    expect(rows[1].classList.contains('work-link')).toBe(false);
    expect(rows[2].id).toBe('');
  });

  test('duplicate catalogue rows only assign the id once', () => {
    document.querySelector('tbody').insertAdjacentHTML(
      'beforeend', '<tr><td>K. 525</td><td>Listed twice</td></tr>');
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    mod.enhanceWorkReferences(index, 'kv');

    expect(document.querySelectorAll('[id="k-525"]').length).toBe(1);
  });

  test('clicking a matched row opens the modal with the work title', () => {
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    mod.enhanceWorkReferences(index, 'kv');

    document.getElementById('k-525').click();

    const modal = document.getElementById('work-modal');
    expect(modal).not.toBeNull();
    expect(modal.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('modal-title').textContent)
      .toContain('Eine kleine Nachtmusik');
  });
});

describe('enhanceWorkReferences — headings', () => {
  let mod;
  const bachWorks = [
    { bwv: 'BWV 4', title: 'Christ lag in Todes Banden', category: 'cantatas' },
    { bwv: 'BWV 1046', title: 'Brandenburg Concerto No. 1', category: 'orchestral' },
    { bwv: 'BWV 988', title: 'Goldberg Variations', category: 'keyboard' }
  ];

  beforeEach(() => { mod = loadComposerCommon(); });

  test('heading with a trailing catalogue number becomes clickable', () => {
    document.body.innerHTML = `
      <section class="content-section">
        <h3>Spring (La Primavera) - RV 269</h3>
      </section>`;
    const index = mod.buildWorkIndex(vivaldiCatalogue.works, 'rv');
    mod.enhanceWorkReferences(index, 'rv');

    const heading = document.getElementById('rv-269');
    expect(heading).not.toBeNull();
    expect(heading.classList.contains('work-link')).toBe(true);

    heading.click();
    expect(document.getElementById('modal-title').textContent).toContain('Spring');
  });

  test('heading with a leading catalogue number becomes clickable', () => {
    document.body.innerHTML = `
      <section class="content-section">
        <h3>BWV 4: Christ lag in Todes Banden</h3>
      </section>`;
    const index = mod.buildWorkIndex(bachWorks, 'bwv');
    mod.enhanceWorkReferences(index, 'bwv');

    expect(document.getElementById('bwv-4')).not.toBeNull();
  });

  test('a catalogue RANGE heading is not linked to its first work', () => {
    document.body.innerHTML = `
      <section class="content-section">
        <h3>Brandenburg Concertos (BWV 1046-1051)</h3>
      </section>`;
    const index = mod.buildWorkIndex(bachWorks, 'bwv');
    mod.enhanceWorkReferences(index, 'bwv');

    expect(document.getElementById('bwv-1046')).toBeNull();
    expect(document.querySelectorAll('.work-link').length).toBe(0);
  });

  test('heading without a catalogue number is untouched', () => {
    document.body.innerHTML = `
      <section class="content-section"><h3>About The Four Seasons</h3></section>`;
    const index = mod.buildWorkIndex(vivaldiCatalogue.works, 'rv');
    mod.enhanceWorkReferences(index, 'rv');

    expect(document.querySelectorAll('.work-link').length).toBe(0);
  });

  test('a near-miss number does not match (BWV 4 vs BWV 40)', () => {
    document.body.innerHTML = `
      <section class="content-section"><h3>Cantata BWV 40</h3></section>`;
    const index = mod.buildWorkIndex(bachWorks, 'bwv');
    mod.enhanceWorkReferences(index, 'bwv');

    expect(document.querySelectorAll('.work-link').length).toBe(0);
  });

  test('when a work appears as both heading and row, only one gets the id', () => {
    document.body.innerHTML = `
      <section class="content-section">
        <h3>Goldberg Variations (BWV 988)</h3>
        <table class="works-table">
          <tbody><tr><td>BWV 988</td><td>Goldberg Variations</td></tr></tbody>
        </table>
      </section>`;
    const index = mod.buildWorkIndex(bachWorks, 'bwv');
    mod.enhanceWorkReferences(index, 'bwv');

    expect(document.querySelectorAll('[id="bwv-988"]').length).toBe(1);
    // Document order wins: the heading comes first.
    expect(document.getElementById('bwv-988').tagName).toBe('H3');
  });
});

describe('work detail modal content', () => {
  let mod;
  beforeEach(() => {
    document.body.innerHTML = '';
    mod = loadComposerCommon();
  });

  test('shows catalogue number, key facts and description', () => {
    mod.openWorkModal(mozartCatalogue.works[0], 'kv');

    const details = document.getElementById('modal-details').textContent;
    expect(details).toContain('K. 525');
    expect(details).toContain('G major');
    expect(details).toContain('1787');
    expect(details).toContain('String ensemble');
    expect(details).toContain('most recognisable');
  });

  test('renders a movements list when movements_detail is present', () => {
    mod.openWorkModal(vivaldiCatalogue.works[0], 'rv');

    const items = document.querySelectorAll('#modal-details .movement-list li');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Springtime');
  });

  test('links to a recordings search for the work, not an alert()', () => {
    mod.openWorkModal(mozartCatalogue.works[0], 'kv');

    const link = document.querySelector('#modal-details a.find-recordings');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href'))
      .toBe('../../search.html?q=' + encodeURIComponent('K. 525'));
    expect(document.getElementById('modal-details').innerHTML).not.toContain('alert(');
  });
});

describe('openWorkFromHash', () => {
  let mod;

  beforeEach(() => {
    document.body.innerHTML = `
      <table class="works-table">
        <tbody><tr><td>K. 525</td><td>Eine kleine Nachtmusik</td></tr></tbody>
      </table>`;
    window.location.hash = '';
    mod = loadComposerCommon();
  });

  test('opens the modal for a hash that matches a work', () => {
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    mod.enhanceWorkReferences(index, 'kv');
    window.location.hash = '#k-525';

    mod.openWorkFromHash(index, 'kv');

    const modal = document.getElementById('work-modal');
    expect(modal).not.toBeNull();
    expect(modal.classList.contains('hidden')).toBe(false);
  });

  test('does nothing for a hash with no matching work', () => {
    const index = mod.buildWorkIndex(mozartCatalogue.works, 'kv');
    window.location.hash = '#k-999';

    mod.openWorkFromHash(index, 'kv');

    const modal = document.getElementById('work-modal');
    expect(modal === null || modal.classList.contains('hidden')).toBe(true);
  });
});

describe('search results link to the piece', () => {
  test('workCard titles link to the work anchor on the composer page', () => {
    const mod = loadSearch();
    const html = mod.workCard({
      catalogNumber: 'K. 525',
      title: 'Eine kleine Nachtmusik (Serenade No. 13)',
      composer: 'Mozart',
      composerId: 'mozart',
      category: 'serenades',
      key: 'G major',
      yearComposed: 1787,
      instrumentation: 'String ensemble'
    });

    expect(html).toContain('href="composers/mozart/index.html#k-525"');
    // The title itself is the link
    expect(html).toMatch(/<a href="composers\/mozart\/index\.html#k-525">[^<]*Eine kleine Nachtmusik/);
    // Secondary link to the catalogue top is retained
    expect(html).toContain('href="composers/mozart/index.html"');
  });

  test('workCard without a catalogue number falls back to the catalogue link only', () => {
    const mod = loadSearch();
    const html = mod.workCard({
      catalogNumber: '',
      title: 'Untitled fragment',
      composer: 'Mozart',
      composerId: 'mozart'
    });

    expect(html).not.toContain('#');
    expect(html).toContain('href="composers/mozart/index.html"');
  });
});
