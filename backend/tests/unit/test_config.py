import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_cors_origins_from_comma_separated_string() -> None:
    settings = Settings(cors_origins="http://a.test, http://b.test,")  # type: ignore[arg-type]
    assert settings.cors_origins == ["http://a.test", "http://b.test"]


def test_production_requires_strong_jwt_secret() -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(app_env="production", jwt_secret="curto")


def test_production_accepts_long_secret() -> None:
    settings = Settings(app_env="production", jwt_secret="x" * 32)
    assert settings.is_production


def test_development_allows_empty_secret() -> None:
    assert Settings(app_env="development", jwt_secret="").jwt_secret == ""
