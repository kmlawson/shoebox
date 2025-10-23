# Security Audit Summary
## A Shoebox of Norwegian Letters Project

**Date:** October 21, 2025
**Repository:** https://github.com/kmlawson/shoebox

---

## Security Status

✅ **Repository is secure** - All sensitive data properly protected through .gitignore configuration.

---

## Protected Files (Not in Repository)

The following files contain sensitive credentials and are excluded from version control:

### Database Configuration
- `letters/db.ini` - Omeka database credentials
- `charset-test/db.ini` - Character set testing database config

### Application Configuration
- `gb/inc/config.php` - Guestbook admin password and Akismet API key

### Data Files
- `gb/data_layer/xml/comments.xml` - Guestbook comments (43.7 MB, contains PII)
- `*.sql` files - Database dumps
- `letters/archive/files/` - Uploaded PDFs (200+ files)

### Development Files
- `explore/ner/venv/` - Python virtual environment
- Backup directories (`*_backup/`, `backups/`)

---

## Template Files Provided

Safe configuration templates with placeholders:

- `db.ini.example` - Database configuration template
- `gb/inc/config.php.example` - Guestbook configuration template

Copy these to the actual filenames and fill in your credentials.

---

## Setup Instructions

For deployment instructions, see:
- `SETUP.md` - Complete deployment and configuration guide
- `GITHUB_PUSH_INSTRUCTIONS.md` - Repository management

---

## Security Best Practices

1. **Never commit** files matching these patterns:
   - `db.ini`
   - `config.php` (in gb/inc/)
   - `*.sql` dumps
   - Files containing passwords or API keys

2. **Use template files** to understand required configuration

3. **Rotate credentials** regularly, especially if exposed

4. **Set proper file permissions** on production servers:
   - `db.ini` should be 600 (owner read/write only)
   - `config.php` should be 600 (owner read/write only)
   - Archive directories should be 755
   - Upload directories should be 777

5. **Keep .gitignore updated** when adding new sensitive files

---

## Configuration Security Checklist

Before deploying:

- [ ] Database credentials are set and unique
- [ ] Guestbook admin password is strong (12+ characters)
- [ ] Akismet API key is configured
- [ ] File permissions are correct
- [ ] `.htaccess` files protect sensitive directories
- [ ] MySQL user has minimum required privileges
- [ ] All template files (*.example) have been copied and configured

---

## If Credentials Are Exposed

If you accidentally commit sensitive data:

1. **Immediately rotate all exposed credentials**
2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH_TO_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (if you control the repository)
4. **Consider the repository compromised** if it was public

---

## Additional Resources

- Omeka Security: https://omeka.org/codex/Managing_Security_Settings
- GitHub Security: https://docs.github.com/en/code-security
- MySQL Security: https://dev.mysql.com/doc/refman/8.0/en/security.html

---

**Note:** This file contains no actual credentials - only security procedures and best practices.
