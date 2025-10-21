# Update Map Page to Leaflet

## What This Fixes

1. ✓ Uses modern Leaflet.js (free, no API key needed)
2. ✓ All HTTPS URLs (secure)
3. ✓ No deprecated Google Maps API
4. ✓ Works in modern browsers
5. ✓ Uses OpenStreetMap tiles (free)
6. ✓ Responsive and mobile-friendly

## How to Update

### Step 1: Log into Omeka Admin

1. Go to: `https://huginn.net/shoebox/letters/admin`
2. Log in with your Omeka credentials

### Step 2: Edit the Map Page

1. In admin panel, go to **Appearance** → **Simple Pages**
2. Find the page titled "Places Mentioned in the Shoebox Letters" (or similar)
3. Click **Edit**

### Step 3: Replace the Content

1. Delete all the existing HTML/PHP code in the page content
2. Copy the entire contents of `NEW_MAP_PAGE_CODE.html`
3. Paste it into the page content field
4. Click **Save Changes**

### Step 4: Test

1. Visit: `https://huginn.net/shoebox/letters/map/`
2. You should see:
   - Map loads properly with OpenStreetMap
   - List of locations below
   - Clicking a location centers the map and adds a marker

## What Changed

**Old version:**
- Used iframe with Google Maps API v2 (deprecated)
- Mixed HTTP/HTTPS
- Required separate map files

**New version:**
- Leaflet.js with OpenStreetMap tiles
- All HTTPS
- Everything in one page
- Modern JavaScript
- No external dependencies on your server

## If You Have Issues

**Map doesn't show:**
- Check browser console (F12) for errors
- Make sure the CSV file path is correct: `/home/kmlawson/huginn.net/shoebox/map/locations.csv`

**Locations don't click:**
- Make sure the CSV file has the correct format: `Name,Description,Latitude,Longitude`

**Style issues:**
- The map height is set to 500px - adjust in the CSS if needed

## Bonus: Future Improvements

You could also:
1. Add custom markers/pins
2. Use different map styles (satellite, terrain)
3. Add clustering for nearby locations
4. Show all locations as markers by default

Let me know if you need any adjustments!
