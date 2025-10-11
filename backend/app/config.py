from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://stock:stockpass@db:5432/stockdb"
    SECRET_KEY: str = "change-me"
    CORS_ORIGINS: str = "http://localhost:5173"
    LOG_LEVEL: str = "info"

    class Config:
        env_file = ".env.backend"
        extra = "ignore"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
