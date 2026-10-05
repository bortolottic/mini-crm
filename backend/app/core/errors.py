"""Erros da aplicação e o envelope de resposta de erro (SPEC §7.1).

Toda exceção que sai da API vira:

    {"success": false, "error": {"code", "message", "details"}}

`code` é estável (inglês, SNAKE_UPPER) e é o que o frontend usa para decidir;
`message` é pt-BR e é o que a pessoa lê.
"""

from typing import Any, cast

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = structlog.get_logger(__name__)


class AppError(Exception):
    """Erro de negócio ou de aplicação com código estável."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "BAD_REQUEST"
    message: str = "Requisição inválida."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        status_code: int | None = None,
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        self.message = message or self.message
        self.code = code or self.code
        self.status_code = status_code or self.status_code
        self.details = details or []
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"
    message = "Recurso não encontrado."


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "CONFLICT"
    message = "Conflito com o estado atual do recurso."


class BusinessRuleError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    code = "VALIDATION_ERROR"
    message = "Os dados enviados não atendem às regras."


class UnauthenticatedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "UNAUTHENTICATED"
    message = "Autenticação necessária."


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "FORBIDDEN"
    message = "Você não tem permissão para esta ação."


_HTTP_CODES: dict[int, tuple[str, str]] = {
    400: ("BAD_REQUEST", "Requisição inválida."),
    401: ("UNAUTHENTICATED", "Autenticação necessária."),
    403: ("FORBIDDEN", "Você não tem permissão para esta ação."),
    404: ("NOT_FOUND", "Recurso não encontrado."),
    405: ("METHOD_NOT_ALLOWED", "Método não permitido."),
    409: ("CONFLICT", "Conflito com o estado atual do recurso."),
    413: ("PAYLOAD_TOO_LARGE", "Requisição grande demais."),
    429: ("RATE_LIMITED", "Muitas tentativas. Aguarde e tente novamente."),
}


def error_body(
    code: str, message: str, details: list[dict[str, Any]] | None = None
) -> dict[str, Any]:
    return {"success": False, "error": {"code": code, "message": message, "details": details or []}}


def _field_from_loc(loc: tuple[Any, ...] | list[Any]) -> str:
    # ("body", "contact", "email") → "contact.email"; descarta a origem (body/query/path).
    parts = [str(p) for p in loc[1:]] if len(loc) > 1 else [str(p) for p in loc]
    return ".".join(parts)


async def _app_error_handler(_: Request, exc: Exception) -> JSONResponse:
    error = cast(AppError, exc)
    return JSONResponse(
        error_body(error.code, error.message, error.details), status_code=error.status_code
    )


async def _validation_handler(_: Request, exc: Exception) -> JSONResponse:
    error = cast(RequestValidationError, exc)
    details = [
        {
            "field": _field_from_loc(err.get("loc", ())),
            "code": err.get("type", "invalid"),
            "message": err.get("msg", ""),
        }
        for err in error.errors()
    ]
    return JSONResponse(
        error_body("VALIDATION_ERROR", "Os dados enviados são inválidos.", details),
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    )


async def _http_error_handler(_: Request, exc: Exception) -> JSONResponse:
    error = cast(StarletteHTTPException, exc)
    code, message = _HTTP_CODES.get(error.status_code, ("HTTP_ERROR", "Erro na requisição."))
    return JSONResponse(
        error_body(code, message), status_code=error.status_code, headers=error.headers
    )


async def _unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    # O stack trace vai só para o log; o cliente recebe o request id para correlação.
    # Este handler roda no ServerErrorMiddleware, por fora do RequestContextMiddleware,
    # então o cabeçalho X-Request-ID é recolocado aqui.
    request_id = request.scope.get("state", {}).get("request_id", "")
    log.error("unhandled_error", error=repr(exc), exc_info=exc)
    return JSONResponse(
        error_body(
            "INTERNAL_ERROR",
            "Erro inesperado. Informe o código da requisição ao suporte.",
            [{"request_id": request_id}],
        ),
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers={"X-Request-ID": request_id} if request_id else None,
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_handler)
    app.add_exception_handler(StarletteHTTPException, _http_error_handler)
    app.add_exception_handler(Exception, _unhandled_handler)
