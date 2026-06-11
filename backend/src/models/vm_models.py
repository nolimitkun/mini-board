"""VM-related data models"""

from pydantic import BaseModel
from typing import Optional, List
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
    # The following may be missing in the source catalog (notably GCP, which
    # splits machine specs and GPU accelerators into separate rows), so they are
    # optional and surface as null rather than being coerced to "nan"/0.
    instance_type: Optional[str] = None
    vcpus: Optional[float] = None
    memory_gib: Optional[float] = None
    accelerator_name: Optional[str] = None
    accelerator_count: Optional[float] = None
    gpu_info: Optional[str] = None
    price: Optional[float] = None
    spot_price: Optional[float] = None
    region: Optional[str] = None
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
