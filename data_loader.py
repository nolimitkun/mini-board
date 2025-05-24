import pandas as pd
import os
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class DataLoader:
    def __init__(self, data_dir: str = "v7"):
        self.data_dir = data_dir
        self.vms_data: Dict[str, pd.DataFrame] = {}
        self.images_data: Dict[str, pd.DataFrame] = {}
        self.providers: List[str] = []
        
    def load_all_data(self):
        """Load all VM and image data from CSV files"""
        try:
            # Get list of provider directories
            if not os.path.exists(self.data_dir):
                raise FileNotFoundError(f"Data directory {self.data_dir} not found")
            
            self.providers = [d for d in os.listdir(self.data_dir) 
                            if os.path.isdir(os.path.join(self.data_dir, d))]
            
            logger.info(f"Found providers: {self.providers}")
            
            # Load VM data for each provider
            for provider in self.providers:
                self._load_provider_data(provider)
                
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def _load_provider_data(self, provider: str):
        """Load data for a specific provider"""
        provider_dir = os.path.join(self.data_dir, provider)
        
        # Load VMs data
        vms_file = os.path.join(provider_dir, "vms.csv")
        if os.path.exists(vms_file):
            try:
                df = pd.read_csv(vms_file)
                # Standardize column names
                df = self._standardize_vm_columns(df, provider)
                self.vms_data[provider] = df
                logger.info(f"Loaded {len(df)} VMs for {provider}")
            except Exception as e:
                logger.error(f"Error loading VMs for {provider}: {e}")
        
        # Load images data
        images_file = os.path.join(provider_dir, "images.csv")
        if os.path.exists(images_file):
            try:
                df = pd.read_csv(images_file)
                self.images_data[provider] = df
                logger.info(f"Loaded {len(df)} images for {provider}")
            except Exception as e:
                logger.error(f"Error loading images for {provider}: {e}")
    
    def _standardize_vm_columns(self, df: pd.DataFrame, provider: str) -> pd.DataFrame:
        """Standardize column names across different providers"""
        # Create a copy to avoid modifying original
        df = df.copy()
        
        # Add provider column
        df['Provider'] = provider
        
        # Standardize column names (handle variations)
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
            'Generation': 'generation',
            'Provider': 'provider'
        }
        
        # Rename columns if they exist
        for old_name, new_name in column_mapping.items():
            if old_name in df.columns:
                df = df.rename(columns={old_name: new_name})
        
        # Ensure required columns exist with default values
        required_columns = {
            'accelerator_name': None,
            'accelerator_count': None,
            'gpu_info': None,
            'spot_price': None,
            'availability_zone': None,
            'generation': None
        }
        
        for col, default_value in required_columns.items():
            if col not in df.columns:
                df[col] = default_value
        
        # Convert numeric columns
        numeric_columns = ['vcpus', 'memory_gib', 'accelerator_count', 'price', 'spot_price']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df
    
    def get_all_vms(self) -> pd.DataFrame:
        """Get all VMs from all providers as a single DataFrame"""
        if not self.vms_data:
            self.load_all_data()
        
        all_vms = []
        for provider, df in self.vms_data.items():
            all_vms.append(df)
        
        if all_vms:
            return pd.concat(all_vms, ignore_index=True)
        else:
            return pd.DataFrame()
    
    def get_provider_vms(self, provider: str) -> pd.DataFrame:
        """Get VMs for a specific provider"""
        if provider not in self.vms_data:
            return pd.DataFrame()
        return self.vms_data[provider]
    
    def get_providers(self) -> List[str]:
        """Get list of available providers"""
        if not self.providers:
            self.load_all_data()
        return self.providers
    
    def get_regions(self, provider: str = None) -> List[str]:
        """Get available regions, optionally filtered by provider"""
        if not self.vms_data:
            self.load_all_data()
        
        if provider:
            if provider in self.vms_data:
                return sorted(self.vms_data[provider]['region'].dropna().unique().tolist())
            else:
                return []
        else:
            all_regions = set()
            for df in self.vms_data.values():
                all_regions.update(df['region'].dropna().unique())
            return sorted(list(all_regions))

# Global instance
data_loader = DataLoader()
