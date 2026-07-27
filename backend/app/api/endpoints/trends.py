from fastapi import APIRouter

from app.api.dependencies import DbSessionDep
from app.schemas.trend import TrendSignalResponse
from app.services.trends.google_trends_service import GoogleTrendsService

router = APIRouter()


@router.get(
    "/keywords",
    response_model=list[TrendSignalResponse],
    summary="Fetch current trend signals for a keyword",
)
def get_trends(keyword: str, region: str = "world", db: DbSessionDep = None):
    service = GoogleTrendsService()
    trends = service.fetch_trends(keyword=keyword, region=region)
    return trends