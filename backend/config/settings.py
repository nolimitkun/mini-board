"""Application settings and configuration"""

import os


class Settings:
    """Application settings"""

    # Database settings
    DB_PATH: str = os.getenv("DB_PATH", "vm_catalog.duckdb")
    DATA_DIR: str = os.getenv("DATA_DIR", "v8")

    # API settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # GitHub repository settings
    SKYPILOT_CATALOG_URL: str = "https://github.com/skypilot-org/skypilot-catalog/tree/master/catalogs/v8"

    # CORS settings. Comma-separated origins, or "*" for any origin.
    CORS_ORIGINS: list = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    ]
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]

    @property
    def CORS_ALLOW_CREDENTIALS(self) -> bool:
        # The CORS spec forbids credentials with a wildcard origin; browsers
        # reject such responses, so only allow credentials with explicit origins.
        return "*" not in self.CORS_ORIGINS


# Global settings instance
settings = Settings()
