#!/bin/bash

# Wine Spectator Top 100 Lists Downloader (CURL Version)
# CONFIGURATION: Update CURRENT_YEAR to match CURRENT_TOP100_YEAR in src/config.js
CURRENT_YEAR=2025

# Downloads all JSON files from 1988 to current year
# Create directory for the data
mkdir -p wine_spectator_top100

# Base URL pattern
BASE_URL="https://top100.winespectator.com/wp-content/themes/top100-theme/src/data"

# Download files from 1988 to current year
for year in $(seq 1988 $CURRENT_YEAR); do
    echo "Downloading Top 100 list for $year..."
    
    # Use curl with proper encoding and error handling
    curl -L \
         -H "Accept: application/json" \
         -H "Accept-Charset: utf-8" \
         --fail \
         --silent \
         --show-error \
         --max-time 30 \
         --retry 3 \
         --retry-delay 2 \
         "$BASE_URL/$year.json" \
         -o "wine_spectator_top100/$year.json"
    
    # Check if download was successful
    if [ $? -eq 0 ]; then
        echo "✓ Successfully downloaded $year.json"
        # Verify the file is valid JSON and not empty
        if [ -s "wine_spectator_top100/$year.json" ] && jq empty "wine_spectator_top100/$year.json" 2>/dev/null; then
            echo "✓ File $year.json is valid JSON"
        else
            echo "⚠ Warning: $year.json may be invalid or empty"
        fi
    else
        echo "✗ Failed to download $year.json"
    fi
    
    # Small delay to be respectful to the server
    sleep 1
done

echo ""
echo "Download complete! Files saved to wine_spectator_top100/ directory"
echo "Total files downloaded: $(ls wine_spectator_top100/*.json 2>/dev/null | wc -l)"
