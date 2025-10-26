/**
 * Test Fixtures - Composer Data
 * Mock data for testing composer pages and functionality
 */

module.exports = {
  // Complete composer data fixture
  bachComplete: {
    composer: {
      id: 'bach',
      fullName: 'Johann Sebastian Bach',
      lastName: 'Bach',
      firstName: 'Johann Sebastian',
      birthDate: '1685-03-31',
      birthPlace: 'Eisenach, Thuringia',
      deathDate: '1750-07-28',
      deathPlace: 'Leipzig, Saxony',
      nationality: 'German',
      period: 'Baroque',
      catalogPrefix: 'BWV',
      totalWorks: 1128,
      biography: 'Johann Sebastian Bach was a German composer and musician of the Baroque period. He is known for instrumental compositions such as the Brandenburg Concertos and the Goldberg Variations, and for vocal music such as the St Matthew Passion and the Mass in B minor.'
    },
    catalogSystem: {
      name: 'Bach-Werke-Verzeichnis',
      abbreviation: 'BWV',
      author: 'Wolfgang Schmieder',
      publicationYear: 1950,
      revisionYear: 1990,
      description: 'The Bach-Werke-Verzeichnis (Bach Works Catalogue) is the numbering system identifying compositions by Johann Sebastian Bach.'
    },
    categories: {
      cantatas: {
        name: 'Cantatas',
        bwvRange: '1-224',
        description: 'Sacred and secular cantatas',
        count: 200
      },
      keyboard: {
        name: 'Keyboard Works',
        bwvRange: '772-994',
        description: 'Works for keyboard instruments',
        count: 250
      },
      orchestral: {
        name: 'Orchestral Works',
        bwvRange: '1046-1071',
        description: 'Concertos and orchestral suites',
        count: 30
      }
    },
    works: [
      {
        bwv: 'BWV 1',
        title: 'Wie schön leuchtet der Morgenstern',
        germanTitle: 'Wie schön leuchtet der Morgenstern',
        category: 'cantatas',
        key: 'F major',
        yearComposed: 1725,
        instrumentation: 'Choir, Orchestra',
        movements: 6,
        duration: 25,
        description: 'Sacred cantata for the Feast of the Annunciation'
      },
      {
        bwv: 'BWV 232',
        title: 'Mass in B minor',
        germanTitle: 'Messe in h-Moll',
        category: 'masses',
        key: 'B minor',
        yearComposed: 1749,
        instrumentation: 'SATB choir, soloists, orchestra',
        movements: 27,
        duration: 108,
        description: 'One of Bach\'s greatest masterworks'
      },
      {
        bwv: 'BWV 1046',
        title: 'Brandenburg Concerto No. 1',
        category: 'orchestral',
        key: 'F major',
        yearComposed: 1721,
        instrumentation: '2 horns, 3 oboes, bassoon, violino piccolo, strings, continuo',
        movements: 4,
        duration: 22
      },
      {
        bwv: 'BWV 988',
        title: 'Goldberg Variations',
        category: 'keyboard',
        key: 'G major',
        yearComposed: 1741,
        instrumentation: 'Harpsichord',
        movements: 30,
        duration: 45,
        description: 'Set of 30 variations for harpsichord'
      }
    ]
  },

  // Minimal composer data
  mozartMinimal: {
    composer: {
      id: 'mozart',
      fullName: 'Wolfgang Amadeus Mozart',
      birthDate: '1756-01-27',
      deathDate: '1791-12-05',
      nationality: 'Austrian',
      period: 'Classical'
    },
    catalogSystem: {
      name: 'Köchel Catalogue',
      abbreviation: 'K'
    },
    categories: {},
    works: []
  },

  // Large dataset for performance testing
  generateLargeDataset: (workCount = 1000) => {
    return {
      composer: {
        id: 'test',
        fullName: 'Test Composer',
        birthDate: '1700-01-01',
        deathDate: '1800-01-01',
        nationality: 'Test',
        period: 'Baroque',
        totalWorks: workCount
      },
      catalogSystem: {
        name: 'Test Catalogue',
        abbreviation: 'TC'
      },
      categories: {
        test: {
          name: 'Test Category',
          bwvRange: '1-1000'
        }
      },
      works: Array(workCount).fill(null).map((_, i) => ({
        bwv: `TC ${i + 1}`,
        title: `Test Work ${i + 1}`,
        category: 'test',
        key: i % 2 === 0 ? 'C major' : 'G minor',
        yearComposed: 1700 + (i % 100),
        instrumentation: 'Orchestra',
        movements: (i % 10) + 1,
        duration: 10 + (i % 50)
      }))
    };
  },

  // Invalid composer data for validation testing
  invalidData: {
    missingRequiredFields: {
      composer: {
        // Missing required fields
        id: 'invalid'
      },
      catalogSystem: {},
      categories: {},
      works: []
    },

    invalidDateFormat: {
      composer: {
        id: 'invalid',
        fullName: 'Invalid Composer',
        birthDate: '1685/03/31', // Wrong format
        deathDate: '1750-07-28',
        nationality: 'Test',
        period: 'Baroque'
      },
      catalogSystem: {
        name: 'Test',
        abbreviation: 'T'
      },
      categories: {},
      works: []
    },

    invalidPeriod: {
      composer: {
        id: 'invalid',
        fullName: 'Invalid Composer',
        birthDate: '1685-03-31',
        deathDate: '1750-07-28',
        nationality: 'Test',
        period: 'Modern' // Invalid enum value
      },
      catalogSystem: {
        name: 'Test',
        abbreviation: 'T'
      },
      categories: {},
      works: []
    }
  }
};
