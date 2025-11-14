import csv
import json
import sys

# CONFIGURATION: Update this to match CURRENT_TOP100_YEAR in src/config.js
CURRENT_TOP100_YEAR = 2025

def csv_to_json(csv_file, json_file):
    data = []
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        for row in csv_reader:
            # Handle vintage - could be a year or "NV" for non-vintage
            vintage_value = row['Vintage']
            if vintage_value and vintage_value != 'NV':
                try:
                    vintage = int(vintage_value)
                except ValueError:
                    vintage = vintage_value  # Keep as string if not a number
            else:
                vintage = vintage_value if vintage_value else None
            
            # Build the JSON object
            record = {
                "id": int(row['Record ID']) if row['Record ID'] else None,
                "winery_full": row['Winery Display'],
                "wine_full": row['Wine Name'],
                "vintage": vintage,
                "note": row['Note (Full Output Display)'],
                "taster_initials": row['Taster'],
                "color": row['Color'],
                "country": row['Country'],
                "region": row['Region Display'],
                "score": int(row['Score']) if row['Score'] else None,
                "price": int(row['Price Only']) if row['Price Only'] else None,
                "alternate_bottle_size": None if not row['Bottle Size'] else row['Bottle Size'],
                "issue_date": row['Issue Date (External)'],
                "top100_year": int(row['T100 Year']) if row['T100 Year'] else None,
                "top100_rank": int(row['T100 Rank']) if row['T100 Rank'] else None,
                "label_url": row['Label URL'] if row['Label URL'] else None,
                "wine_type": row['Wine Type'] if row['Wine Type'] else None
            }
            
            data.append(record)
    
    # Write to JSON file with compact formatting
    with open(json_file, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    
    print(f"Converted {len(data)} records from '{csv_file}' to '{json_file}'")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert.py <input.csv> <output.json>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    csv_to_json(input_file, output_file)