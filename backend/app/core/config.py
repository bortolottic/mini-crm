"""Configuração da aplicação (SPEC §13.2).

Tudo vem de variáveis de ambiente; nada sensível tem valor padrão utilizável em
produção. A validação acontece na importação: um `.env` incompleto derruba o
processo na subida com uma mensagem clara, e não na primeira requisição.
"""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

AppEnv = Literal["development", "test", "production"]

MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, case_sensitive=False, extra="ignore")

    app_env: AppEnv = "development"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://minicrm:minicrm@127.0.0.1:3434/minicrm"

    jwt_secret: str = ""
    jwt_access_ttl_minutes: int = Field(default=15, ge=1)
    jwt_refresh_ttl_days: int = Field(default=7, ge=1)
    cookie_secure: bool = False

    # Lista separada por vírgula no ambiente; vazia em produção (mesma origem via proxy).
    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)

    default_timezone: str = "America/Sao_Paulo"

    admin_name: str = "Administrador"
    admin_email: str = ""
    admin_password: str = ""

    ai_enabled: bool = False
    ai_api_url: str = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def _check_production(self) -> "Settings":
        if self.app_env == "production" and len(self.jwt_secret) < MIN_JWT_SECRET_LENGTH:
            raise ValueError(
                f"JWT_SECRET precisa de ao menos {MIN_JWT_SECRET_LENGTH} caracteres em production"
            )
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
