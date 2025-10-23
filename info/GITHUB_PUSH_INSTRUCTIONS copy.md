# GitHub Push Instructions
## Ready to Push: A Shoebox of Norwegian Letters

✅ **Your local repository is ready!**

Commit created: `307d573`
Files committed: 4,562 files (985,824 lines)
All sensitive data protected

---

## Step 1: Create GitHub Repository

Go to GitHub and create a new repository:

### Option A: Via GitHub Web Interface

1. Go to https://github.com/new
2. Fill in the repository details:
   - **Repository name:** `shoebox`
   - **Description:** `A Shoebox of Norwegian Letters - Digital archive of Norwegian-American family correspondence (1911-1956)`
   - **Visibility:** Choose Public or Private
   - **❌ DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click **"Create repository"**

### Option B: Via GitHub CLI (if installed)

```bash
gh repo create shoebox \
  --description "A Shoebox of Norwegian Letters - Digital archive of Norwegian-American family correspondence (1911-1956)" \
  --public  # or --private
```

---

## Step 2: Connect Your Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Use these commands:

### If you chose a public repository:

```bash
git remote add origin https://github.com/YOUR-USERNAME/shoebox.git
git branch -M main
git push -u origin main
```

### If you chose a private repository:

Same commands as above - just make sure you created it as private on GitHub.

### Using SSH instead of HTTPS:

If you have SSH keys set up:

```bash
git remote add origin git@github.com:YOUR-USERNAME/shoebox.git
git branch -M main
git push -u origin main
```

---

## Step 3: Verify the Push

After pushing, you should see output like:

```
Enumerating objects: 4890, done.
Counting objects: 100% (4890/4890), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4562/4562), done.
Writing objects: 100% (4890/4890), 15.23 MiB | 2.45 MiB/s, done.
Total 4890 (delta 892), reused 0 (delta 0), pack-reused 0
To https://github.com/YOUR-USERNAME/shoebox.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Step 4: Verify on GitHub

1. Go to `https://github.com/YOUR-USERNAME/shoebox`
2. You should see:
   - All your files and directories
   - The commit message "Initial commit: A Shoebox of Norwegian Letters digital archive"
   - Your README files (SECURITY_REPORT.md, SETUP.md)
   - ❌ **You should NOT see:** `db.ini`, `gb/inc/config.php`, `comments.xml`, or any `.sql` files

---

## Troubleshooting

### "Authentication failed"

**Problem:** GitHub requires authentication

**Solution (HTTPS):**
```bash
# GitHub now requires a personal access token instead of password
# Create one at: https://github.com/settings/tokens
# Use the token as your password when prompted
```

**Solution (SSH):**
```bash
# Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### "Repository already exists"

**Problem:** You already created a repo with this name

**Solution:**
```bash
# Either delete the old repo on GitHub, or use a different name:
git remote add origin https://github.com/YOUR-USERNAME/shoebox-letters.git
```

### "Updates were rejected"

**Problem:** Remote has changes you don't have locally

**Solution:**
```bash
# Force push (only safe for initial push)
git push -u origin main --force
```

### "Large files detected"

**Problem:** Some files are over GitHub's 100MB limit

**Solution:** This shouldn't happen - we excluded large files. If it does:
```bash
# Check what large files exist
git ls-files -z | xargs -0 du -h | sort -rh | head -20
```

---

## What Was Committed?

✅ **Safe Files Committed:**
- Omeka installation files (PHP application)
- JibberBook guestbook (PHP application)
- HTML landing pages and about page
- CSS stylesheets
- JavaScript files
- Letter analysis tools (Python scripts)
- Letter content (JSON files)
- Documentation (README, SETUP, SECURITY_REPORT)
- Configuration templates (.example files)

❌ **Protected Files (NOT Committed):**
- `letters/db.ini` - MySQL credentials
- `charset-test/db.ini` - MySQL credentials
- `gb/inc/config.php` - Admin password & API key
- `gb/data_layer/xml/comments.xml` - 43MB user data
- `*.sql` files - Database dumps
- `explore/ner/venv/` - Python virtual environment
- Uploaded PDF files (200+ files)

---

## Next Steps After Pushing

### 1. Add Repository Description on GitHub

Go to your repository settings and add topics:
- `omeka`
- `digital-archive`
- `norwegian-american-history`
- `digital-humanities`
- `genealogy`
- `historical-letters`

### 2. Add a Comprehensive README.md

Consider creating a main `README.md` file for the repository root with:
- Project overview
- Screenshots
- Live site link (if public)
- Installation instructions (link to SETUP.md)
- Historical context
- Credits to Siri and yourself

### 3. Consider Adding a License

If you want to make this open source:
```bash
# Add LICENSE file (e.g., MIT License)
# Then commit and push
git add LICENSE
git commit -m "Add MIT License"
git push
```

### 4. Set Up GitHub Pages (Optional)

If you want to host the static pages on GitHub Pages:
1. Go to Settings → Pages
2. Choose branch: `main`
3. Choose folder: `/ (root)` or `/docs` if you move files there
4. Your site will be at: `https://YOUR-USERNAME.github.io/shoebox/`

---

## Security Reminder

⚠️ **After pushing, strongly consider rotating these credentials that were exposed during setup:**

1. **MySQL Password:** `LC1yrYbAvsjWx8wGE3`
   - Change via your hosting control panel
   - Update `letters/db.ini` locally

2. **Guestbook Admin Password:** `23ogVindhc`
   - Update in `gb/inc/config.php` locally

3. **Akismet API Key:** `6821d46dc73d`
   - Get new key from akismet.com
   - Update in `gb/inc/config.php` locally

After rotating, these new credentials will stay on your local machine only (protected by .gitignore).

---

## Commands Summary

Here's everything in one place:

```bash
# Create repo on GitHub first, then:

# Add remote
git remote add origin https://github.com/YOUR-USERNAME/shoebox.git

# Ensure you're on main branch
git branch -M main

# Push to GitHub
git push -u origin main

# Future pushes (after making changes):
git add .
git commit -m "Your commit message"
git push
```

---

**Repository Status:** ✅ Ready to push
**Sensitive Data:** ✅ Protected
**Commit Hash:** 307d573
**Total Size:** ~15-20 MB (excluding protected files)

Good luck with your push! 🚀
