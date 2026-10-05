"""Envelope de erro e request id (SPEC §7.1) — sem banco."""

from fastapi import FastAPI, Query
from fastapi.testclient import TestClient

from app.core.errors import ConflictError


def _with_probe_routes(app: FastAPI) -> FastAPI:
    @app.get("/probe/conflict")
    def conflict() -> None:
        raise ConflictError("Já existe.", code="DUPLICATE_EMAIL", details=[{"field": "email"}])

    @app.get("/probe/boom")
    def boom() -> None:
        raise RuntimeError("segredo interno")

    @app.get("/probe/validate")
    def validate(n: int = Query(..., ge=1)) -> dict[str, int]:
        return {"n": n}

    return app


def test_app_error_envelope(app: FastAPI) -> None:
    client = TestClient(_with_probe_routes(app), raise_server_exceptions=False)
    response = client.get("/probe/conflict")
    assert response.status_code == 409
    assert response.json() == {
        "success": False,
        "error": {
            "code": "DUPLICATE_EMAIL",
            "message": "Já existe.",
            "details": [{"field": "email"}],
        },
    }


def test_validation_error_has_field_details(app: FastAPI) -> None:
    client = TestClient(_with_probe_routes(app), raise_server_exceptions=False)
    response = client.get("/probe/validate", params={"n": 0})
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["details"][0]["field"] == "n"


def test_unhandled_error_hides_internals(app: FastAPI) -> None:
    client = TestClient(_with_probe_routes(app), raise_server_exceptions=False)
    response = client.get("/probe/boom")
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "segredo" not in response.text
    request_id = response.headers["x-request-id"]
    assert response.json()["error"]["details"] == [{"request_id": request_id}]


def test_unknown_route_uses_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/nao-existe")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_request_id_is_generated(client: TestClient) -> None:
    response = client.get("/api/v1/nao-existe")
    assert len(response.headers["x-request-id"]) == 32


def test_request_id_is_propagated_when_safe(client: TestClient) -> None:
    response = client.get("/api/v1/nao-existe", headers={"X-Request-ID": "abc-123"})
    assert response.headers["x-request-id"] == "abc-123"


def test_request_id_is_replaced_when_unsafe(client: TestClient) -> None:
    response = client.get("/api/v1/nao-existe", headers={"X-Request-ID": "<script>"})
    assert response.headers["x-request-id"] != "<script>"
