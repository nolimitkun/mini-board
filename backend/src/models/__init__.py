"""Data models for the Cloud VM Comparison API"""

from .vm_models import (
    VM,
    VMCompareRequest,
    CompareRequest,
    Requirements,
    RecommendationRequest,
    VMRecommendation,
    PriceRange,
    ComparisonSummary,
    SortOrder,
    SortBy,
    WorkloadType
)

from .response_models import (
    ProvidersResponse,
    VMsResponse,
    CompareResponse,
    RecommendationResponse,
    RegionsResponse,
    StatsResponse
)

__all__ = [
    "VM",
    "VMCompareRequest", 
    "CompareRequest",
    "Requirements",
    "RecommendationRequest",
    "VMRecommendation",
    "PriceRange",
    "ComparisonSummary",
    "SortOrder",
    "SortBy",
    "WorkloadType",
    "ProvidersResponse",
    "VMsResponse",
    "CompareResponse",
    "RecommendationResponse",
    "RegionsResponse",
    "StatsResponse"
]
