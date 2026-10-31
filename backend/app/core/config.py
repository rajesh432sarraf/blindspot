import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    GEMINI_API_KEY: str = Field(default="", description="Gemini API Key from Google AI Studio")
    LLM_MODEL: str = Field(default="gemini-3.1-flash-lite", description="Model name available in AI Studio")
    FRONTEND_ORIGIN: str = Field(default="http://localhost:5173", description="Frontend origin for CORS")
    HOST: str = Field(default="127.0.0.1", description="Backend host")
    PORT: int = Field(default=8000, description="Backend port")
    MAX_SOURCES: int = Field(default=10, description="Max allowed sources per request")
    REQUEST_TIMEOUT_SECONDS: float = Field(default=15.0, description="HTTP timeout for fetching sources")
    MAX_CONTENT_BYTES: int = Field(default=2 * 1024 * 1024, description="Max response size in bytes (2MB)")
    MAX_TEXT_PER_SOURCE: int = Field(default=12000, description="Max extracted characters per source")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

