"""API response models"""

from pydantic import BaseModel
from typing import List
from .vm_models import VM, PriceRange
from .llm_models import LLMModel


class ProvidersResponse(BaseModel):
    providers: List[str]


class VMsResponse(BaseModel):
    vms: List[VM]
    total_count: int
    filtered_count: int


class RegionsResponse(BaseModel):
    regions: List[str]


class StatsResponse(BaseModel):
    total_vms: int
    providers_count: int
    gpu_instances_count: int
    regions_count: int
    price_range: PriceRange


class LLMProvidersResponse(BaseModel):
    providers: List[str]


class LLMModelsResponse(BaseModel):
    models: List[LLMModel]
    total_count: int
    filtered_count: int
