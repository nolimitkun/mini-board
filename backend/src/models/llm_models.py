"""LLM-catalog data models"""

from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class LLMSortBy(str, Enum):
    provider = "provider"
    model = "model"
    developer = "developer"
    context_tokens = "context_tokens"
    input_price = "input_price"
    output_price = "output_price"
    modalities = "modalities"


class LLMModel(BaseModel):
    # `model` / `model_id` fields collide with Pydantic's protected "model_"
    # namespace; we intentionally use those names, so disable the guard.
    model_config = {"protected_namespaces": ()}

    provider: str
    platform: str
    model: str
    model_id: str
    developer: str
    context_tokens: Optional[int] = None
    max_output_tokens: Optional[int] = None
    input_price: Optional[float] = None
    output_price: Optional[float] = None
    modalities: List[str] = []
    docs: Optional[str] = None
