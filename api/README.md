# Early Composers Catalogue API

RESTful API for accessing the Early Composers Musical Catalogue database.

## Getting Started

### Installation

```bash
cd api
npm install
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication
Currently, no authentication is required. Future versions will implement API keys.

---

## Composers

### List All Composers
```http
GET /api/composers
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "bach",
      "fullName": "Johann Sebastian Bach",
      "birthDate": "1685-03-31",
      "deathDate": "1750-07-28",
      "nationality": "German",
      "period": "Baroque",
      "totalWorks": 50,
      "catalogSystem": "BWV"
    }
  ]
}
```

### Get Composer Details
```http
GET /api/composers/:id
```

**Parameters:**
- `id` (string) - Composer ID (e.g., "bach", "mozart")

**Example:**
```http
GET /api/composers/bach
```

---

## Works

### List All Works
```http
GET /api/works?composer=bach&genre=keyboard&page=1&limit=50
```

**Query Parameters:**
- `composer` (string, optional) - Filter by composer
- `genre` (string, optional) - Filter by genre/category
- `year` (number, optional) - Filter by composition year
- `key` (string, optional) - Filter by key signature
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Results per page
- `sort` (string, default: "catalog") - Sort by: catalog, year, title

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 50,
  "page": 1,
  "totalPages": 4,
  "data": [
    {
      "bwv": "BWV 988",
      "title": "Goldberg Variations",
      "category": "keyboard",
      "yearComposed": 1741,
      "key": "G major",
      "duration": 80
    }
  ]
}
```

### Get Work Details
```http
GET /api/works/:id
```

**Parameters:**
- `id` (string) - Work ID (e.g., "BWV 988")

**Example:**
```http
GET /api/works/BWV%20988
```

### Search Works
```http
GET /api/works/search?q=goldberg&limit=20
```

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (number, default: 20) - Maximum results

---

## Recordings

### List All Recordings
```http
GET /api/recordings?work=BWV%20988&page=1&limit=20
```

**Query Parameters:**
- `work` (string, optional) - Filter by work ID
- `performer` (string, optional) - Filter by performer name
- `year` (number, optional) - Filter by recording year
- `platform` (string, optional) - Filter by streaming platform
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Results per page

**Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "totalPages": 1,
  "data": [
    {
      "id": "rec_002",
      "workId": "BWV 988",
      "workTitle": "Goldberg Variations",
      "performers": {
        "soloist": "Glenn Gould"
      },
      "recordingInfo": {
        "year": 1955,
        "label": "Columbia Masterworks"
      },
      "streamingLinks": [...]
    }
  ]
}
```

### Get Recording Details
```http
GET /api/recordings/:id
```

**Parameters:**
- `id` (string) - Recording ID (e.g., "rec_001")

---

## Search

### Global Search
```http
GET /api/search?q=brandenburg&limit=50
```

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (number, default: 50) - Maximum total results

**Response:**
```json
{
  "success": true,
  "query": "brandenburg",
  "totalResults": 7,
  "data": {
    "works": [...],
    "recordings": [...],
    "composers": [...]
  }
}
```

### Advanced Search
```http
POST /api/search/advanced
Content-Type: application/json

{
  "composer": "Bach",
  "genre": "keyboard",
  "yearFrom": 1720,
  "yearTo": 1750,
  "key": "G major",
  "instrumentation": "harpsichord"
}
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "criteria": {...},
  "data": [...]
}
```

---

## Statistics

### Get Catalogue Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "composers": 1,
    "works": 50,
    "recordings": 10,
    "categories": 9,
    "streamingPlatforms": 6,
    "averageRating": "4.82",
    "worksByCategory": {
      "keyboard": 15,
      "cantatas": 7,
      "orchestral": 12
    },
    "recordingsByDecade": {
      "1930": 1,
      "1950": 2,
      "1980": 3
    }
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit` - Request limit
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Time when limit resets

---

## Examples

### JavaScript (Fetch API)
```javascript
// Get all Bach keyboard works
fetch('http://localhost:3000/api/works?composer=bach&genre=keyboard')
  .then(res => res.json())
  .then(data => console.log(data));

// Search for recordings
fetch('http://localhost:3000/api/recordings?performer=Gould')
  .then(res => res.json())
  .then(data => console.log(data));

// Advanced search
fetch('http://localhost:3000/api/search/advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    genre: 'keyboard',
    yearFrom: 1700,
    yearTo: 1750
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### cURL
```bash
# Get composers
curl http://localhost:3000/api/composers

# Search works
curl "http://localhost:3000/api/works/search?q=goldberg"

# Get statistics
curl http://localhost:3000/api/stats

# Advanced search
curl -X POST http://localhost:3000/api/search/advanced \
  -H "Content-Type: application/json" \
  -d '{"genre":"keyboard","yearFrom":1720,"yearTo":1750}'
```

---

## Data Caching

The API implements automatic data caching:
- **Cache Duration:** 5 minutes
- **Automatic Refresh:** Cache refreshes automatically when expired
- **Manual Refresh:** Restart the server to force refresh

---

## Future Features

### Planned for Version 2.0
- [ ] API key authentication
- [ ] User-specific endpoints (favorites, playlists)
- [ ] GraphQL endpoint
- [ ] WebSocket support for real-time updates
- [ ] Advanced analytics endpoints
- [ ] Export functionality (CSV, PDF)
- [ ] Batch operations
- [ ] Webhook support

### Planned for Version 3.0
- [ ] PostgreSQL database integration
- [ ] Full-text search with Elasticsearch
- [ ] Audio preview integration
- [ ] User comments and ratings
- [ ] Machine learning recommendations
- [ ] Multi-language support

---

## Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### API Documentation
Full interactive documentation available at:
```
http://localhost:3000/api
```

---

## Support

For issues, questions, or contributions:
- GitHub Issues: [Link to repository]
- Email: support@example.com
- Documentation: [Link to full docs]

---

## License

MIT License - See LICENSE file for details

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Core endpoints for composers, works, recordings
- Search functionality
- Statistics endpoints
- In-memory caching
- CORS support
- Basic error handling