"""集中式配置：全部从环境变量 / .env 读取（pydantic-settings）。"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- 应用 ----
    app_name: str = "mydaily-api"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # ---- 数据库 ----
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/mydaily"
    )

    # ---- JWT ----
    jwt_access_secret: str = "dev-access-secret-change-me-0123456789abcdef"
    jwt_refresh_secret: str = "dev-refresh-secret-change-me-0123456789abcdef"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # ---- Cookie ----
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    # ---- CORS ----
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"

    # ---- 上传（本地降级）----
    upload_dir: str = "public/uploads"
    max_upload_size_mb: int = 5

    # ---- Cloudflare R2（可选）----
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None
    r2_public_base_url: str | None = None
    r2_presign_expire_seconds: int = 3600

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return origins or ["*"]

    @property
    def r2_enabled(self) -> bool:
        """四项 R2 配置齐备才算启用。"""
        return bool(
            self.r2_account_id
            and self.r2_access_key_id
            and self.r2_secret_access_key
            and self.r2_bucket_name
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
