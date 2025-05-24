from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"

class SortBy(str, Enum):
    price = "price"
    spot_price = "spot_price"
    vcpus = "vcpus"
    memory = "memory"
    gpu_count = "gpu_count"

class WorkloadType(str, Enum):
    compute = "compute"
    memory = "memory"
    gpu = "gpu"
    balanced = "balanced"

class VM(BaseModel):
    provider: str
    instance_type: str
    vcpus: float
    memory_gib: float
    accelerator_name: Optional[str] = None
    accelerator_count: Optional[float] = None
    gpu_info: Optional[str] = None
    price: float
    spot_price: Optional[float] = None
    region: str
    availability_zone: Optional[str] = None
    generation: Optional[str] = None

class VMCompareRequest(BaseModel):
    provider: str
    instance_type: str
    region: str

class CompareRequest(BaseModel):
    vms: List[VMCompareRequest]

class Requirements(BaseModel):
    min_vcpus: Optional[float] = None
    min_memory: Optional[float] = None
    gpu_required: Optional[bool] = False
    max_budget: Optional[float] = None
    preferred_regions: Optional[List[str]] = None
    workload_type: Optional[WorkloadType] = WorkloadType.balanced

class RecommendationRequest(BaseModel):
    requirements: Requirements

class VMRecommendation(VM):
    score: float
    reasoning: str

class PriceRange(BaseModel):
    min: float
    max: float
    avg: float

class ComparisonSummary(BaseModel):
    cheapest: VM
    most_powerful: VM
    best_value: VM
    price_difference: PriceRange

class ProvidersResponse(BaseModel):
    providers: List[str]

class VMsResponse(BaseModel):
    vms: List[VM]
    total_count: int
    filtered_count: int

class CompareResponse(BaseModel):
    comparison: List[VM]
    summary: ComparisonSummary

class RecommendationResponse(BaseModel):
    recommendations: List[VMRecommendation]

class RegionsResponse(BaseModel):
    regions: List[str]

class StatsResponse(BaseModel):
    total_vms: int
    providers_count: int
    gpu_instances_count: int
    regions_count: int
    price_range: PriceRange
