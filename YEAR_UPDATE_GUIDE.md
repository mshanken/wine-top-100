# Top 100 Year Update Guide

This guide explains how to update the Wine Spectator Top 100 year across the entire application.

## Quick Update Process

When a new Top 100 year is released, follow these steps:

### 1. Update the Configuration File (Primary Source)
**File:** `src/config.js`

Change the `CURRENT_TOP100_YEAR` constant:
```javascript
export const CURRENT_TOP100_YEAR = 2026; // Update this value
```

### 2. Update the Static Import
**File:** `src/App.js` (Line 4)

Update the import statement to reference the new year's data file:
```javascript
import winesData from './data/wines-2026.json'; // Update year here
```

### 3. Update HTML Meta Tags
**File:** `public/index.html`

Update the year references in:
- Meta description (line ~13)
- Open Graph title and description (lines ~28-32)
- Twitter Card title and description (lines ~41-45)
- Page title (line ~69)

Look for comments that say: `<!-- NOTE: Update year below when CURRENT_TOP100_YEAR changes in src/config.js -->`

### 4. Update Python Script (Optional)
**File:** `convertCsvToJsonForList.py`

If you use this script to convert CSV data, update:
```python
CURRENT_TOP100_YEAR = 2026  # Update this value
```

### 5. Update Shell Script (Optional)
**File:** `download_wine_lists.sh`

If you use this script to download wine lists, update:
```bash
CURRENT_YEAR=2026  # Update this value
```

## What Gets Updated Automatically

Once you update `src/config.js`, these components will automatically use the new year:

- **Navigation menu links** (both desktop and mobile)
- **Footer archive links** (first two entries)
- **Year selector dropdown** (automatically generates range from 1988 to current year)
- **Default selected year** when the app loads
- **Data loading logic** (loads current year by default, falls back gracefully)

## Files That Reference the Year

### Automatically Updated (via config.js)
- `src/App.js` - Navigation, footer, year selector, initial state
- All React components that import from config.js

### Manually Updated
- `public/index.html` - Meta tags and page title
- `src/App.js` (line 4) - Static import statement for current year data
- `convertCsvToJsonForList.py` - Python configuration variable
- `download_wine_lists.sh` - Shell script configuration variable

## Testing After Update

1. **Build the app**: `npm run build`
2. **Check the year selector**: Should show the new year as the first option
3. **Verify navigation links**: All links should point to the correct year
4. **Test data loading**: Ensure the new year's data loads correctly
5. **Check meta tags**: View page source to confirm HTML meta tags are updated

## Data File Requirements

Make sure you have the corresponding data file:
- `src/data/wines-YYYY.json` (where YYYY is the new year)

The app will gracefully fall back to the current year's data if a selected year's file is missing.

## Notes

- The configuration is centralized in `src/config.js` to minimize the number of places you need to update
- The `YEAR_RANGE` is automatically calculated based on `CURRENT_TOP100_YEAR`
- The earliest year (1988) is also defined in the config and can be changed if needed
