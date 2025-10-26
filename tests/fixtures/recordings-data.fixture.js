/**
 * Test Fixtures - Recordings Data
 * Mock data for testing recordings database functionality
 */

module.exports = {
  // Complete recordings fixture
  recordingsComplete: {
    recordings: [
      {
        id: 'rec_001',
        workId: 'BWV 232',
        composer: 'Bach',
        workTitle: 'Mass in B minor',
        performers: {
          conductor: 'John Eliot Gardiner',
          ensemble: 'Monteverdi Choir & English Baroque Soloists',
          soloists: [
            'Nancy Argenta',
            'Mary Nichols',
            'Ashley Stafford',
            'Michael Chance',
            'Wynford Evans',
            'Howard Milner'
          ]
        },
        recordingInfo: {
          year: 1985,
          venue: 'St. John\'s Smith Square, London',
          label: 'Archiv Produktion',
          catalogNumber: '415 514-2',
          format: ['CD', 'Digital'],
          duration: 108,
          recordingType: 'Studio'
        },
        audioQuality: {
          format: 'DDD',
          bitrate: '16-bit/44.1kHz',
          remastered: false
        },
        streamingLinks: [
          {
            platform: 'Spotify',
            url: 'https://open.spotify.com/album/4FGjZjBRfT7aKyL5QzYM1N',
            availability: 'worldwide',
            subscription: true
          },
          {
            platform: 'Apple Music',
            url: 'https://music.apple.com/album/id1443145282',
            availability: 'worldwide',
            subscription: true
          },
          {
            platform: 'YouTube',
            url: 'https://www.youtube.com/playlist?list=PLxHbdI9',
            availability: 'worldwide',
            subscription: false
          }
        ],
        criticalReception: {
          rating: 4.8,
          reviews: [
            {
              source: 'Gramophone',
              rating: '5/5',
              excerpt: 'A landmark recording that sets new standards for Bach performance.'
            },
            {
              source: 'BBC Music Magazine',
              rating: '5/5',
              excerpt: 'Gardiner\'s interpretation is both scholarly and deeply moving.'
            }
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
          ensemble: 'Berlin Philharmonic Orchestra',
          soloists: [
            'Anna Tomowa-Sintow',
            'Agnes Baltsa',
            'Werner Krenn',
            'José van Dam'
          ]
        },
        recordingInfo: {
          year: 1975,
          venue: 'Jesus-Christus-Kirche, Berlin',
          label: 'Deutsche Grammophon',
          catalogNumber: '419 610-2',
          format: ['CD', 'Digital'],
          duration: 56,
          recordingType: 'Studio'
        },
        audioQuality: {
          format: 'ADD',
          bitrate: '16-bit/44.1kHz',
          remastered: true,
          remasterYear: 2001
        },
        streamingLinks: [
          {
            platform: 'Spotify',
            url: 'https://open.spotify.com/album/xyz',
            availability: 'worldwide',
            subscription: true
          }
        ],
        criticalReception: {
          rating: 4.5,
          reviews: [
            {
              source: 'Gramophone',
              rating: '4.5/5',
              excerpt: 'A powerful and dramatic interpretation.'
            }
          ]
        },
        historicalSignificance: 'One of Karajan\'s most celebrated Mozart recordings'
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
          venue: 'St Jude-on-the-Hill, London',
          label: 'Avie Records',
          catalogNumber: 'AV2423',
          format: ['Digital', 'CD', 'SACD'],
          duration: 22,
          recordingType: 'Studio'
        },
        audioQuality: {
          format: 'DDD',
          bitrate: '24-bit/96kHz',
          remastered: false
        },
        streamingLinks: [
          {
            platform: 'Spotify',
            url: 'https://open.spotify.com/album/789',
            availability: 'worldwide',
            subscription: true
          },
          {
            platform: 'Apple Music',
            url: 'https://music.apple.com/album/id123',
            availability: 'worldwide',
            subscription: true
          },
          {
            platform: 'Tidal',
            url: 'https://tidal.com/album/456',
            availability: 'worldwide',
            subscription: true
          }
        ],
        criticalReception: {
          rating: 4.6,
          reviews: [
            {
              source: 'The Guardian',
              rating: '5/5',
              excerpt: 'A fresh and vibrant period instrument performance.'
            }
          ]
        },
        historicalSignificance: 'Modern period instrument performance'
      }
    ]
  },

  // Minimal recording
  minimalRecording: {
    id: 'rec_min',
    workId: 'BWV 1',
    composer: 'Bach',
    workTitle: 'Cantata BWV 1',
    performers: {},
    recordingInfo: {
      year: 2000,
      label: 'Test Label',
      duration: 30,
      format: ['CD']
    },
    audioQuality: {
      format: 'DDD'
    },
    streamingLinks: []
  },

  // Generate large dataset for performance testing
  generateLargeRecordingsDataset: (count = 500) => {
    return {
      recordings: Array(count).fill(null).map((_, i) => ({
        id: `rec_${String(i + 1).padStart(3, '0')}`,
        workId: `BWV ${(i % 200) + 1}`,
        composer: i % 2 === 0 ? 'Bach' : 'Mozart',
        workTitle: `Test Work ${i + 1}`,
        performers: {
          conductor: `Conductor ${i + 1}`,
          ensemble: `Orchestra ${i + 1}`
        },
        recordingInfo: {
          year: 1950 + (i % 70),
          label: `Label ${(i % 10) + 1}`,
          duration: 20 + (i % 80),
          format: ['CD', 'Digital']
        },
        audioQuality: {
          format: i % 2 === 0 ? 'DDD' : 'ADD',
          remastered: i % 3 === 0
        },
        streamingLinks: [
          {
            platform: 'Spotify',
            url: `https://spotify.com/album/${i}`,
            subscription: true
          }
        ],
        criticalReception: {
          rating: 3.0 + (i % 20) / 10
        }
      }))
    };
  },

  // Historical recording (pre-1980)
  historicalRecording: {
    id: 'rec_hist',
    workId: 'K. 550',
    composer: 'Mozart',
    workTitle: 'Symphony No. 40',
    performers: {
      conductor: 'Karl Böhm',
      ensemble: 'Vienna Philharmonic Orchestra'
    },
    recordingInfo: {
      year: 1963,
      venue: 'Musikverein, Vienna',
      label: 'Deutsche Grammophon',
      duration: 28,
      format: ['LP', 'CD'],
      recordingType: 'Studio'
    },
    audioQuality: {
      format: 'ADD',
      remastered: true,
      remasterYear: 1997
    },
    streamingLinks: [
      {
        platform: 'Spotify',
        url: 'https://spotify.com/album/historic',
        subscription: true
      }
    ],
    criticalReception: {
      rating: 4.9
    },
    historicalSignificance: 'Classic interpretation from the golden age of recording'
  },

  // Invalid recordings for validation testing
  invalidRecordings: {
    invalidYear: {
      id: 'invalid_1',
      workId: 'BWV 1',
      composer: 'Bach',
      workTitle: 'Test',
      performers: {},
      recordingInfo: {
        year: 1850, // Too early
        label: 'Test',
        duration: 30,
        format: ['CD']
      },
      audioQuality: {
        format: 'DDD'
      },
      streamingLinks: []
    },

    invalidRating: {
      id: 'invalid_2',
      workId: 'BWV 1',
      composer: 'Bach',
      workTitle: 'Test',
      performers: {},
      recordingInfo: {
        year: 2000,
        label: 'Test',
        duration: 30,
        format: ['CD']
      },
      audioQuality: {
        format: 'DDD'
      },
      streamingLinks: [],
      criticalReception: {
        rating: 6.5 // Exceeds maximum of 5
      }
    }
  }
};
