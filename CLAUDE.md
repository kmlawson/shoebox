# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**A Shoebox of Norwegian Letters** is a multi-component digital archive system preserving 246+ letters from Norwegian-American family correspondence (1911-1956). The project combines:

- **Omeka 1.3** - Primary digital archive (PHP/MySQL)
- **JibberBook 2.3** - Guestbook/comments system (PHP/XML)
- **Python Analysis Tools** - Named entity recognition and text mining
- **Leaflet Maps** - Geographic visualization of mentioned locations

## Architecture

### Component Structure

```
shoebox/
├── letters/              # Omeka digital archive (main application)
├── gb/                   # JibberBook guestbook
├── explore/              # Python data analysis tools
├── map/                  # Leaflet map visualization
└── [root]               # Static HTML landing pages
```

### Data Flow

1. **Live System**: Omeka ↔ MySQL database (`huginn_shoebox`)
2. **User Engagement**: JibberBook ↔ XML file (`gb/data_layer/xml/comments.xml`)
3. **Analysis Pipeline**: SQL dump → Python scripts → JSON/text files (one-way)
4. **Map Data**: CSV file (`map/locations.csv`) → Leaflet rendering

### Technology Stack

| Component | Tech | Database | Notes |
|-----------|------|----------|-------|
| Omeka | PHP 5.3+, Zend Framework | MySQL | MVC architecture, 6 plugins active |
| JibberBook | PHP 5.3+ | XML file | Akismet spam filtering |
| Analysis Tools | Python 3.x, spaCy | Read-only SQL | Batch processing, NER |
| Maps | Leaflet.js, PHP | CSV file | Migrated from Google Maps v2 |

## Critical Configuration Files

**⚠️ These files are GITIGNORED and contain credentials:**

- `letters/db.ini` - MySQL database credentials
- `gb/inc/config.php` - Admin password, Akismet API key
- `gb/data_layer/xml/comments.xml` - Guestbook data (43.7 MB)
- `*.sql` - Database dumps

**✅ Use these templates instead:**

- `db.ini.example`
- `gb/inc/config.php.example`

## Common Development Tasks

### Setting Up Local Environment

1. **Configure database connection:**
   ```bash
   cp db.ini.example letters/db.ini
   # Edit letters/db.ini with your MySQL credentials
   ```

2. **Configure guestbook:**
   ```bash
   cp gb/inc/config.php.example gb/inc/config.php
   # Edit gb/inc/config.php with admin password and Akismet key
   ```

3. **Set file permissions:**
   ```bash
   chmod 777 letters/archive/{files,fullsize,thumbnails,square_thumbnails}
   chmod 666 gb/data_layer/xml/comments.xml
   chmod 600 letters/db.ini gb/inc/config.php
   ```

4. **Import database:**
   ```bash
   mysql -u username -p database_name < huginn_shoebox.sql
   ```

### Running Analysis Tools

**Extract letters from database:**
```bash
cd explore
python3 extract_simple.py  # Creates letters/*.json (246 files)
```

**Split by language:**
```bash
python3 split_languages.py  # Creates norwegian_letters/ and english_letters/
```

**Named Entity Recognition:**
```bash
cd explore/ner
python3 -m venv venv
source venv/bin/activate
pip install spacy
python -m spacy download en_core_web_sm
python extract_entities.py  # Outputs: people.txt, organizations.txt, etc.
```

**Word frequency analysis:**
```bash
python count_frequencies.py  # Norwegian word/bigram/trigram frequencies
```

### Database Operations

**Character encoding diagnostics:**
```bash
cd charset-test
php diagnose-database.php  # Check database character set status
```

**Test database connection:**
```bash
cd charset-test
php test-simple.php  # Quick connection test
```

## Omeka-Specific Patterns

### Path Configuration

Omeka uses hardcoded path constants defined in `letters/paths.php`:

```php
define('BASE_DIR', dirname(__FILE__));
define('APP_DIR', BASE_DIR . '/application');
define('PLUGIN_DIR', BASE_DIR . '/plugins');
// ... 20+ additional path defines
```

URL paths are calculated dynamically from `$_SERVER['REQUEST_SCRIPT_NAME']`.

### Plugin Architecture

Active plugins (in `letters/plugins/`):

1. **SimplePages** - Static page management with hierarchical structure
2. **ExhibitBuilder** - Curated exhibits with sections and pages
3. **TagBandit** - Batch tagging interface for items
4. **Coins** - COinS metadata export
5. **SortBrowseResults** - Custom browse result sorting

**Plugin hooks** integrate at specific points in Omeka's execution:

```php
// Example: TagBandit adds batch editor to items browse page
plugin_hook('admin_append_to_items_browse_primary', ...);
```

### Database Schema

**Core tables:**

- `omeka_items` - 248 items (246 letters)
- `omeka_element_texts` - Metadata values (bilingual content)
- `omeka_tags` - Tagging system
- `omeka_files` - Uploaded PDFs (200+)
- `omeka_collections` - Organizational structure

**Key relationships:**
```
items → element_texts → elements
      → files (archive/files/*.pdf)
      → tags (via taggings join table)
      → collections
```

### Apache Configuration

`.htaccess` routing pattern:
```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?$1 [L,QSA]
```

All requests for non-existent files/directories go to `index.php`.

**Exception:** `letters/archive/` allows direct file access for serving PDFs/images.

## JibberBook Guestbook

### Storage Backends

**XML (current):**
- File: `gb/data_layer/xml/comments.xml` (43.7 MB, 75,250+ entries)
- Class: `gb/data_layer/xml/comments.class.php`
- Format: XML with DTD schema

**MySQL (alternative):**
- Class: `gb/data_layer/mysql/comments.class.php`
- Set `JB_STORAGE = 'mysql'` in config.php

Both implement abstract `DataLayer` class with standard methods:
- `addComment($data)`
- `getComments($filter, $limit)`
- `deleteComment($id)`
- `reclassifyComment($id)` (spam/ham toggle)

### Admin Access

URL: `http://yoursite.com/gb/admin`
Password: Defined in `gb/inc/config.php` as `JB_PASSWORD`

### Spam Protection

Akismet integration (requires API key in config.php):
- Checks comments against Akismet service
- Stores spam flag with each comment
- Admin can reclassify spam/ham

## Python Analysis Pipeline

### Data Extraction Workflow

1. **SQL → JSON conversion** (`extract_simple.py`):
   - Parses `huginn_shoebox.sql` INSERT statements
   - Builds element/tag lookups
   - Outputs: `letters/0001.json` through `letters/0248.json`

2. **Language detection** (`split_languages.py`):
   - Detects Norwegian: jeg, det, til, æ, ø, å
   - Detects English: the, and, to, from, dear
   - Outputs: `norwegian_letters/` (244) + `english_letters/` (245)

3. **Named Entity Recognition** (`ner/extract_entities.py`):
   - Uses spaCy en_core_web_sm model
   - Extracts: PERSON, ORG, GPE, LOC, DATE, EVENT, etc.
   - Outputs: `people.txt`, `organizations.txt`, etc.

### Entity Types Extracted

```
PERSON         5,262 unique people
ORG            1,932 organizations
GPE              555 geo-political entities
LOC              186 locations
DATE           1,191 date references
EVENT            164 events
WORK_OF_ART       91 works
FACILITY          49 facilities
LANGUAGE          31 languages
NORP              27 nationalities/religious groups
```

## Map System

### Current Implementation (Leaflet)

**Main map:** `map/index.html` - Shows all locations
**Location-specific:** `map/getloc.php?loc=LocationName` - Focused view

**Data source:** `map/locations.csv`
```csv
Location,Latitude,Longitude,Items
Hegra,63.467,11.017,45
Trondheim,63.4305,10.3951,23
...
```

### Migration from Google Maps

**Old system** (in `map_backup_20251020/`):
- Google Maps API v2 (deprecated)
- KML file generation
- HTTP-only (incompatible with HTTPS)

**New system:**
- Leaflet.js 1.9.4
- OpenStreetMap tiles (no API key required)
- HTTPS-compatible
- Better mobile support

## Character Encoding

### Proper Handling

All Norwegian characters (æ, ø, å) require UTF-8:

**Database:**
```sql
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

**PHP JSON export:**
```python
json.dump(data, f, ensure_ascii=False, indent=2)
```

### Diagnostic Tools

Located in `charset-test/`:

- `diagnose-database.php` - Check database charset configuration
- `test-charset.php` - Test character encoding in queries
- Three `db.ini.*` variants for testing different charset settings

## Testing Infrastructure

### Omeka Tests

**Location:** `letters/application/tests/`

Unit and integration tests for core functionality.

### Plugin Tests

**SimplePages:** `letters/plugins/SimplePages/tests/`
- 5 integration tests
- 1 unit test
- Base test class: `SimplePages_Test_AppTestCase`

**ExhibitBuilder:** `letters/plugins/ExhibitBuilder/tests/`
- 30+ test cases
- Integration tests included
- Base test class: `ExhibitBuilder_ViewTestCase`

**Running tests:**
No automated test runner configured. Individual test files can be run via PHPUnit if installed.

## Security Considerations

### Protected Patterns (.gitignore)

```
db.ini                              # Database credentials
gb/inc/config.php                   # Admin passwords, API keys
*.sql                               # Database dumps
gb/data_layer/xml/comments.xml      # User data (43.7 MB)
letters/archive/files/*.pdf         # Uploaded content
explore/ner/venv/                   # Python environment
backups/, *_backup/, map_backup*/   # Backup directories
```

### File Permissions (Production)

```bash
# Writable by web server:
chmod 777 letters/archive/{files,fullsize,thumbnails,square_thumbnails}
chmod 666 gb/data_layer/xml/comments.xml

# Protected from web access:
chmod 600 letters/db.ini
chmod 600 gb/inc/config.php
```

### .htaccess Protection

```apache
# Deny direct access to .ini and .php files (except index.php)
<FilesMatch "\.(ini|php)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

<Files "index.php">
    Allow from all
</Files>
```

## Development Environment Detection

**Environment variable:** `APPLICATION_ENV`

```php
// In letters/paths.php
define('APPLICATION_ENV', getenv('APPLICATION_ENV') ?: 'production');

if (APPLICATION_ENV == 'production') {
    assert_options(ASSERT_ACTIVE, 0);  // Disable assertions
} else {
    assert_options(ASSERT_ACTIVE, 1);  // Enable debug assertions
}
```

Set via Apache, environment variable, or PHP-FPM config.

## Common File Locations

### Omeka Core Files
- Bootstrap: `letters/index.php`
- Admin: `letters/admin/index.php`
- Path config: `letters/paths.php`
- DB config: `letters/db.ini` (gitignored)
- Application config: `letters/application/config/config.ini`

### Custom Code Locations
- Custom helpers: `letters/application/helpers/`
- Custom controllers: `letters/application/controllers/`
- Custom models: `letters/application/models/`
- Theme templates: `letters/themes/default/`

### Guestbook Files
- Main: `gb/index.php`
- Admin: `gb/admin/index.php`
- Config: `gb/inc/config.php` (gitignored)
- Data: `gb/data_layer/xml/comments.xml` (gitignored)
- Templates: `gb/inc/templates/`

### Analysis Scripts
- Extraction: `explore/extract_simple.py`
- Language split: `explore/split_languages.py`
- NER: `explore/ner/extract_entities.py`
- Frequency: `explore/ner/count_frequencies*.py`

## Deployment Checklist

1. Copy configuration templates:
   - `db.ini.example` → `letters/db.ini`
   - `gb/inc/config.php.example` → `gb/inc/config.php`

2. Configure database connection in `letters/db.ini`

3. Import database: `mysql -u user -p db_name < huginn_shoebox.sql`

4. Set file permissions (see Security Considerations)

5. Configure guestbook:
   - Set admin password in `gb/inc/config.php`
   - Get Akismet API key from akismet.com
   - Update `JB_GUESTBOOK_URL` to your actual URL

6. Create guestbook XML file:
   ```bash
   cp gb/data_layer/xml/comments.xml.example gb/data_layer/xml/comments.xml
   chmod 666 gb/data_layer/xml/comments.xml
   ```

7. Verify Apache mod_rewrite is enabled

8. Test:
   - Browse to main site
   - Access admin at `/letters/admin`
   - Test guestbook at `/gb/`
   - Check map at `/map/`

## Additional Resources

- Omeka Documentation: https://omeka.org/classic/docs/
- JibberBook: http://www.jibberbook.com/
- spaCy NLP: https://spacy.io/
- Leaflet Maps: https://leafletjs.com/

For deployment details, see `SETUP.md`
For security audit, see `SECURITY_AUDIT_SUMMARY.md`
- never commit and push without explicit user permission