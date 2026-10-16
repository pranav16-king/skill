import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DPDP Form Auditor"
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # MongoDB settings
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "dpdp_auditor"
    mongodb_server_selection_timeout_ms: int = 1500

    # Local storage fallback path when MongoDB is offline
    local_storage_path: str = "backend/data/audits.json"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Resolve absolute path for local storage fallback
BASE_DIR = Path(__file__).resolve().parent.parent
if not os.path.isabs(settings.local_storage_path):
    LOCAL_STORAGE_ABS_PATH = BASE_DIR / settings.local_storage_path.replace("backend/", "")
else:
    LOCAL_STORAGE_ABS_PATH = Path(settings.local_storage_path)
