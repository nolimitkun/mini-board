"""Application settings and configuration"""

import os
from typing import Optional


class Settings:
    """Application settings"""
    
    # Database settings
    DB_PATH: str = os.getenv("DB_PATH", "vm_catalog.duckdb")
    DATA_DIR: str = os.getenv("DATA_DIR", "v7")
    
    # API settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # GitHub repository settings
    SKYPILOT_CATALOG_URL: str = "https://github.com/skypilot-org/skypilot-catalog/tree/master/catalogs/v7"
    
    # CORS settings
    CORS_ORIGINS: list = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]


# Global settings instance
settings = Settings()
