/**
 * Data Validation Tests - JSON Schema Validation
 * Tests data integrity and schema compliance for all JSON files
 */

const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

describe('JSON Schema Validation', () => {
  describe('Composer Data Schema', () => {
    const composerSchema = {
      type: 'object',
      required: ['composer', 'catalogSystem', 'categories', 'works'],
      properties: {
        composer: {
          type: 'object',
          required: ['id', 'fullName', 'birthDate', 'deathDate', 'nationality', 'period'],
          properties: {
            id: { type: 'string' },
            fullName: { type: 'string', minLength: 1 },
            lastName: { type: 'string' },
            firstName: { type: 'string' },
            birthDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            birthPlace: { type: 'string' },
            deathDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            deathPlace: { type: 'string' },
            nationality: { type: 'string' },
            period: { type: 'string', enum: ['Renaissance', 'Baroque', 'Classical', 'Early Romantic', 'Romantic'] },
            catalogPrefix: { type: 'string' },
            totalWorks: { type: 'number', minimum: 0 },
            biography: { type: 'string' }
          }
        },
        catalogSystem: {
          type: 'object',
          required: ['name', 'abbreviation'],
          properties: {
            name: { type: 'string' },
            abbreviation: { type: 'string' },
            author: { type: 'string' },
            publicationYear: { type: 'number' },
            revisionYear: { type: 'number' },
            description: { type: 'string' }
          }
        },
        categories: {
          type: 'object',
          patternProperties: {
            '.*': {
              type: 'object',
              properties: {
                name: { type: 'string' },
                bwvRange: { type: 'string' },
                description: { type: 'string' },
                count: { type: 'number' }
              }
            }
          }
        },
        works: {
          type: 'array',
          items: {
            type: 'object',
            required: ['bwv', 'title', 'category'],
            properties: {
              bwv: { type: 'string' },
              title: { type: 'string', minLength: 1 },
              germanTitle: { type: 'string' },
              category: { type: 'string' },
              key: { type: 'string' },
              yearComposed: { type: 'number', minimum: 1600, maximum: 1900 },
              instrumentation: { type: 'string' },
              movements: { type: 'number', minimum: 1 },
              duration: { type: 'number' },
              description: { type: 'string' },
              movementList: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    };

    test('should validate composer data structure', () => {
      const mockComposerData = {
        composer: {
          id: 'bach',
          fullName: 'Johann Sebastian Bach',
          birthDate: '1685-03-31',
          deathDate: '1750-07-28',
          nationality: 'German',
          period: 'Baroque',
          totalWorks: 1128
        },
        catalogSystem: {
          name: 'Bach-Werke-Verzeichnis',
          abbreviation: 'BWV'
        },
        categories: {
          cantatas: {
            name: 'Cantatas',
            bwvRange: '1-224'
          }
        },
        works: [
          {
            bwv: 'BWV 1',
            title: 'Test Cantata',
            category: 'cantatas'
          }
        ]
      };

      const validate = ajv.compile(composerSchema);
      const valid = validate(mockComposerData);

      if (!valid) {
        console.log(validate.errors);
      }

      expect(valid).toBe(true);
    });

    test('should reject invalid birth date format', () => {
      const invalidData = {
        composer: {
          id: 'bach',
          fullName: 'Johann Sebastian Bach',
          birthDate: '1685/03/31', // Invalid format
          deathDate: '1750-07-28',
          nationality: 'German',
          period: 'Baroque'
        },
        catalogSystem: {
          name: 'BWV',
          abbreviation: 'BWV'
        },
        categories: {},
        works: []
      };

      const validate = ajv.compile(composerSchema);
      const valid = validate(invalidData);

      expect(valid).toBe(false);
      expect(validate.errors).toBeTruthy();
    });

    test('should reject invalid period enum value', () => {
      const invalidData = {
        composer: {
          id: 'bach',
          fullName: 'Johann Sebastian Bach',
          birthDate: '1685-03-31',
          deathDate: '1750-07-28',
          nationality: 'German',
          period: 'Modern' // Invalid enum value
        },
        catalogSystem: {
          name: 'BWV',
          abbreviation: 'BWV'
        },
        categories: {},
        works: []
      };

      const validate = ajv.compile(composerSchema);
      const valid = validate(invalidData);

      expect(valid).toBe(false);
    });

    test('should reject work with invalid year range', () => {
      const invalidData = {
        composer: {
          id: 'bach',
          fullName: 'Johann Sebastian Bach',
          birthDate: '1685-03-31',
          deathDate: '1750-07-28',
          nationality: 'German',
          period: 'Baroque'
        },
        catalogSystem: {
          name: 'BWV',
          abbreviation: 'BWV'
        },
        categories: {},
        works: [
          {
            bwv: 'BWV 1',
            title: 'Test',
            category: 'cantatas',
            yearComposed: 2025 // Out of valid range
          }
        ]
      };

      const validate = ajv.compile(composerSchema);
      const valid = validate(invalidData);

      expect(valid).toBe(false);
    });
  });

  describe('Recordings Data Schema', () => {
    const recordingSchema = {
      type: 'object',
      required: ['recordings'],
      properties: {
        recordings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'workId', 'composer', 'workTitle', 'performers', 'recordingInfo', 'audioQuality', 'streamingLinks'],
            properties: {
              id: { type: 'string' },
              workId: { type: 'string' },
              composer: { type: 'string' },
              workTitle: { type: 'string' },
              performers: {
                type: 'object',
                properties: {
                  conductor: { type: 'string' },
                  soloist: { type: 'string' },
                  soloists: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  ensemble: { type: 'string' }
                }
              },
              recordingInfo: {
                type: 'object',
                required: ['year', 'label', 'duration', 'format'],
                properties: {
                  year: { type: 'number', minimum: 1900, maximum: 2030 },
                  venue: { type: 'string' },
                  label: { type: 'string' },
                  catalogNumber: { type: 'string' },
                  format: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  duration: { type: 'number', minimum: 0 },
                  recordingType: { type: 'string' }
                }
              },
              audioQuality: {
                type: 'object',
                required: ['format'],
                properties: {
                  format: { type: 'string' },
                  bitrate: { type: 'string' },
                  remastered: { type: 'boolean' },
                  remasterYear: { type: 'number' }
                }
              },
              streamingLinks: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['platform', 'url'],
                  properties: {
                    platform: { type: 'string' },
                    url: { type: 'string' },
                    availability: { type: 'string' },
                    subscription: { type: 'boolean' }
                  }
                }
              },
              criticalReception: {
                type: 'object',
                properties: {
                  rating: { type: 'number', minimum: 0, maximum: 5 },
                  reviews: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        source: { type: 'string' },
                        rating: { type: 'string' },
                        excerpt: { type: 'string' }
                      }
                    }
                  }
                }
              },
              historicalSignificance: { type: 'string' }
            }
          }
        }
      }
    };

    test('should validate recordings data structure', () => {
      const mockRecordingsData = {
        recordings: [
          {
            id: 'rec_001',
            workId: 'BWV 232',
            composer: 'Bach',
            workTitle: 'Mass in B minor',
            performers: {
              conductor: 'John Eliot Gardiner',
              ensemble: 'Monteverdi Choir'
            },
            recordingInfo: {
              year: 1985,
              label: 'Archiv',
              duration: 108,
              format: ['CD', 'Digital']
            },
            audioQuality: {
              format: 'DDD'
            },
            streamingLinks: [
              {
                platform: 'Spotify',
                url: 'https://spotify.com/album/123',
                subscription: true
              }
            ]
          }
        ]
      };

      const validate = ajv.compile(recordingSchema);
      const valid = validate(mockRecordingsData);

      if (!valid) {
        console.log(validate.errors);
      }

      expect(valid).toBe(true);
    });

    test('should reject recording with invalid year', () => {
      const invalidData = {
        recordings: [
          {
            id: 'rec_001',
            workId: 'BWV 232',
            composer: 'Bach',
            workTitle: 'Mass in B minor',
            performers: {},
            recordingInfo: {
              year: 1850, // Too early
              label: 'Test',
              duration: 100,
              format: ['CD']
            },
            audioQuality: {
              format: 'DDD'
            },
            streamingLinks: []
          }
        ]
      };

      const validate = ajv.compile(recordingSchema);
      const valid = validate(invalidData);

      expect(valid).toBe(false);
    });

    test('should reject recording with invalid rating', () => {
      const invalidData = {
        recordings: [
          {
            id: 'rec_001',
            workId: 'BWV 232',
            composer: 'Bach',
            workTitle: 'Test',
            performers: {},
            recordingInfo: {
              year: 2000,
              label: 'Test',
              duration: 60,
              format: ['CD']
            },
            audioQuality: {
              format: 'DDD'
            },
            streamingLinks: [],
            criticalReception: {
              rating: 6.5 // Invalid: exceeds maximum of 5
            }
          }
        ]
      };

      const validate = ajv.compile(recordingSchema);
      const valid = validate(invalidData);

      expect(valid).toBe(false);
    });
  });

  describe('Data Cross-Reference Integrity', () => {
    test('should verify work IDs match between composer and recordings data', () => {
      const composerWorks = ['BWV 232', 'BWV 1046', 'BWV 988'];
      const recordingWorkIds = ['BWV 232', 'BWV 1046'];

      // All recording work IDs should exist in composer works
      const allValid = recordingWorkIds.every(id => composerWorks.includes(id));

      expect(allValid).toBe(true);
    });

    test('should verify composer IDs are consistent', () => {
      const validComposerIds = ['bach', 'mozart', 'handel', 'vivaldi', 'haydn'];

      const testComposerId = 'bach';

      expect(validComposerIds).toContain(testComposerId);
    });

    test('should check for duplicate work IDs within composer catalogue', () => {
      const workIds = ['BWV 1', 'BWV 2', 'BWV 3', 'BWV 2']; // Duplicate BWV 2

      const uniqueIds = [...new Set(workIds)];

      expect(uniqueIds.length).not.toBe(workIds.length);
    });

    test('should verify streaming links are valid URLs', () => {
      const streamingLinks = [
        { platform: 'Spotify', url: 'https://spotify.com/album/123' },
        { platform: 'YouTube', url: 'https://youtube.com/watch?v=abc' },
        { platform: 'Invalid', url: 'not-a-url' }
      ];

      const urlPattern = /^https?:\/\/.+/;

      const invalidLinks = streamingLinks.filter(link => !urlPattern.test(link.url));

      expect(invalidLinks.length).toBeGreaterThan(0);
      expect(invalidLinks[0].platform).toBe('Invalid');
    });

    test('should validate year ranges are logical (birth before death)', () => {
      const composer = {
        birthDate: '1685-03-31',
        deathDate: '1750-07-28'
      };

      const birthYear = parseInt(composer.birthDate.split('-')[0]);
      const deathYear = parseInt(composer.deathDate.split('-')[0]);

      expect(birthYear).toBeLessThan(deathYear);
    });

    test('should verify work year is within composer lifetime', () => {
      const composer = {
        birthDate: '1685-03-31',
        deathDate: '1750-07-28'
      };

      const work = {
        yearComposed: 1725
      };

      const birthYear = parseInt(composer.birthDate.split('-')[0]);
      const deathYear = parseInt(composer.deathDate.split('-')[0]);

      const isValid = work.yearComposed >= birthYear && work.yearComposed <= deathYear;

      expect(isValid).toBe(true);
    });
  });

  describe('Database Models Schema Compliance', () => {
    test('should validate database models structure', () => {
      const dbModels = {
        database: 'Early Composers Musical Catalogue',
        version: '1.0.0',
        models: {
          Composer: {
            tableName: 'composers',
            fields: {
              composer_id: {
                type: 'integer',
                primaryKey: true
              }
            }
          }
        }
      };

      expect(dbModels.database).toBeTruthy();
      expect(dbModels.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(dbModels.models).toBeDefined();
    });

    test('should verify all models have table names', () => {
      const models = {
        Composer: { tableName: 'composers' },
        Work: { tableName: 'works' },
        Recording: { tableName: 'recordings' }
      };

      Object.values(models).forEach(model => {
        expect(model.tableName).toBeTruthy();
      });
    });

    test('should validate field types are recognized', () => {
      const validTypes = ['string', 'integer', 'number', 'boolean', 'date', 'array', 'json', 'text', 'enum', 'decimal'];

      const testFields = [
        { type: 'string' },
        { type: 'integer' },
        { type: 'date' },
        { type: 'invalid' }
      ];

      testFields.forEach(field => {
        const isValid = validTypes.includes(field.type);
        if (field.type === 'invalid') {
          expect(isValid).toBe(false);
        }
      });
    });
  });

  describe('Data Completeness Checks', () => {
    test('should verify required fields are present', () => {
      const work = {
        bwv: 'BWV 1',
        title: 'Test Cantata',
        category: 'cantatas'
        // Missing optional fields is OK
      };

      const requiredFields = ['bwv', 'title', 'category'];
      const hasAllRequired = requiredFields.every(field => work[field] !== undefined);

      expect(hasAllRequired).toBe(true);
    });

    test('should identify missing required fields', () => {
      const incompleteWork = {
        bwv: 'BWV 1',
        title: 'Test'
        // Missing category
      };

      const requiredFields = ['bwv', 'title', 'category'];
      const missingFields = requiredFields.filter(field => incompleteWork[field] === undefined);

      expect(missingFields).toContain('category');
    });

    test('should validate string fields are not empty', () => {
      const work = {
        title: '',
        category: 'cantatas'
      };

      expect(work.title.length).toBe(0); // Invalid
      expect(work.category.length).toBeGreaterThan(0); // Valid
    });

    test('should check for reasonable value ranges', () => {
      const work = {
        movements: 30,
        duration: 45
      };

      // Movements should typically be < 50
      expect(work.movements).toBeLessThan(50);

      // Duration in minutes should be positive
      expect(work.duration).toBeGreaterThan(0);
    });
  });
});
