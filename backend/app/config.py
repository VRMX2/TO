from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "CyberGameGT API"
    debug: bool = False

    # When set, clients must send X-API-Key (empty = open dev mode)
    api_key: str = ""

    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
        ]
    )
    trusted_hosts: List[str] = Field(
        default_factory=lambda: ["localhost", "127.0.0.1", "backend", "cybergame-backend", "cybergame-backend-prod"]
    )

    groq_api_key: str = ""

    max_matrix_size: int = 12
    ai_rate_limit_per_minute: int = 20
    api_rate_limit_per_minute: int = 120
    ws_max_connections: int = 50
    ws_allowed_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
        ]
    )


settings = Settings()
