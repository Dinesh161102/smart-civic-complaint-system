import os
import json
import duckdb
from typing import Dict, Any

DATASET_PATH_1 = r"f:\DPA\Dataset\export.csv"
DATASET_PATH_2 = r"f:\DPA\datasets\exports.csv"
REFERENCE_JSON_PATH = r"f:\DPA\backend\app\data\compact_reference.json"

def get_csv_path() -> str:
    if os.path.exists(DATASET_PATH_1):
        return DATASET_PATH_1
    elif os.path.exists(DATASET_PATH_2):
        return DATASET_PATH_2
    return None

def build_compact_historical_reference() -> Dict[str, Any]:
    """
    Stream-queries the 8.89 GB CSV using DuckDB without loading the file into RAM.
    Extracts category frequencies, descriptors, and top keywords for reference.
    Generates compact_reference.json (< 1 MB).
    """
    csv_file = get_csv_path()
    if not csv_file:
        print("[DuckDB Processor] CSV dataset file not found. Skipping offline processing.")
        return {"status": "dataset_not_found"}

    os.makedirs(os.path.dirname(REFERENCE_JSON_PATH), exist_ok=True)
    print(f"[DuckDB Processor] Efficiently scanning header/data from {csv_file} via DuckDB stream...")

    try:
        conn = duckdb.connect(database=":memory:")
        conn.execute("SET memory_limit='2GB';")
        conn.execute("SET threads=2;")
        conn.execute("SET preserve_insertion_order=false;")
        
        normalized_path = csv_file.replace('\\', '/')
        
        # Query distinct categories and count
        cat_query = f"""
            SELECT "Problem (formerly Complaint Type)" AS category, COUNT(*) as total_count
            FROM read_csv('{normalized_path}', header=true, sample_size=1000, ignore_errors=true)
            WHERE "Problem (formerly Complaint Type)" IS NOT NULL
            GROUP BY category
            ORDER BY total_count DESC
            LIMIT 50;
        """
        categories = conn.execute(cat_query).fetchall()

        # Query descriptors
        desc_query = f"""
            SELECT "Problem Detail (formerly Descriptor)" AS descriptor, COUNT(*) as total_count
            FROM read_csv('{normalized_path}', header=true, sample_size=1000, ignore_errors=true)
            WHERE "Problem Detail (formerly Descriptor)" IS NOT NULL
            GROUP BY descriptor
            ORDER BY total_count DESC
            LIMIT 50;
        """
        descriptors = conn.execute(desc_query).fetchall()

        summary_data = {
            "source_file": os.path.basename(csv_file),
            "generated_at": duckdb.__version__,
            "total_distinct_categories": len(categories),
            "top_categories": [{"category": row[0], "count": row[1]} for row in categories],
            "top_descriptors": [{"descriptor": row[0], "count": row[1]} for row in descriptors]
        }

        with open(REFERENCE_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, indent=2)

        print(f"[DuckDB Processor] SUCCESS: Compact reference saved to {REFERENCE_JSON_PATH} (Size: {os.path.getsize(REFERENCE_JSON_PATH)} bytes)")
        return summary_data
    except Exception as e:
        print(f"[DuckDB Processor] Query execution notice: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    build_compact_historical_reference()
