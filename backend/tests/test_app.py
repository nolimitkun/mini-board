"""Hermetic tests for API wiring and settings.

These avoid loading catalog data or touching the network: importing the app
only registers routes (data load happens in the lifespan handler), and the
CORS tests exercise pure settings logic.
"""

import importlib

from fastapi.routing import APIRoute

from src.api.main import app


def _route_paths():
    return {r.path for r in app.routes if isinstance(r, APIRoute)}


def test_core_routes_present():
    paths = _route_paths()
    for path in ["/", "/providers", "/vms", "/regions", "/stats",
                 "/preview", "/reload", "/health"]:
        assert path in paths, f"missing route {path}"


def test_removed_feature_routes_absent():
    # The Compare/Recommendations feature was removed; guard against regressions.
    paths = _route_paths()
    assert "/vms/compare" not in paths
    assert "/vms/recommendations" not in paths


def _reload_settings(monkeypatch, origins):
    monkeypatch.setenv("CORS_ORIGINS", origins)
    import config.settings as settings_module
    importlib.reload(settings_module)
    return settings_module.settings


def test_cors_wildcard_disables_credentials(monkeypatch):
    settings = _reload_settings(monkeypatch, "*")
    assert settings.CORS_ORIGINS == ["*"]
    # The CORS spec forbids credentials with a wildcard origin.
    assert settings.CORS_ALLOW_CREDENTIALS is False


def test_cors_explicit_origins_enable_credentials(monkeypatch):
    settings = _reload_settings(
        monkeypatch, "http://localhost:3000,https://app.example.com"
    )
    assert settings.CORS_ORIGINS == [
        "http://localhost:3000",
        "https://app.example.com",
    ]
    assert settings.CORS_ALLOW_CREDENTIALS is True
