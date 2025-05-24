import pandas as pd
import duckdb
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test loading a single CSV file
def test_single_csv():
    # Read the AWS CSV
    df = pd.read_csv('v7/aws/vms.csv', nrows=5)
    print("Original DataFrame:")
    print(df.head())
    print("\nColumn types:")
    print(df.dtypes)
    
    # Add provider column
    df['provider'] = 'aws'
    
    # Standardize column names
    column_mapping = {
        'InstanceType': 'instance_type',
        'vCPUs': 'vcpus',
        'MemoryGiB': 'memory_gib',
        'AcceleratorName': 'accelerator_name',
        'AcceleratorCount': 'accelerator_count',
        'GpuInfo': 'gpu_info',
        'Price': 'price',
        'SpotPrice': 'spot_price',
        'Region': 'region',
        'AvailabilityZone': 'availability_zone'
    }
    
    # Rename columns
    for old_name, new_name in column_mapping.items():
        if old_name in df.columns:
            df = df.rename(columns={old_name: new_name})
    
    # Add missing columns
    if 'generation' not in df.columns:
        df['generation'] = None
    
    # Reorder columns
    required_columns = [
        'provider', 'instance_type', 'vcpus', 'memory_gib', 'price', 'region',
        'accelerator_name', 'accelerator_count', 'gpu_info', 'spot_price', 
        'availability_zone', 'generation'
    ]
    
    df = df[required_columns]
    
    # Convert numeric columns only
    numeric_columns = ['vcpus', 'memory_gib', 'accelerator_count', 'price', 'spot_price']
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Handle string columns
    string_columns = ['provider', 'instance_type', 'accelerator_name', 'gpu_info', 'region', 'availability_zone', 'generation']
    for col in string_columns:
        if col in df.columns:
            df[col] = df[col].astype(str)
            df[col] = df[col].replace('nan', None)
            df[col] = df[col].replace('', None)
    
    print("\nProcessed DataFrame:")
    print(df.head())
    print("\nColumn types after processing:")
    print(df.dtypes)
    
    # Test DuckDB insertion
    conn = duckdb.connect(':memory:')
    
    # Create table
    conn.execute("""
        CREATE TABLE vms (
            provider VARCHAR,
            instance_type VARCHAR,
            vcpus DOUBLE,
            memory_gib DOUBLE,
            accelerator_name VARCHAR,
            accelerator_count DOUBLE,
            gpu_info VARCHAR,
            price DOUBLE,
            spot_price DOUBLE,
            region VARCHAR,
            availability_zone VARCHAR,
            generation VARCHAR
        )
    """)
    
    try:
        # Insert data with explicit column mapping
        insert_sql = """
            INSERT INTO vms (provider, instance_type, vcpus, memory_gib, accelerator_name, 
                           accelerator_count, gpu_info, price, spot_price, region, 
                           availability_zone, generation)
            SELECT provider, instance_type, vcpus, memory_gib, accelerator_name, 
                   accelerator_count, gpu_info, price, spot_price, region, 
                   availability_zone, generation
            FROM df
        """
        conn.execute(insert_sql)
        print("\nSuccessfully inserted data into DuckDB!")
        
        # Query back
        result = conn.execute("SELECT * FROM vms LIMIT 3").df()
        print("\nData from DuckDB:")
        print(result)
        
    except Exception as e:
        print(f"\nError inserting into DuckDB: {e}")
    
    conn.close()

if __name__ == "__main__":
    test_single_csv()
