from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "CyberGameGT API"
    debug: bool = True
    cors_origins: list = ["http://localhost:3000"]

settings = Settings()
