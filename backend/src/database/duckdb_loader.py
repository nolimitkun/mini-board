import duckdb
import pandas as pd
import os
import requests
import tempfile
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class DuckDBLoader:
    def __init__(self, data_dir: str = "v8", db_path: str = "vm_catalog.duckdb"):
        self.data_dir = data_dir
        self.db_path = db_path
        self.conn = None
        self.providers: List[str] = []
        
    def initialize_database(self):
        """Initialize DuckDB connection and create tables"""
        try:
            # Create or connect to DuckDB database file
            self.conn = duckdb.connect(self.db_path)
            
            # Create VMs table with relaxed constraints
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS vms (
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
            
            # Create Images table with relaxed constraints
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS images (
                    provider VARCHAR,
                    tag VARCHAR,
                    region VARCHAR,
                    os VARCHAR,
                    os_version VARCHAR,
                    image_id VARCHAR,
                    creation_date VARCHAR,
                    base_image_id VARCHAR
                )
            """)
            
            # Create indexes for better performance
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_vms_provider ON vms(provider)")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_vms_price ON vms(price)")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_vms_vcpus ON vms(vcpus)")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_vms_memory ON vms(memory_gib)")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_vms_gpu ON vms(accelerator_name)")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_vms_region ON vms(region)")
            
            logger.info("DuckDB database initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing DuckDB: {e}")
            raise

    def download_github_catalog_data(self, temp_dir: str) -> bool:
        """Download VM catalog data from GitHub repository"""
        base_url = "https://raw.githubusercontent.com/skypilot-org/skypilot-catalog/master/catalogs/v8"

        # List of known providers and their files
        providers_files = {
            "aws": ["vms.csv", "images.csv", "instance_quota_mapping.csv"],
            "azure": ["vms.csv", "images.csv"],
            "gcp": ["vms.csv", "images.csv", "accelerator_quota_mapping.csv"],
            "oci": ["vms.csv", "images.csv"],
            "ibm": ["vms.csv"],
            "kubernetes": ["images.csv"],
            "scp": ["vms.csv", "images.csv"],
            "cudo": ["vms.csv"],
            "do": ["vms.csv"],
            "fluidstack": ["vms.csv"],
            "hyperstack": ["vms.csv"],
            "hyperbolic": ["vms.csv"],
            "lambda": ["vms.csv"],
            "mithril": ["vms.csv"],
            "nebius": ["vms.csv"],
            "ovhcloud": ["vms.csv"],
            "paperspace": ["vms.csv"],
            "primeintellect": ["vms.csv"],
            "runpod": ["vms.csv"],
            "scaleway": ["vms.csv"],
            "seeweb": ["vms.csv"],
            "shadeform": ["vms.csv"],
            "vast": ["vms.csv"],
            "verda": ["vms.csv"],
            "yotta": ["vms.csv"],
            "common": ["accelerators.csv"]
        }
        
        try:
            downloaded_providers = []
            
            for provider, files in providers_files.items():
                provider_dir = os.path.join(temp_dir, provider)
                os.makedirs(provider_dir, exist_ok=True)
                
                provider_downloaded = False
                for file_name in files:
                    file_url = f"{base_url}/{provider}/{file_name}"
                    file_path = os.path.join(provider_dir, file_name)
                    
                    try:
                        logger.info(f"Downloading {file_url}")
                        response = requests.get(file_url, timeout=30)
                        
                        if response.status_code == 200:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(response.text)
                            logger.info(f"Downloaded {provider}/{file_name}")
                            provider_downloaded = True
                        else:
                            logger.warning(f"File not found: {file_url} (status: {response.status_code})")
                            
                    except requests.RequestException as e:
                        logger.warning(f"Failed to download {file_url}: {e}")
                        continue
                
                if provider_downloaded:
                    downloaded_providers.append(provider)
            
            logger.info(f"Successfully downloaded data for providers: {downloaded_providers}")
            return len(downloaded_providers) > 0
            
        except Exception as e:
            logger.error(f"Error downloading GitHub catalog data: {e}")
            return False

    def reload_from_github(self) -> Dict:
        """Reload all data from GitHub repository"""
        try:
            logger.info("Starting data reload from GitHub repository...")
            
            # Create temporary directory for downloaded data
            with tempfile.TemporaryDirectory() as temp_dir:
                # Download data from GitHub
                logger.info("Downloading data from GitHub...")
                if not self.download_github_catalog_data(temp_dir):
                    raise Exception("Failed to download data from GitHub repository")
                
                # Clear existing data in database
                logger.info("Clearing existing data...")
                if self.conn:
                    self.conn.execute("DELETE FROM vms")
                    self.conn.execute("DELETE FROM images")
                
                # Update data directory temporarily
                original_data_dir = self.data_dir
                self.data_dir = temp_dir
                
                try:
                    # Reload data from downloaded files
                    logger.info("Loading new data into database...")
                    
                    # Get list of provider directories from downloaded data
                    providers = [d for d in os.listdir(temp_dir) 
                               if os.path.isdir(os.path.join(temp_dir, d))]
                    
                    total_vms = 0
                    total_images = 0
                    loaded_providers = []
                    
                    for provider in providers:
                        try:
                            vms_loaded, images_loaded = self._load_provider_data(provider)
                            if vms_loaded > 0 or images_loaded > 0:
                                total_vms += vms_loaded
                                total_images += images_loaded
                                loaded_providers.append(provider)
                                logger.info(f"Loaded {vms_loaded} VMs and {images_loaded} images for {provider}")
                        except Exception as e:
                            logger.warning(f"Failed to load data for provider {provider}: {e}")
                            continue
                    
                    # Update providers list
                    self.providers = loaded_providers
                    
                    logger.info(f"Reload completed successfully. Loaded {total_vms} VMs and {total_images} images from {len(loaded_providers)} providers")
                    
                    return {
                        "total_vms_loaded": total_vms,
                        "total_images_loaded": total_images,
                        "providers_loaded": loaded_providers,
                        "providers_count": len(loaded_providers)
                    }
                    
                finally:
                    # Restore original data directory
                    self.data_dir = original_data_dir
                    
        except Exception as e:
            logger.error(f"Error reloading data from GitHub: {e}")
            raise
    
    def load_all_data(self):
        """Load all VM and image data from CSV files into DuckDB"""
        try:
            if not self.conn:
                self.initialize_database()
            
            # Check if data already exists
            count = self.conn.execute("SELECT COUNT(*) FROM vms").fetchone()[0]
            if count > 1000:  # Lowered threshold to allow GitHub reload for initialization
                logger.info(f"Database already contains {count} VMs, skipping data load")
                self._load_providers()
                return
            
            # Try to load from local directory first
            if os.path.exists(self.data_dir):
                local_providers = [d for d in os.listdir(self.data_dir) 
                                if os.path.isdir(os.path.join(self.data_dir, d))]
                
                if local_providers:
                    logger.info(f"Found local providers: {local_providers}")
                    self.providers = local_providers
                    
                    # Load VM data for each provider
                    total_vms = 0
                    total_images = 0
                    
                    for provider in self.providers:
                        vms_loaded, images_loaded = self._load_provider_data(provider)
                        total_vms += vms_loaded
                        total_images += images_loaded
                    
                    if total_vms > 0:
                        logger.info(f"Loaded {total_vms} total VMs and {total_images} total images from local files")
                        return
            
            # If no local data or no VMs loaded, try GitHub
            logger.info("No local data found or no VMs loaded, attempting to load from GitHub...")
            result = self.reload_from_github()
            logger.info(f"Loaded {result['total_vms_loaded']} VMs and {result['total_images_loaded']} images from GitHub")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def _load_providers(self):
        """Load provider list from database"""
        try:
            result = self.conn.execute("SELECT DISTINCT provider FROM vms ORDER BY provider").fetchall()
            self.providers = [row[0] for row in result]
        except Exception as e:
            logger.error(f"Error loading providers: {e}")
            self.providers = []
    
    def _load_provider_data(self, provider: str):
        """Load data for a specific provider"""
        provider_dir = os.path.join(self.data_dir, provider)
        vms_loaded = 0
        images_loaded = 0
        
        # Load VMs data
        vms_file = os.path.join(provider_dir, "vms.csv")
        if os.path.exists(vms_file):
            try:
                df = pd.read_csv(vms_file)
                df = self._standardize_vm_columns(df, provider)
                
                # Insert into DuckDB using explicit INSERT with VALUES
                self._insert_vms_data(df)
                vms_loaded = len(df)
                logger.info(f"Loaded {vms_loaded} VMs for {provider}")
                
            except Exception as e:
                logger.error(f"Error loading VMs for {provider}: {e}")
        
        # Load images data
        images_file = os.path.join(provider_dir, "images.csv")
        if os.path.exists(images_file):
            try:
                df = pd.read_csv(images_file)
                df = self._standardize_image_columns(df, provider)
                
                # Insert into DuckDB using explicit INSERT with VALUES
                self._insert_images_data(df)
                images_loaded = len(df)
                logger.info(f"Loaded {images_loaded} images for {provider}")
                
            except Exception as e:
                logger.error(f"Error loading images for {provider}: {e}")
        
        return vms_loaded, images_loaded
    
    def _insert_vms_data(self, df: pd.DataFrame):
        """Insert VM data into DuckDB using explicit INSERT statements"""
        if df.empty:
            return
        
        # Prepare the INSERT statement
        insert_sql = """
            INSERT INTO vms (provider, instance_type, vcpus, memory_gib, accelerator_name, 
                           accelerator_count, gpu_info, price, spot_price, region, 
                           availability_zone, generation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        # Convert DataFrame to list of tuples
        data_tuples = []
        for _, row in df.iterrows():
            data_tuples.append((
                row['provider'],
                row['instance_type'] if pd.notna(row['instance_type']) and row['instance_type'] != 'None' else None,
                float(row['vcpus']) if pd.notna(row['vcpus']) else None,
                float(row['memory_gib']) if pd.notna(row['memory_gib']) else None,
                row['accelerator_name'] if pd.notna(row['accelerator_name']) and row['accelerator_name'] != 'None' else None,
                float(row['accelerator_count']) if pd.notna(row['accelerator_count']) else None,
                row['gpu_info'] if pd.notna(row['gpu_info']) and row['gpu_info'] != 'None' else None,
                float(row['price']) if pd.notna(row['price']) else None,
                float(row['spot_price']) if pd.notna(row['spot_price']) else None,
                row['region'] if pd.notna(row['region']) and row['region'] != 'None' else None,
                row['availability_zone'] if pd.notna(row['availability_zone']) and row['availability_zone'] != 'None' else None,
                row['generation'] if pd.notna(row['generation']) and row['generation'] != 'None' else None
            ))
        
        # Execute batch insert
        self.conn.executemany(insert_sql, data_tuples)
    
    def _insert_images_data(self, df: pd.DataFrame):
        """Insert image data into DuckDB using explicit INSERT statements"""
        if df.empty:
            return
        
        # Prepare the INSERT statement
        insert_sql = """
            INSERT INTO images (provider, tag, region, os, os_version, image_id, creation_date, base_image_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        # Convert DataFrame to list of tuples
        data_tuples = []
        for _, row in df.iterrows():
            data_tuples.append((
                row['provider'],
                row['tag'] if pd.notna(row['tag']) and row['tag'] != 'None' else None,
                row['region'] if pd.notna(row['region']) and row['region'] != 'None' else None,
                row['os'] if pd.notna(row['os']) and row['os'] != 'None' else None,
                row['os_version'] if pd.notna(row['os_version']) and row['os_version'] != 'None' else None,
                row['image_id'] if pd.notna(row['image_id']) and row['image_id'] != 'None' else None,
                row['creation_date'] if pd.notna(row['creation_date']) and row['creation_date'] != 'None' else None,
                row['base_image_id'] if pd.notna(row['base_image_id']) and row['base_image_id'] != 'None' else None
            ))
        
        # Execute batch insert
        self.conn.executemany(insert_sql, data_tuples)
    
    def _standardize_vm_columns(self, df: pd.DataFrame, provider: str) -> pd.DataFrame:
        """Standardize VM column names and add provider"""
        df = df.copy()
        
        # Add provider column
        df['provider'] = provider
        
        # Standardize column names
        column_mapping = {
            'InstanceType': 'instance_type',
            'vCPUs': 'vcpus',
            'MemoryGiB': 'memory_gib',
            'AcceleratorName': 'accelerator_name',
            'AcceleratorCount': 'accelerator_count',
            'GpuInfo': 'gpu_info',
            'GPUInfo': 'gpu_info',
            'Price': 'price',
            'SpotPrice': 'spot_price',
            'Region': 'region',
            'AvailabilityZone': 'availability_zone',
            'Generation': 'generation'
        }
        
        # Rename columns if they exist
        for old_name, new_name in column_mapping.items():
            if old_name in df.columns:
                df = df.rename(columns={old_name: new_name})
        
        # Ensure required columns exist
        required_columns = [
            'provider', 'instance_type', 'vcpus', 'memory_gib', 'price', 'region',
            'accelerator_name', 'accelerator_count', 'gpu_info', 'spot_price', 
            'availability_zone', 'generation'
        ]
        
        for col in required_columns:
            if col not in df.columns:
                df[col] = None
        
        # Select only required columns in correct order
        df = df[required_columns]
        
        return df
    
    def _standardize_image_columns(self, df: pd.DataFrame, provider: str) -> pd.DataFrame:
        """Standardize image column names and add provider"""
        df = df.copy()
        
        # Add provider column
        df['provider'] = provider
        
        # Standardize column names
        column_mapping = {
            'Tag': 'tag',
            'Region': 'region',
            'OS': 'os',
            'OSVersion': 'os_version',
            'ImageId': 'image_id',
            'CreationDate': 'creation_date',
            'BaseImageId': 'base_image_id'
        }
        
        # Rename columns if they exist
        for old_name, new_name in column_mapping.items():
            if old_name in df.columns:
                df = df.rename(columns={old_name: new_name})
        
        # Ensure required columns exist
        required_columns = [
            'provider', 'tag', 'region', 'os', 'os_version', 
            'image_id', 'creation_date', 'base_image_id'
        ]
        
        for col in required_columns:
            if col not in df.columns:
                df[col] = None
        
        # Select only required columns
        df = df[required_columns]
        
        # Remove rows where critical fields are None
        df = df.dropna(subset=['provider', 'tag'])
        
        return df
    
    def query_vms(self, 
                  providers: Optional[List[str]] = None,
                  min_vcpus: Optional[float] = None,
                  max_vcpus: Optional[float] = None,
                  min_memory: Optional[float] = None,
                  max_memory: Optional[float] = None,
                  has_gpu: Optional[bool] = None,
                  gpu_name: Optional[str] = None,
                  region: Optional[str] = None,
                  region_contains: Optional[str] = None,
                  max_price: Optional[float] = None,
                  hide_incomplete: bool = True,
                  sort_by: str = "price",
                  sort_order: str = "asc",
                  limit: int = 100) -> pd.DataFrame:
        """Query VMs with filters using SQL"""
        
        # Build WHERE clause
        where_conditions = []
        params = []
        
        if providers:
            placeholders = ','.join(['?' for _ in providers])
            where_conditions.append(f"provider IN ({placeholders})")
            params.extend(providers)
        
        if min_vcpus is not None:
            where_conditions.append("vcpus >= ?")
            params.append(min_vcpus)
        
        if max_vcpus is not None:
            where_conditions.append("vcpus <= ?")
            params.append(max_vcpus)
        
        if min_memory is not None:
            where_conditions.append("memory_gib >= ?")
            params.append(min_memory)
        
        if max_memory is not None:
            where_conditions.append("memory_gib <= ?")
            params.append(max_memory)
        
        if has_gpu is not None:
            if has_gpu:
                where_conditions.append("accelerator_name IS NOT NULL")
            else:
                where_conditions.append("accelerator_name IS NULL")
        
        if gpu_name:
            where_conditions.append("accelerator_name ILIKE ?")
            params.append(f'%{gpu_name}%')
        
        if region:
            where_conditions.append("region = ?")
            params.append(region)

        if region_contains:
            where_conditions.append("region ILIKE ?")
            params.append(f'%{region_contains}%')

        if max_price is not None:
            where_conditions.append("price <= ?")
            params.append(max_price)

        if hide_incomplete:
            # Drop rows with no usable pricing (e.g. GCP machine types the catalog
            # hasn't priced yet). These show as "$0.0000" and pollute price sorting.
            where_conditions.append("price IS NOT NULL AND price > 0")

        # Build SQL query
        sql = "SELECT * FROM vms"

        if where_conditions:
            sql += " WHERE " + " AND ".join(where_conditions)

        # Add sorting
        if sort_by in ['price', 'spot_price', 'vcpus', 'memory_gib', 'accelerator_count']:
            direction = "DESC" if sort_order.lower() == 'desc' else "ASC"
            if sort_by in ['price', 'spot_price']:
                # Always push missing/zero prices to the bottom regardless of direction
                sql += f" ORDER BY ({sort_by} IS NULL OR {sort_by} <= 0), {sort_by} {direction}"
            else:
                sql += f" ORDER BY {sort_by} {direction}"
        
        # Add limit
        sql += f" LIMIT {limit}"
        
        # Execute query
        try:
            result = self.conn.execute(sql, params).df()
            return result
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            return pd.DataFrame()
    
    def get_providers(self) -> List[str]:
        """Get list of available providers"""
        if not self.providers:
            self._load_providers()
        return self.providers
    
    def get_regions(self, provider: str = None) -> List[str]:
        """Get available regions, optionally filtered by provider"""
        try:
            if provider:
                sql = "SELECT DISTINCT region FROM vms WHERE provider = ? AND region IS NOT NULL ORDER BY region"
                result = self.conn.execute(sql, [provider]).fetchall()
            else:
                sql = "SELECT DISTINCT region FROM vms WHERE region IS NOT NULL ORDER BY region"
                result = self.conn.execute(sql).fetchall()
            
            return [row[0] for row in result if row[0] is not None]
        except Exception as e:
            logger.error(f"Error getting regions: {e}")
            return []
    
    def get_stats(self) -> Dict:
        """Get statistics about the VM catalog"""
        try:
            # Total VMs
            total_vms = self.conn.execute("SELECT COUNT(*) FROM vms").fetchone()[0]
            
            # Providers count
            providers_count = self.conn.execute("SELECT COUNT(DISTINCT provider) FROM vms").fetchone()[0]
            
            # GPU instances count
            gpu_count = self.conn.execute("SELECT COUNT(*) FROM vms WHERE accelerator_name IS NOT NULL").fetchone()[0]
            
            # Regions count
            regions_count = self.conn.execute("SELECT COUNT(DISTINCT region) FROM vms WHERE region IS NOT NULL").fetchone()[0]
            
            # Price statistics
            price_stats = self.conn.execute("""
                SELECT MIN(price), MAX(price), AVG(price) 
                FROM vms 
                WHERE price IS NOT NULL AND price > 0
            """).fetchone()
            
            return {
                "total_vms": total_vms,
                "providers_count": providers_count,
                "gpu_instances_count": gpu_count,
                "regions_count": regions_count,
                "price_range": {
                    "min": float(price_stats[0]) if price_stats[0] else 0,
                    "max": float(price_stats[1]) if price_stats[1] else 0,
                    "avg": float(price_stats[2]) if price_stats[2] else 0
                }
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {
                "total_vms": 0,
                "providers_count": 0,
                "gpu_instances_count": 0,
                "regions_count": 0,
                "price_range": {"min": 0, "max": 0, "avg": 0}
            }
    
    def preview_database_data(self, max_rows: int = 5) -> Dict[str, Dict[str, any]]:
        """Preview data from DuckDB database - shows sample rows and statistics"""
        preview_data = {}
        
        try:
            # Initialize database connection if not already done
            if not self.conn:
                logger.info("Database connection not initialized, initializing now...")
                self.initialize_database()
            
            # Check if database has any data, if not try to load it
            total_vms = self.conn.execute("SELECT COUNT(*) FROM vms").fetchone()[0]
            if total_vms == 0:
                logger.info("No VMs found in database, attempting to load data...")
                try:
                    self.load_all_data()
                    total_vms = self.conn.execute("SELECT COUNT(*) FROM vms").fetchone()[0]
                except Exception as load_error:
                    logger.error(f"Failed to load data: {load_error}")
                    return {
                        "error": f"Database is empty and failed to load data: {str(load_error)}",
                        "total_vms": 0,
                        "providers_count": 0
                    }
            
            # Get available providers from database
            providers_result = self.conn.execute("SELECT DISTINCT provider FROM vms ORDER BY provider").fetchall()
            providers = [row[0] for row in providers_result]
            
            if not providers:
                return {
                    "error": "No providers found in database",
                    "total_vms": total_vms,
                    "providers_count": 0
                }
            
            for provider in providers:
                try:
                    # Get sample VMs data
                    vms_sql = f"SELECT * FROM vms WHERE provider = ? LIMIT {max_rows}"
                    vms_df = self.conn.execute(vms_sql, [provider]).df()
                    
                    if not vms_df.empty:
                        # Convert to JSON-serializable format that matches frontend expectations
                        sample_data = []
                        for _, row in vms_df.iterrows():
                            row_dict = {}
                            for col, val in row.items():
                                if pd.isna(val):
                                    row_dict[col] = None
                                else:
                                    row_dict[col] = val
                            sample_data.append(row_dict)
                        
                        # Get total count for this provider
                        total_count = self.conn.execute("SELECT COUNT(*) FROM vms WHERE provider = ?", [provider]).fetchone()[0]
                        
                        # Structure data to match frontend expectations
                        preview_data[provider] = {
                            'sample_data': sample_data,
                            'total_count': total_count
                        }
                        
                except Exception as e:
                    logger.error(f"Error previewing VMs for {provider}: {e}")
                    preview_data[provider] = {
                        'sample_data': [],
                        'total_count': 0,
                        'error': str(e)
                    }
            
            return preview_data
            
        except Exception as e:
            logger.error(f"Error previewing database data: {e}")
            return {
                "error": f"Failed to preview database data: {str(e)}",
                "total_vms": 0,
                "providers_count": 0
            }

    def close(self):
        """Close DuckDB connection"""
        if self.conn:
            self.conn.close()
            self.conn = None

# Global instance
duckdb_loader = DuckDBLoader()
