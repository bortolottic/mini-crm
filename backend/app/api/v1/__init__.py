"""Router agregador da API v1. Cada módulo de recurso registra o seu aqui."""

from fastapi import APIRouter

from app.api.v1 import health

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
