"""LLM catalog service.

Serves the cross-provider model catalog (loaded by ``llm_loader`` from a remote
aggregate) with in-memory filtering and sorting. The catalog is small and
changes rarely, so it is held in memory and refreshed only on explicit reload —
no database round-trips per request.
"""

from typing import Any, Dict, List, Optional
import logging

from ..database.llm_loader import llm_loader

logger = logging.getLogger(__name__)


class LLMCatalogService:
    def __init__(self):
        self._models: List[dict] = []
        self._loaded = False

    def load(self) -> int:
        """Load (fetch + normalize) the catalog via the loader and cache it."""
        self._models = llm_loader.load()
        self._loaded = True
        return len(self._models)

    def reload(self) -> int:
        """Force a re-fetch of the catalog from the source."""
        return self.load()

    def _ensure_loaded(self):
        if not self._loaded:
            self.load()

    def get_providers(self) -> List[str]:
        self._ensure_loaded()
        return sorted({m["provider"] for m in self._models})

    def get_models(
        self,
        providers: Optional[List[str]] = None,
        search: Optional[str] = None,
        min_context: Optional[int] = None,
        max_input_price: Optional[float] = None,
        vision_only: bool = False,
        sort_by: str = "input_price",
        sort_order: str = "asc",
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Return a (filtered, sorted, paginated) page plus total/filtered counts.

        ``filtered_count`` is the number of models matching the filters across
        all pages; ``models`` is just the requested ``offset``/``limit`` slice.
        """
        self._ensure_loaded()
        total_count = len(self._models)

        # None means "all providers"; an explicit (possibly empty) list filters.
        provider_set = set(providers) if providers is not None else None
        search_term = search.strip().lower() if search else None

        def matches(m: dict) -> bool:
            if provider_set is not None and m["provider"] not in provider_set:
                return False
            if search_term:
                haystack = " ".join(
                    str(m.get(k, "")) for k in ("model", "developer", "model_id")
                ).lower()
                if search_term not in haystack:
                    return False
            if min_context is not None and (m.get("context_tokens") or 0) < min_context:
                return False
            if max_input_price is not None:
                price = m.get("input_price")
                if price is None or price > max_input_price:
                    return False
            if vision_only and "vision" not in (m.get("modalities") or []):
                return False
            return True

        filtered = [m for m in self._models if matches(m)]

        reverse = sort_order == "desc"

        def value_key(m: dict):
            val = m.get(sort_by)
            if isinstance(val, str):
                return val.lower()
            if isinstance(val, (list, tuple)):
                return tuple(val)
            return val

        # Partition so rows missing the sort field always land last, in either
        # direction (a plain reverse= would flip a None sentinel to the top).
        present = [m for m in filtered if m.get(sort_by) is not None]
        missing = [m for m in filtered if m.get(sort_by) is None]
        present.sort(key=value_key, reverse=reverse)
        ordered = present + missing

        filtered_count = len(ordered)
        start = max(offset, 0)
        page = ordered[start:start + limit] if limit is not None else ordered[start:]

        return {
            "models": page,
            "total_count": total_count,
            "filtered_count": filtered_count,
        }


# Singleton used by the API layer.
llm_catalog_service = LLMCatalogService()
