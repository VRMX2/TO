from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "CyberGameGT API"
    debug: bool = True
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    # Optional — only needed for AI Report generation
    groq_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
