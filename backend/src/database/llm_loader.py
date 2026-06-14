"""LLM model catalog loader.

Fetches model metadata (context windows, token pricing, modalities) for cloud
providers from the openly-available models.dev aggregate and normalizes it into
the catalog rows the API serves. This mirrors ``duckdb_loader`` (which downloads
the VM catalog from GitHub): a remote source of truth, fetched on startup, with
a local JSON cache so the API still serves data if the source is unreachable.

models.dev groups models under the provider you consume them through and exposes
per-million-token pricing and modality info without requiring API keys, which is
exactly the cross-provider comparison this page needs. Per-token pricing is not
available from the providers' own ``/models`` endpoints, so an aggregate is the
practical source.
"""

import json
import os
import requests
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)


class LLMLoader:
    # Aggregated, key-free model + pricing data across providers.
    SOURCE_URL = "https://models.dev/api.json"

    # Keyword -> developer (the org that built the model). models.dev groups by
    # serving provider, not creator, so we infer the creator from the model id.
    _DEVELOPER_KEYWORDS: List[Tuple[Tuple[str, ...], str]] = [
        (("claude",), "Anthropic"),
        (("gpt", "chatgpt", "davinci", "o1-", "o3", "o4-"), "OpenAI"),
        (("gemini", "gemma", "palm"), "Google"),
        (("llama",), "Meta"),
        (("qwen", "qwq"), "Alibaba"),
        (("mistral", "mixtral", "pixtral", "codestral", "ministral", "magistral", "devstral"), "Mistral AI"),
        (("command", "cohere", "aya"), "Cohere"),
        (("grok",), "xAI"),
        (("deepseek",), "DeepSeek"),
        (("granite",), "IBM"),
        (("nova", "titan"), "Amazon"),
        (("sonar",), "Perplexity"),
        (("phi",), "Microsoft"),
        (("jamba",), "AI21"),
    ]

    def __init__(self, cache_path: str = "llm_models_cache.json"):
        self.cache_path = cache_path
        self.models: List[dict] = []

    # ------------------------------------------------------------------ fetch
    def _fetch_raw(self) -> dict:
        """Fetch the aggregate from the remote source, falling back to cache."""
        try:
            resp = requests.get(self.SOURCE_URL, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            try:
                with open(self.cache_path, "w") as f:
                    json.dump(data, f)
            except OSError as e:
                logger.warning("Could not write LLM cache %s: %s", self.cache_path, e)
            return data
        except Exception as e:
            logger.warning("Remote LLM fetch failed (%s); trying local cache", e)
            if os.path.exists(self.cache_path):
                with open(self.cache_path) as f:
                    return json.load(f)
            raise

    # -------------------------------------------------------------- normalize
    @classmethod
    def _infer_developer(cls, text: str, provider_name: str) -> str:
        low = text.lower()
        for keywords, developer in cls._DEVELOPER_KEYWORDS:
            if any(k in low for k in keywords):
                return developer
        # Fall back to the serving provider's display name.
        return provider_name

    # models.dev input modality -> our label. "image" is renamed to "vision";
    # everything else (text, audio, pdf, video, ...) is preserved as-is so
    # multimodal capabilities aren't silently dropped.
    _MODALITY_LABELS = {"image": "vision"}

    @classmethod
    def _modalities(cls, model: dict) -> List[str]:
        inputs = (model.get("modalities") or {}).get("input") or []
        mods: List[str] = []
        for m in inputs:
            label = cls._MODALITY_LABELS.get(m, m)
            if label not in mods:
                mods.append(label)
        # Ensure text leads the list when present (chat models always have it).
        if "text" in mods and mods[0] != "text":
            mods.remove("text")
            mods.insert(0, "text")
        return mods

    def _normalize(self, data: dict) -> List[dict]:
        """Flatten every provider and every model in the feed into catalog rows.

        The provider code is the models.dev slug and the platform is the
        provider's display name; nothing is filtered out. Missing pricing /
        limits surface as null rather than dropping the row.
        """
        rows: List[dict] = []
        for slug, provider in data.items():
            if not isinstance(provider, dict):
                continue
            models = provider.get("models")
            if not isinstance(models, dict):
                continue
            provider_name = provider.get("name") or slug
            docs = provider.get("doc")
            for model_id, model in models.items():
                if not isinstance(model, dict):
                    continue
                cost = model.get("cost") or {}
                limit = model.get("limit") or {}
                name = model.get("name") or model_id
                rows.append({
                    "provider": slug,
                    "platform": provider_name,
                    "model": name,
                    "model_id": model_id,
                    "developer": self._infer_developer(f"{model_id} {name}", provider_name),
                    "context_tokens": limit.get("context"),
                    "max_output_tokens": limit.get("output"),
                    "input_price": cost.get("input"),
                    "output_price": cost.get("output"),
                    "modalities": self._modalities(model),
                    "docs": docs,
                })
        return rows

    # ------------------------------------------------------------------- load
    def load(self) -> List[dict]:
        """Fetch + normalize the catalog and cache it in memory."""
        self.models = self._normalize(self._fetch_raw())
        logger.info(
            "Loaded %d LLM models across %d providers from %s",
            len(self.models),
            len({m["provider"] for m in self.models}),
            self.SOURCE_URL,
        )
        return self.models


# Singleton used by the service layer.
llm_loader = LLMLoader()
