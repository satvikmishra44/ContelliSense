from fastapi import APIRouter

from .endpoints import channels, analysis, trends, reports

api_router = APIRouter(prefix="/api")

api_router.include_router(
    channels.router,
    prefix="/channels",
    tags=["channels"],
)
api_router.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["analysis"],
)
api_router.include_router(
    trends.router,
    prefix="/trends",
    tags=["trends"],
)
api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["reports"],
)