-- Early Composers Catalogue Database Schema
-- Version: 1.0
-- Created: 2024
-- Purpose: Comprehensive database structure for multi-composer musical works catalogue

-- =====================================================
-- COMPOSERS TABLE
-- =====================================================
CREATE TABLE composers (
    composer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(100) NOT NULL, -- For alphabetical sorting
    first_name VARCHAR(100),
    birth_date DATE,
    birth_place VARCHAR(200),
    death_date DATE,
    death_place VARCHAR(200),
    nationality VARCHAR(100),
    period VARCHAR(50), -- Baroque, Classical, Early Romantic, etc.
    catalog_prefix VARCHAR(20), -- K for Mozart, BWV for Bach, etc.
    biography TEXT,
    image_url VARCHAR(500),
    signature_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CATALOG_SYSTEMS TABLE
-- =====================================================
CREATE TABLE catalog_systems (
    catalog_id SERIAL PRIMARY KEY,
    composer_id INTEGER REFERENCES composers(composer_id),
    catalog_name VARCHAR(100), -- Köchel, Bach-Werke-Verzeichnis, etc.
    catalog_abbrev VARCHAR(20), -- K, BWV, HWV, RV, etc.
    catalog_author VARCHAR(200),
    publication_year INTEGER,
    revision_year INTEGER,
    notes TEXT
);

-- =====================================================
-- WORKS TABLE
-- =====================================================
CREATE TABLE works (
    work_id SERIAL PRIMARY KEY,
    composer_id INTEGER REFERENCES composers(composer_id),
    catalog_number VARCHAR(50) NOT NULL, -- K.551, BWV 1007, etc.
    catalog_id INTEGER REFERENCES catalog_systems(catalog_id),
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    alternate_titles TEXT[], -- Array of alternate titles
    genre VARCHAR(100), -- Symphony, Concerto, Sonata, Opera, etc.
    sub_genre VARCHAR(100), -- Church cantata, Secular cantata, etc.
    instrumentation TEXT,
    scoring_details JSONB, -- Detailed instrumentation as JSON
    key_signature VARCHAR(20), -- C major, D minor, etc.
    opus_number VARCHAR(20),
    year_composed INTEGER,
    year_composed_approx BOOLEAN DEFAULT false,
    composition_place VARCHAR(200),
    dedication VARCHAR(500),
    commission_details TEXT,
    first_performance_date DATE,
    first_performance_place VARCHAR(200),
    first_performers TEXT,
    duration_minutes INTEGER, -- Approximate duration
    number_of_movements INTEGER,
    text_source TEXT, -- For vocal works
    librettist VARCHAR(200), -- For operas/vocal works
    language VARCHAR(50), -- For vocal works
    liturgical_occasion VARCHAR(200), -- For sacred works
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MOVEMENTS TABLE
-- =====================================================
CREATE TABLE movements (
    movement_id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(work_id),
    movement_number INTEGER NOT NULL,
    movement_title VARCHAR(500),
    tempo_marking VARCHAR(100), -- Allegro, Andante, etc.
    time_signature VARCHAR(20),
    key_signature VARCHAR(20),
    duration_seconds INTEGER,
    notes TEXT
);

-- =====================================================
-- RECORDINGS TABLE
-- =====================================================
CREATE TABLE recordings (
    recording_id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(work_id),
    recording_title VARCHAR(500),
    recording_type VARCHAR(50), -- Studio, Live, Historical, etc.
    conductor VARCHAR(200),
    soloists TEXT[], -- Array of soloists
    ensemble VARCHAR(300),
    choir VARCHAR(300),
    recording_year INTEGER,
    recording_date DATE,
    recording_venue VARCHAR(300),
    label VARCHAR(200),
    catalog_number VARCHAR(100),
    format VARCHAR(50), -- CD, Digital, LP, etc.
    total_duration_seconds INTEGER,
    audio_quality VARCHAR(50), -- Stereo, Mono, Remastered, etc.
    album_title VARCHAR(500),
    album_art_url VARCHAR(500),
    notes TEXT,
    rating DECIMAL(3,2), -- User/critic rating 0.00-5.00
    review_count INTEGER DEFAULT 0,
    is_complete BOOLEAN DEFAULT true, -- Complete recording of the work
    is_historical BOOLEAN DEFAULT false, -- Historical significance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERFORMERS TABLE
-- =====================================================
CREATE TABLE performers (
    performer_id SERIAL PRIMARY KEY,
    performer_name VARCHAR(300) NOT NULL,
    performer_type VARCHAR(50), -- Conductor, Soloist, Ensemble, Choir
    birth_year INTEGER,
    death_year INTEGER,
    nationality VARCHAR(100),
    biography TEXT,
    website_url VARCHAR(500),
    image_url VARCHAR(500)
);

-- =====================================================
-- RECORDING_PERFORMERS (Junction Table)
-- =====================================================
CREATE TABLE recording_performers (
    recording_id INTEGER REFERENCES recordings(recording_id),
    performer_id INTEGER REFERENCES performers(performer_id),
    role VARCHAR(100), -- Conductor, Violin Soloist, Orchestra, etc.
    instrument VARCHAR(100), -- Specific instrument if applicable
    PRIMARY KEY (recording_id, performer_id, role)
);

-- =====================================================
-- MANUSCRIPTS TABLE
-- =====================================================
CREATE TABLE manuscripts (
    manuscript_id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(work_id),
    manuscript_type VARCHAR(50), -- Autograph, Copy, First Edition, etc.
    location_institution VARCHAR(300),
    location_city VARCHAR(200),
    location_country VARCHAR(100),
    catalog_reference VARCHAR(200),
    date_created DATE,
    copyist VARCHAR(200),
    condition_notes TEXT,
    digitization_url VARCHAR(500),
    access_restrictions TEXT,
    notes TEXT
);

-- =====================================================
-- EDITIONS TABLE
-- =====================================================
CREATE TABLE editions (
    edition_id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(work_id),
    edition_name VARCHAR(300),
    publisher VARCHAR(200),
    publication_year INTEGER,
    editor VARCHAR(200),
    edition_type VARCHAR(50), -- Critical, Urtext, Performance, etc.
    isbn VARCHAR(20),
    plate_number VARCHAR(50),
    price DECIMAL(10,2),
    purchase_url VARCHAR(500),
    imslp_url VARCHAR(500),
    notes TEXT
);

-- =====================================================
-- STREAMING_LINKS TABLE
-- =====================================================
CREATE TABLE streaming_links (
    link_id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES recordings(recording_id),
    platform VARCHAR(50), -- Spotify, Apple Music, YouTube, etc.
    platform_url VARCHAR(500),
    platform_id VARCHAR(200), -- Platform-specific ID
    is_free BOOLEAN DEFAULT false,
    region_restricted BOOLEAN DEFAULT false,
    regions_available TEXT[], -- Array of country codes
    last_verified DATE,
    active BOOLEAN DEFAULT true
);

-- =====================================================
-- WORK_RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE work_relationships (
    relationship_id SERIAL PRIMARY KEY,
    work_id_1 INTEGER REFERENCES works(work_id),
    work_id_2 INTEGER REFERENCES works(work_id),
    relationship_type VARCHAR(50), -- Arrangement, Transcription, Based on, etc.
    notes TEXT
);

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    tag_category VARCHAR(50) -- Period, Style, Instrumentation, etc.
);

-- =====================================================
-- WORK_TAGS (Junction Table)
-- =====================================================
CREATE TABLE work_tags (
    work_id INTEGER REFERENCES works(work_id),
    tag_id INTEGER REFERENCES tags(tag_id),
    PRIMARY KEY (work_id, tag_id)
);

-- =====================================================
-- USER_FAVORITES TABLE
-- =====================================================
CREATE TABLE user_favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(200), -- Anonymous identifier or user ID
    work_id INTEGER REFERENCES works(work_id),
    recording_id INTEGER REFERENCES recordings(recording_id),
    favorite_type VARCHAR(50), -- Work, Recording, Composer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SEARCH_INDEX TABLE (For full-text search)
-- =====================================================
CREATE TABLE search_index (
    index_id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(work_id),
    composer_id INTEGER REFERENCES composers(composer_id),
    search_text TEXT, -- Concatenated searchable content
    work_vector tsvector -- PostgreSQL full-text search vector
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_works_composer ON works(composer_id);
CREATE INDEX idx_works_catalog ON works(catalog_number);
CREATE INDEX idx_works_genre ON works(genre);
CREATE INDEX idx_works_year ON works(year_composed);
CREATE INDEX idx_recordings_work ON recordings(work_id);
CREATE INDEX idx_recordings_year ON recordings(recording_year);
CREATE INDEX idx_manuscripts_work ON manuscripts(work_id);
CREATE INDEX idx_movements_work ON movements(work_id);
CREATE INDEX idx_search_vector ON search_index USING GIN(work_vector);
CREATE INDEX idx_composers_period ON composers(period);
CREATE INDEX idx_composers_lastname ON composers(last_name);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Complete work information view
CREATE VIEW work_details AS
SELECT
    w.*,
    c.full_name as composer_name,
    c.catalog_prefix,
    cs.catalog_abbrev,
    COUNT(DISTINCT r.recording_id) as recording_count,
    COUNT(DISTINCT m.manuscript_id) as manuscript_count
FROM works w
JOIN composers c ON w.composer_id = c.composer_id
LEFT JOIN catalog_systems cs ON w.catalog_id = cs.catalog_id
LEFT JOIN recordings r ON w.work_id = r.work_id
LEFT JOIN manuscripts m ON w.work_id = m.work_id
GROUP BY w.work_id, c.composer_id, cs.catalog_id;

-- Recording statistics view
CREATE VIEW recording_stats AS
SELECT
    c.full_name as composer_name,
    w.genre,
    COUNT(DISTINCT r.recording_id) as total_recordings,
    COUNT(DISTINCT CASE WHEN r.recording_year >= 2010 THEN r.recording_id END) as modern_recordings,
    AVG(r.rating) as average_rating
FROM recordings r
JOIN works w ON r.work_id = w.work_id
JOIN composers c ON w.composer_id = c.composer_id
GROUP BY c.composer_id, w.genre;

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
CREATE TRIGGER update_composers_timestamp BEFORE UPDATE ON composers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_works_timestamp BEFORE UPDATE ON works
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- INITIAL DATA INSERTS
-- =====================================================

-- Insert initial composers
INSERT INTO composers (full_name, last_name, first_name, birth_date, death_date, nationality, period, catalog_prefix, biography)
VALUES
    ('Wolfgang Amadeus Mozart', 'Mozart', 'Wolfgang Amadeus', '1756-01-27', '1791-12-05', 'Austrian', 'Classical', 'K', 'Austrian composer of the Classical period.'),
    ('Johann Sebastian Bach', 'Bach', 'Johann Sebastian', '1685-03-31', '1750-07-28', 'German', 'Baroque', 'BWV', 'German composer and musician of the Baroque period.'),
    ('George Frideric Handel', 'Handel', 'George Frideric', '1685-02-23', '1759-04-14', 'German-British', 'Baroque', 'HWV', 'German-British Baroque composer.'),
    ('Antonio Vivaldi', 'Vivaldi', 'Antonio', '1678-03-04', '1741-07-28', 'Italian', 'Baroque', 'RV', 'Italian Baroque composer and violinist.'),
    ('Joseph Haydn', 'Haydn', 'Joseph', '1732-03-31', '1809-05-31', 'Austrian', 'Classical', 'Hob', 'Austrian composer of the Classical period.');

-- Insert catalog systems
INSERT INTO catalog_systems (composer_id, catalog_name, catalog_abbrev, catalog_author, publication_year)
VALUES
    (1, 'Köchel Catalogue', 'K', 'Ludwig von Köchel', 1862),
    (2, 'Bach-Werke-Verzeichnis', 'BWV', 'Wolfgang Schmieder', 1950),
    (3, 'Händel-Werke-Verzeichnis', 'HWV', 'Bernd Baselt', 1978),
    (4, 'Ryom-Verzeichnis', 'RV', 'Peter Ryom', 1974),
    (5, 'Hoboken Catalogue', 'Hob', 'Anthony van Hoboken', 1957);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE composers IS 'Master table containing all composer biographical information';
COMMENT ON TABLE works IS 'Complete catalogue of musical works with detailed metadata';
COMMENT ON TABLE recordings IS 'Historical and modern recordings of works';
COMMENT ON TABLE manuscripts IS 'Original manuscripts and their locations';
COMMENT ON TABLE streaming_links IS 'Modern streaming platform availability';
COMMENT ON COLUMN works.scoring_details IS 'JSON structure containing detailed instrumentation breakdown';
COMMENT ON COLUMN search_index.work_vector IS 'PostgreSQL full-text search vector for efficient searching';