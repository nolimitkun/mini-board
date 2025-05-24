import pandas as pd
from typing import List, Optional, Dict, Any
from models import VM, VMRecommendation, ComparisonSummary, PriceRange, Requirements, WorkloadType
from duckdb_loader import duckdb_loader
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
            max_price=max_price
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
            
            # Build SQL
            sql = "SELECT COUNT(*) FROM vms"
            if where_conditions:
                sql += " WHERE " + " AND ".join(where_conditions)
            
            result = self.db_loader.conn.execute(sql, params).fetchone()
            return result[0] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting filtered count: {e}")
            return 0
    
    def compare_vms(self, vm_requests: List[Dict[str, str]]) -> Dict[str, Any]:
        """Compare specific VMs"""
        vms = []
        
        for req in vm_requests:
            provider = req['provider']
            instance_type = req['instance_type']
            region = req['region']
            
            df = self.db_loader.get_vm_by_details(provider, instance_type, region)
            if not df.empty:
                vm = self._dataframe_to_vms(df)[0]
                vms.append(vm)
        
        if not vms:
            return {"comparison": [], "summary": None}
        
        # Generate comparison summary
        summary = self._generate_comparison_summary(vms)
        
        return {
            "comparison": vms,
            "summary": summary
        }
    
    def get_recommendations(self, requirements: Requirements) -> List[VMRecommendation]:
        """Get VM recommendations based on requirements using SQL"""
        try:
            # Build SQL query for recommendations
            where_conditions = []
            params = []
            
            # Apply hard filters
            if requirements.min_vcpus:
                where_conditions.append("vcpus >= ?")
                params.append(requirements.min_vcpus)
            
            if requirements.min_memory:
                where_conditions.append("memory_gib >= ?")
                params.append(requirements.min_memory)
            
            if requirements.gpu_required:
                where_conditions.append("accelerator_name IS NOT NULL")
            
            if requirements.max_budget:
                where_conditions.append("price <= ?")
                params.append(requirements.max_budget)
            
            if requirements.preferred_regions:
                placeholders = ','.join(['?' for _ in requirements.preferred_regions])
                where_conditions.append(f"region IN ({placeholders})")
                params.extend(requirements.preferred_regions)
            
            # Build base SQL
            sql = "SELECT *, "
            
            # Calculate score based on workload type
            workload_type = requirements.workload_type or WorkloadType.balanced
            
            if workload_type == WorkloadType.compute:
                sql += "vcpus * 10 / (price + 0.01) as raw_score"
            elif workload_type == WorkloadType.memory:
                sql += "memory_gib * 5 / (price + 0.01) as raw_score"
            elif workload_type == WorkloadType.gpu:
                sql += "COALESCE(accelerator_count, 0) * 50 / (price + 0.01) as raw_score"
            else:  # balanced
                sql += "(vcpus * 5 + memory_gib * 2 + COALESCE(accelerator_count, 0) * 20) / (price + 0.01) as raw_score"
            
            sql += " FROM vms"
            
            if where_conditions:
                sql += " WHERE " + " AND ".join(where_conditions)
            
            sql += " ORDER BY raw_score DESC LIMIT 10"
            
            # Execute query
            df = self.db_loader.conn.execute(sql, params).df()
            
            if df.empty:
                return []
            
            # Normalize scores to 0-100 range
            max_score = df['raw_score'].max()
            if max_score > 0:
                df['score'] = (df['raw_score'] / max_score) * 100
            else:
                df['score'] = 0
            
            # Add reasoning based on workload type
            if workload_type == WorkloadType.compute:
                df['reasoning'] = "Optimized for compute-intensive workloads"
            elif workload_type == WorkloadType.memory:
                df['reasoning'] = "Optimized for memory-intensive workloads"
            elif workload_type == WorkloadType.gpu:
                df['reasoning'] = df.apply(
                    lambda row: "Optimized for GPU workloads" if pd.notna(row['accelerator_name']) else "No GPU available",
                    axis=1
                )
            else:
                df['reasoning'] = "Balanced performance across CPU, memory, and GPU"
            
            # Convert to recommendations
            recommendations = []
            for _, row in df.iterrows():
                vm = self._row_to_vm(row)
                recommendation = VMRecommendation(
                    **vm.dict(),
                    score=float(row['score']),
                    reasoning=row['reasoning']
                )
                recommendations.append(recommendation)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
    
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
        return VM(
            provider=row['provider'],
            instance_type=row['instance_type'],
            vcpus=float(row['vcpus']) if pd.notna(row['vcpus']) else 0.0,
            memory_gib=float(row['memory_gib']) if pd.notna(row['memory_gib']) else 0.0,
            accelerator_name=row['accelerator_name'] if pd.notna(row['accelerator_name']) else None,
            accelerator_count=float(row['accelerator_count']) if pd.notna(row['accelerator_count']) else None,
            gpu_info=row['gpu_info'] if pd.notna(row['gpu_info']) else None,
            price=float(row['price']) if pd.notna(row['price']) else 0.0,
            spot_price=float(row['spot_price']) if pd.notna(row['spot_price']) else None,
            region=row['region'],
            availability_zone=row['availability_zone'] if pd.notna(row['availability_zone']) else None,
            generation=row['generation'] if pd.notna(row['generation']) else None
        )
    
    def _generate_comparison_summary(self, vms: List[VM]) -> ComparisonSummary:
        """Generate comparison summary for a list of VMs"""
        if not vms:
            return None
        
        # Find cheapest
        cheapest = min(vms, key=lambda x: x.price)
        
        # Find most powerful (by vCPUs + memory + GPU count)
        def power_score(vm):
            gpu_score = (vm.accelerator_count or 0) * 10  # Weight GPU heavily
            return vm.vcpus + (vm.memory_gib / 4) + gpu_score
        
        most_powerful = max(vms, key=power_score)
        
        # Find best value (power per dollar)
        def value_score(vm):
            if vm.price == 0:
                return 0
            return power_score(vm) / vm.price
        
        best_value = max(vms, key=value_score)
        
        # Price statistics
        prices = [vm.price for vm in vms]
        price_range = PriceRange(
            min=min(prices),
            max=max(prices),
            avg=sum(prices) / len(prices)
        )
        
        return ComparisonSummary(
            cheapest=cheapest,
            most_powerful=most_powerful,
            best_value=best_value,
            price_difference=price_range
        )

# Global instance
duckdb_vm_service = DuckDBVMService()
