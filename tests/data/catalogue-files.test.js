/**
 * Catalogue Data File Tests
 * Validates the real catalogue JSON files shipped in database/data,
 * including the Mozart Köchel catalogue, for structural integrity.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'database', 'data');

const CATALOGUES = [
  { file: 'bach-bwv-catalogue.json', id: 'bach', prefix: 'BWV' },
  { file: 'handel-hwv-catalogue.json', id: 'handel', prefix: 'HWV' },
  { file: 'vivaldi-rv-catalogue.json', id: 'vivaldi', prefix: 'RV' },
  { file: 'mozart-kv-catalogue.json', id: 'mozart', prefix: 'K' }
];

function load(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

describe('Catalogue data files', () => {
  describe.each(CATALOGUES)('$file', ({ file, id }) => {
    const data = load(file);

    test('is valid JSON with the core sections', () => {
      expect(data.composer).toBeDefined();
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.works)).toBe(true);
      expect(data.works.length).toBeGreaterThan(0);
    });

    test('has a correctly identified composer', () => {
      expect(data.composer.id).toBe(id);
      expect(data.composer.fullName.length).toBeGreaterThan(0);
      expect(data.composer.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data.composer.deathDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const birth = parseInt(data.composer.birthDate.split('-')[0], 10);
      const death = parseInt(data.composer.deathDate.split('-')[0], 10);
      expect(birth).toBeLessThan(death);
    });

    test('every work has a catalogue number, title and category', () => {
      data.works.forEach(w => {
        const catNum = w.bwv || w.rv || w.hwv || w.kv || w.catalogNumber;
        expect(catNum).toBeTruthy();
        expect(w.title && w.title.length).toBeGreaterThan(0);
        expect(w.category && w.category.length).toBeGreaterThan(0);
      });
    });

    test('has no duplicate catalogue numbers', () => {
      const nums = data.works.map(w => w.bwv || w.rv || w.hwv || w.kv || w.catalogNumber);
      expect(new Set(nums).size).toBe(nums.length);
    });

    test('work composition years fall within the composer lifetime (+margin)', () => {
      const birth = parseInt(data.composer.birthDate.split('-')[0], 10);
      const death = parseInt(data.composer.deathDate.split('-')[0], 10);
      data.works.forEach(w => {
        if (w.yearComposed != null) {
          expect(w.yearComposed).toBeGreaterThanOrEqual(birth);
          expect(w.yearComposed).toBeLessThanOrEqual(death + 1);
        }
      });
    });

    test('every work category exists in the categories map', () => {
      const categoryKeys = Object.keys(data.categories);
      data.works.forEach(w => {
        expect(categoryKeys).toContain(w.category);
      });
    });
  });

  test('Mozart catalogue includes the signature masterworks', () => {
    const mozart = load('mozart-kv-catalogue.json');
    const numbers = mozart.works.map(w => w.kv);
    ['K. 626', 'K. 550', 'K. 620', 'K. 492', 'K. 525'].forEach(kv => {
      expect(numbers).toContain(kv);
    });
    expect(mozart.composer.totalWorks).toBe(626);
  });
});
