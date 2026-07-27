from typing import List, Optional

from pydantic import BaseModel

from .channel import ChannelOverviewResponse
from .recommendation import RecommendationResponse
from .trend import TrendSignalResponse


class AnalysisCreateResponse(BaseModel):
    analysis_uuid: str
    channel: ChannelOverviewResponse
    trends: List[TrendSignalResponse]
    recommendations: List[RecommendationResponse]
    report_download_path: Optional[str]