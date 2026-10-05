import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.db


def test_health_reports_db_ok(db_client: TestClient) -> None:
    response = db_client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["data"] == {"status": "ok", "db": "ok", "version": "0.1.0"}


def test_ready_when_migrations_applied(db_client: TestClient) -> None:
    response = db_client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ready"


def test_openapi_is_served(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "MINI-CRM API"
