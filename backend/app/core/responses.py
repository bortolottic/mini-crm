"""Envelope de sucesso (SPEC §7.1) e paginação (SPEC §7.2)."""

import math
from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, Field

T = TypeVar("T")

MAX_PAGE_SIZE = 100


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    data: T


class PageEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    meta: PageMeta


class PageParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=MAX_PAGE_SIZE)
    sort: str | None = None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def page_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=MAX_PAGE_SIZE),
    sort: str | None = Query(None, description="campo ou -campo (whitelist por recurso)"),
) -> PageParams:
    return PageParams(page=page, page_size=page_size, sort=sort)


def ok(data: T) -> Envelope[T]:
    return Envelope[T](data=data)


def paginated(items: list[T], total: int, params: PageParams) -> PageEnvelope[T]:
    meta = PageMeta(
        page=params.page,
        page_size=params.page_size,
        total=total,
        total_pages=math.ceil(total / params.page_size) if total else 0,
    )
    return PageEnvelope[T](data=items, meta=meta)
