from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    app_env: str = Field("local", alias="APP_ENV")
    app_name: str = Field("ContelliSense Lite", alias="APP_NAME")
    app_log_level: str = Field("INFO", alias="APP_LOG_LEVEL")

    db_url: str = Field(..., alias="DB_URL")

    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-3.1-flash-lite", alias="GEMINI_MODEL")

    embeddings_model: str = Field(
        "sentence-transformers/all-MiniLM-L6-v2",
        alias="EMBEDDINGS_MODEL",
    )

    sentiment_model: str = Field(
        "cardiffnlp/twitter-roberta-base-sentiment-latest",
        alias="SENTIMENT_MODEL",
    )

    youtube_api_key: Optional[str] = Field(None, alias="YOUTUBE_API_KEY")


settings = AppSettings()