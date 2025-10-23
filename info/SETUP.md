# Setup Instructions
## A Shoebox of Norwegian Letters - Development Environment

This document provides instructions for setting up a local development environment or deploying the Shoebox of Norwegian Letters digital archive.

---

## Prerequisites

- **Web Server:** Apache or Nginx with PHP support
- **PHP:** Version 5.3 or higher (for Omeka compatibility)
- **MySQL:** Version 5.0 or higher
- **Git:** For version control

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url> shoebox
cd shoebox
```

### 2. Configure Database Connection

#### For Omeka (Main Archive)

```bash
# Copy the example configuration
cp db.ini.example letters/db.ini

# Edit with your database credentials
nano letters/db.ini
```

Update the following values in `letters/db.ini`:
```ini
[database]
host     = "localhost"              # Your MySQL server
username = "your_db_username"       # Your MySQL username
password = "your_db_password"       # Your MySQL password
name     = "your_database_name"     # Database name
prefix   = "omeka_"                 # Table prefix
```

#### For Character Set Testing (Optional)

```bash
# Only needed if you're working on character encoding issues
cp db.ini.example charset-test/db.ini
nano charset-test/db.ini
```

### 3. Configure Guestbook

```bash
# Copy the example configuration
cp gb/inc/config.php.example gb/inc/config.php

# Edit with your settings
nano gb/inc/config.php
```

**Important settings to update:**

```php
// Set a strong admin password
define('JB_PASSWORD', 'YOUR_STRONG_PASSWORD_HERE');

// Get a free API key from https://akismet.com/
define('JB_AKISMET_KEY', 'your_akismet_api_key');

// Update to your actual guestbook URL
define('JB_GUESTBOOK_URL', 'http://yoursite.com/path/to/gb/');
```

### 4. Create Guestbook Data File

The guestbook uses XML for storage. Create the initial file:

```bash
# Create the XML file with proper structure
cat > gb/data_layer/xml/comments.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE messages [
<!ELEMENT messages (message)*>
<!ELEMENT message (name , website? , comment , date , user_ip? , user_agent? , spam)>
<!ATTLIST message mID ID #REQUIRED>
<!ELEMENT name (#PCDATA)>
<!ELEMENT website (#PCDATA)>
<!ELEMENT comment (#PCDATA)>
<!ELEMENT date (#PCDATA)>
<!ELEMENT spam (#PCDATA)>
<!ELEMENT user_ip (#PCDATA)>
<!ELEMENT user_agent (#PCDATA)>
]>
<messages>
</messages>
EOF

# Set proper permissions
chmod 666 gb/data_layer/xml/comments.xml
```

### 5. Set File Permissions

Ensure the web server can write to necessary directories:

```bash
# Omeka archive directories
chmod -R 755 letters/archive
chmod -R 777 letters/archive/files
chmod -R 777 letters/archive/fullsize
chmod -R 777 letters/archive/thumbnails
chmod -R 777 letters/archive/square_thumbnails

# Guestbook data
chmod 666 gb/data_layer/xml/comments.xml

# Protect configuration files
chmod 600 letters/db.ini
chmod 600 gb/inc/config.php
```

### 6. Import Database

If you have a database dump:

```bash
mysql -u your_username -p your_database_name < your_database_dump.sql
```

---

## Security Checklist

Before going live, ensure:

- [ ] Database credentials are secure and not default values
- [ ] Guestbook admin password is strong
- [ ] Akismet API key is configured (for spam protection)
- [ ] File permissions are set correctly
- [ ] Configuration files (db.ini, config.php) are NOT web-accessible
- [ ] `.htaccess` files are in place to protect sensitive directories
- [ ] MySQL user has minimum required privileges (not root)

---

## Optional: Python Analysis Tools

If you want to use the named entity recognition and text analysis tools:

```bash
cd explore/ner

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Mac/Linux
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install spacy
python -m spacy download en_core_web_sm

# Run analysis
python extract_entities.py
```

---

## Troubleshooting

### Database Connection Issues

If you see "Could not connect to database" errors:

1. Verify MySQL is running: `mysql -u root -p`
2. Check database exists: `SHOW DATABASES;`
3. Verify user permissions: `SHOW GRANTS FOR 'username'@'localhost';`
4. Check `db.ini` configuration matches your setup

### Guestbook Not Showing Comments

1. Verify `comments.xml` exists and is writable
2. Check file permissions: `ls -l gb/data_layer/xml/comments.xml`
3. Verify XML file structure is valid
4. Check for PHP errors in error logs

### Character Encoding Issues

1. Ensure database charset is UTF-8:
   ```sql
   ALTER DATABASE your_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Use the diagnostic tools in `charset-test/` directory
3. Run `diagnose-database.php` to check current encoding

### File Upload Issues in Omeka

1. Check `letters/archive/files/` is writable (777 permissions)
2. Verify PHP `upload_max_filesize` and `post_max_size` settings
3. Check PHP error logs for specific upload errors

---

## Development Tips

### Local Development Server

For quick local testing:

```bash
# PHP built-in server
cd /path/to/shoebox
php -S localhost:8000
```

Then visit: http://localhost:8000

### Accessing Omeka Admin

URL: `http://yoursite.com/letters/admin`

### Accessing Guestbook Admin

URL: `http://yoursite.com/gb/admin`
Password: As set in `gb/inc/config.php`

---

## Production Deployment

Additional considerations for production:

1. **HTTPS**: Ensure SSL/TLS certificate is configured
2. **Backups**: Set up regular database and file backups
3. **Monitoring**: Configure error logging and monitoring
4. **Updates**: Keep Omeka and dependencies updated
5. **Security**: Regular security audits and updates

---

## File Structure

```
shoebox/
├── letters/              # Omeka installation (main archive)
│   ├── admin/           # Omeka admin interface
│   ├── archive/         # Uploaded files and thumbnails
│   ├── themes/          # Omeka themes
│   └── db.ini          # Database config (NOT in git)
├── gb/                  # JibberBook guestbook
│   ├── inc/
│   │   └── config.php  # Guestbook config (NOT in git)
│   └── data_layer/
│       └── xml/
│           └── comments.xml  # Guestbook data (NOT in git)
├── explore/             # Text analysis tools
├── charset-test/        # Character encoding utilities
├── map/                 # Google Maps integration
├── images/              # Site images
├── styles.css           # Main site styles
└── index.html           # Landing page
```

---

## Support

For issues or questions:
- Review the `SECURITY_REPORT.md` for security considerations
- Check Omeka documentation: https://omeka.org/codex/
- Check JibberBook documentation: http://www.jibberbook.com/

---

**Last Updated:** October 21, 2025
