import pandas as pd
from typing import List, Optional, Dict, Any
from ..models import VM
from ..database.duckdb_loader import duckdb_loader
import logging

logger = logging.getLogger(__name__)

class DuckDBVMService:
    def __init__(self):
        self.db_loader = duckdb_loader
    
    def get_vms(self, 
                providers: Optional[List[str]] = None,
                min_vcpus: Optional[float] = None,
                max_vcpus: Optional[float] = None,
                min_memory: Optional[float] = None,
                max_memory: Optional[float] = None,
                has_gpu: Optional[bool] = None,
                gpu_name: Optional[str] = None,
                region: Optional[str] = None,
                max_price: Optional[float] = None,
                hide_incomplete: bool = True,
                sort_by: str = "price",
                sort_order: str = "asc",
                limit: int = 100) -> Dict[str, Any]:
        """Get filtered and sorted VMs using DuckDB"""

        # Get total count first
        total_count = self._get_total_count()

        # Query VMs with filters
        df = self.db_loader.query_vms(
            providers=providers,
            min_vcpus=min_vcpus,
            max_vcpus=max_vcpus,
            min_memory=min_memory,
            max_memory=max_memory,
            has_gpu=has_gpu,
            gpu_name=gpu_name,
            region=region,
            max_price=max_price,
            hide_incomplete=hide_incomplete,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit
        )

        if df.empty:
            return {"vms": [], "total_count": total_count, "filtered_count": 0}

        # Get filtered count (without limit)
        filtered_count = self._get_filtered_count(
            providers=providers,
            min_vcpus=min_vcpus,
            max_vcpus=max_vcpus,
            min_memory=min_memory,
            max_memory=max_memory,
            has_gpu=has_gpu,
            gpu_name=gpu_name,
            region=region,
            max_price=max_price,
            hide_incomplete=hide_incomplete
        )
        
        # Convert to VM models
        vms = self._dataframe_to_vms(df)
        
        return {
            "vms": vms,
            "total_count": total_count,
            "filtered_count": filtered_count
        }
    
    def _get_total_count(self) -> int:
        """Get total VM count"""
        try:
            result = self.db_loader.conn.execute("SELECT COUNT(*) FROM vms").fetchone()
            return result[0] if result else 0
        except Exception as e:
            logger.error(f"Error getting total count: {e}")
            return 0
    
    def _get_filtered_count(self, **filters) -> int:
        """Get count of VMs matching filters"""
        try:
            # Build WHERE clause similar to query_vms but just for counting
            where_conditions = []
            params = []
            
            providers = filters.get('providers')
            if providers:
                placeholders = ','.join(['?' for _ in providers])
                where_conditions.append(f"provider IN ({placeholders})")
                params.extend(providers)
            
            for field, db_field in [
                ('min_vcpus', 'vcpus'), ('max_vcpus', 'vcpus'),
                ('min_memory', 'memory_gib'), ('max_memory', 'memory_gib'),
                ('max_price', 'price')
            ]:
                value = filters.get(field)
                if value is not None:
                    operator = '>=' if 'min_' in field else '<='
                    where_conditions.append(f"{db_field} {operator} ?")
                    params.append(value)
            
            has_gpu = filters.get('has_gpu')
            if has_gpu is not None:
                if has_gpu:
                    where_conditions.append("accelerator_name IS NOT NULL")
                else:
                    where_conditions.append("accelerator_name IS NULL")
            
            gpu_name = filters.get('gpu_name')
            if gpu_name:
                where_conditions.append("accelerator_name ILIKE ?")
                params.append(f'%{gpu_name}%')
            
            region = filters.get('region')
            if region:
                where_conditions.append("region = ?")
                params.append(region)

            if filters.get('hide_incomplete'):
                where_conditions.append("price IS NOT NULL AND price > 0")

            # Build SQL
            sql = "SELECT COUNT(*) FROM vms"
            if where_conditions:
                sql += " WHERE " + " AND ".join(where_conditions)
            
            result = self.db_loader.conn.execute(sql, params).fetchone()
            return result[0] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting filtered count: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the VM catalog"""
        return self.db_loader.get_stats()
    
    def _dataframe_to_vms(self, df: pd.DataFrame) -> List[VM]:
        """Convert DataFrame to list of VM models"""
        vms = []
        for _, row in df.iterrows():
            vm = self._row_to_vm(row)
            vms.append(vm)
        return vms
    
    def _row_to_vm(self, row: pd.Series) -> VM:
        """Convert DataFrame row to VM model"""
        # Missing values stay None instead of being coerced to "nan"/0 so the UI
        # can render them as "N/A" / "—". A price of 0 in the catalog means
        # "no pricing available" (cloud VMs are never free), so treat it as unknown.
        price = float(row['price']) if pd.notna(row['price']) else None
        if price is not None and price <= 0:
            price = None
        spot_price = float(row['spot_price']) if pd.notna(row['spot_price']) else None
        if spot_price is not None and spot_price <= 0:
            spot_price = None
        return VM(
            provider=row['provider'],
            instance_type=row['instance_type'] if pd.notna(row['instance_type']) else None,
            vcpus=float(row['vcpus']) if pd.notna(row['vcpus']) else None,
            memory_gib=float(row['memory_gib']) if pd.notna(row['memory_gib']) else None,
            accelerator_name=row['accelerator_name'] if pd.notna(row['accelerator_name']) else None,
            accelerator_count=float(row['accelerator_count']) if pd.notna(row['accelerator_count']) else None,
            gpu_info=row['gpu_info'] if pd.notna(row['gpu_info']) else None,
            price=price,
            spot_price=spot_price,
            region=row['region'] if pd.notna(row['region']) else None,
            availability_zone=row['availability_zone'] if pd.notna(row['availability_zone']) else None,
            generation=row['generation'] if pd.notna(row['generation']) else None
        )

# Global instance
duckdb_vm_service = DuckDBVMService()
