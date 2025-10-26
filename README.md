# Early Composers Musical Catalogue

A comprehensive digital archive of classical music composers from the Baroque through Early Romantic periods, featuring complete work catalogues, recordings, manuscripts, and scholarly resources.

## Project Status

### Phase 1: Foundation ✅ COMPLETE
- Multi-composer system architecture
- Database schema design
- Unified template structure
- Main landing page
- Bach catalogue preparation

### Phase 2: Core Implementation (In Progress)
- Bach BWV catalogue development
- Recording database integration
- Advanced search functionality

## Project Structure

```
Mozart Musical Catalogue/
├── index.html                 # Main landing page
├── README.md                  # Project documentation
├── assets/                    # Shared assets
│   ├── css/
│   │   ├── main.css          # Main stylesheet
│   │   └── composer.css      # Composer-specific styles
│   ├── js/
│   │   ├── main.js           # Main JavaScript
│   │   └── composer-common.js
│   └── images/               # Composer portraits and images
├── composers/                 # Individual composer sections
│   ├── mozart/
│   │   └── index.html
│   ├── bach/
│   │   └── index.html        # Bach catalogue page
│   ├── handel/
│   ├── vivaldi/
│   └── haydn/
├── database/                  # Database files
│   ├── schemas/
│   │   ├── catalogue_schema.sql    # PostgreSQL schema
│   │   └── database_models.json    # JSON schema
│   └── data/
│       └── bach-bwv-catalogue.json # Bach catalogue data
├── templates/                 # Reusable templates
│   ├── composer-template.html
│   └── components/
├── api/                      # API backend (future)
│   ├── routes/
│   ├── controllers/
│   └── models/
└── resources/                # Educational resources
    ├── bibliography/
    ├── manuscripts/
    └── scores/
```

## Features

### Completed
- **Multi-Composer Architecture**: Scalable system supporting multiple composers
- **Comprehensive Database Schema**: PostgreSQL schema with full relational structure
- **Responsive Design**: Mobile-friendly interface
- **Main Landing Page**: Central hub for all composers
- **Bach Catalogue Structure**: Initial BWV catalogue framework

### In Development
- Complete Bach BWV catalogue data entry
- Recording database with streaming links
- Advanced search and filtering
- Interactive timeline
- Manuscript digitization links

### Planned
- Handel, Vivaldi, Haydn catalogues
- API backend implementation
- User favorites and collections
- Performance comparison tools
- Educational resources and guides

## Database Schema

The project uses a comprehensive relational database structure:

- **Composers**: Biographical information
- **Works**: Complete catalogue with metadata
- **Recordings**: Historical and modern recordings
- **Manuscripts**: Original source locations
- **Streaming Links**: Modern platform integration
- **Performers**: Artist database
- **Movements**: Detailed movement information

## Technology Stack

### Current Implementation
- HTML5/CSS3/JavaScript (Vanilla)
- JSON data storage
- Responsive CSS Grid/Flexbox

### Planned Technologies
- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL
- **Search**: Elasticsearch
- **Frontend Framework**: React or Vue.js (future migration)
- **CDN**: CloudFlare for media delivery

## Composers

### Tier 1 (Priority)
1. **Mozart** - Complete (626 works)
2. **Bach** - In Progress (~1,100 works)
3. **Handel** - Planned (~600 works)
4. **Vivaldi** - Planned (~800 works)
5. **Haydn** - Planned (~750 works)

### Tier 2 (Future)
- Beethoven
- Schubert
- Monteverdi
- Purcell
- D. Scarlatti
- Rameau

## Getting Started

### Prerequisites
- Web server (local or remote)
- Modern web browser
- Git for version control

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd "Mozart Musical Catalogue"
   ```

2. Set up a local web server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server
   ```

3. Open in browser:
   ```
   http://localhost:8000
   ```

### Development Setup

For database setup (when implemented):
```sql
-- Create database
CREATE DATABASE composers_catalogue;

-- Run schema
\i database/schemas/catalogue_schema.sql
```

## Contributing

This is an educational project. Contributions are welcome for:
- Data verification and corrections
- Additional composer catalogues
- Recording information
- Manuscript locations
- Bug fixes and improvements

## Data Sources

- **Catalogues**: Köchel (Mozart), BWV (Bach), HWV (Handel), RV (Vivaldi), Hoboken (Haydn)
- **Scores**: IMSLP (International Music Score Library Project)
- **Manuscripts**: RISM (Répertoire International des Sources Musicales)
- **References**: Grove Music Online, MGG Online

## License

This project is for educational purposes only. All musical works referenced are in the public domain. Modern recording information is used under fair use for educational purposes.

## Roadmap

### Q1 2024
- ✅ Project setup and architecture
- ✅ Mozart catalogue completion
- ✅ Database schema design
- 🔄 Bach catalogue development

### Q2 2024
- Complete Bach BWV catalogue
- Implement recording database
- Add Handel catalogue

### Q3 2024
- Vivaldi and Haydn catalogues
- API backend implementation
- Advanced search features

### Q4 2024
- Tier 2 composers
- Mobile app consideration
- Community features

## Contact

For corrections, suggestions, or contributions, please open an issue in the project repository.

---

*Last Updated: 2024*
*Version: 1.0.0*