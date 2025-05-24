import pandas as pd
from typing import List, Optional, Dict, Any
from models import VM, VMRecommendation, ComparisonSummary, PriceRange, Requirements, WorkloadType
from data_loader import data_loader
import logging

logger = logging.getLogger(__name__)

class VMService:
    def __init__(self):
        self.data_loader = data_loader
    
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
        """Get filtered and sorted VMs"""
        
        # Get all VMs
        df = self.data_loader.get_all_vms()
        
        if df.empty:
            return {"vms": [], "total_count": 0, "filtered_count": 0}
        
        total_count = len(df)
        
        # Apply filters
        if providers:
            df = df[df['provider'].isin(providers)]
        
        if min_vcpus is not None:
            df = df[df['vcpus'] >= min_vcpus]
        
        if max_vcpus is not None:
            df = df[df['vcpus'] <= max_vcpus]
        
        if min_memory is not None:
            df = df[df['memory_gib'] >= min_memory]
        
        if max_memory is not None:
            df = df[df['memory_gib'] <= max_memory]
        
        if has_gpu is not None:
            if has_gpu:
                df = df[df['accelerator_name'].notna()]
            else:
                df = df[df['accelerator_name'].isna()]
        
        if gpu_name:
            df = df[df['accelerator_name'].str.contains(gpu_name, case=False, na=False)]
        
        if region:
            df = df[df['region'] == region]
        
        if max_price is not None:
            df = df[df['price'] <= max_price]
        
        filtered_count = len(df)
        
        # Sort
        if sort_by in df.columns:
            ascending = sort_order == "asc"
            df = df.sort_values(by=sort_by, ascending=ascending)
        
        # Limit results
        df = df.head(limit)
        
        # Convert to VM models
        vms = self._dataframe_to_vms(df)
        
        return {
            "vms": vms,
            "total_count": total_count,
            "filtered_count": filtered_count
        }
    
    def compare_vms(self, vm_requests: List[Dict[str, str]]) -> Dict[str, Any]:
        """Compare specific VMs"""
        vms = []
        
        for req in vm_requests:
            provider = req['provider']
            instance_type = req['instance_type']
            region = req['region']
            
            df = self.data_loader.get_provider_vms(provider)
            if not df.empty:
                vm_df = df[
                    (df['instance_type'] == instance_type) & 
                    (df['region'] == region)
                ]
                if not vm_df.empty:
                    vm = self._dataframe_to_vms(vm_df.head(1))[0]
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
        """Get VM recommendations based on requirements"""
        df = self.data_loader.get_all_vms()
        
        if df.empty:
            return []
        
        # Apply hard filters
        if requirements.min_vcpus:
            df = df[df['vcpus'] >= requirements.min_vcpus]
        
        if requirements.min_memory:
            df = df[df['memory_gib'] >= requirements.min_memory]
        
        if requirements.gpu_required:
            df = df[df['accelerator_name'].notna()]
        
        if requirements.max_budget:
            df = df[df['price'] <= requirements.max_budget]
        
        if requirements.preferred_regions:
            df = df[df['region'].isin(requirements.preferred_regions)]
        
        if df.empty:
            return []
        
        # Calculate scores based on workload type
        df = self._calculate_recommendation_scores(df, requirements)
        
        # Sort by score and take top 10
        df = df.sort_values('score', ascending=False).head(10)
        
        # Convert to recommendations
        recommendations = []
        for _, row in df.iterrows():
            vm = self._row_to_vm(row)
            recommendation = VMRecommendation(
                **vm.dict(),
                score=row['score'],
                reasoning=row['reasoning']
            )
            recommendations.append(recommendation)
        
        return recommendations
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the VM catalog"""
        df = self.data_loader.get_all_vms()
        
        if df.empty:
            return {
                "total_vms": 0,
                "providers_count": 0,
                "gpu_instances_count": 0,
                "regions_count": 0,
                "price_range": {"min": 0, "max": 0, "avg": 0}
            }
        
        gpu_count = len(df[df['accelerator_name'].notna()])
        providers_count = df['provider'].nunique()
        regions_count = df['region'].nunique()
        
        price_stats = df['price'].describe()
        
        return {
            "total_vms": len(df),
            "providers_count": providers_count,
            "gpu_instances_count": gpu_count,
            "regions_count": regions_count,
            "price_range": {
                "min": float(price_stats['min']),
                "max": float(price_stats['max']),
                "avg": float(price_stats['mean'])
            }
        }
    
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
    
    def _calculate_recommendation_scores(self, df: pd.DataFrame, requirements: Requirements) -> pd.DataFrame:
        """Calculate recommendation scores based on workload type"""
        df = df.copy()
        
        # Initialize score
        df['score'] = 0.0
        df['reasoning'] = ""
        
        workload_type = requirements.workload_type or WorkloadType.balanced
        
        if workload_type == WorkloadType.compute:
            # Prioritize CPU performance
            df['score'] = df['vcpus'] * 10
            df['reasoning'] = "Optimized for compute-intensive workloads"
            
        elif workload_type == WorkloadType.memory:
            # Prioritize memory
            df['score'] = df['memory_gib'] * 5
            df['reasoning'] = "Optimized for memory-intensive workloads"
            
        elif workload_type == WorkloadType.gpu:
            # Prioritize GPU
            df['score'] = df['accelerator_count'].fillna(0) * 50
            df.loc[df['accelerator_name'].notna(), 'reasoning'] = "Optimized for GPU workloads"
            df.loc[df['accelerator_name'].isna(), 'reasoning'] = "No GPU available"
            
        else:  # balanced
            # Balanced scoring
            cpu_score = df['vcpus'] * 5
            memory_score = df['memory_gib'] * 2
            gpu_score = df['accelerator_count'].fillna(0) * 20
            df['score'] = cpu_score + memory_score + gpu_score
            df['reasoning'] = "Balanced performance across CPU, memory, and GPU"
        
        # Adjust score based on price (value for money)
        price_factor = 1 / (df['price'] + 0.01)  # Avoid division by zero
        df['score'] = df['score'] * price_factor
        
        # Normalize scores to 0-100 range
        if df['score'].max() > 0:
            df['score'] = (df['score'] / df['score'].max()) * 100
        
        return df

# Global instance
vm_service = VMService()
