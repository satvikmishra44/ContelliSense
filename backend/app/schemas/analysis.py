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

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AnalysisHistoryItem(BaseModel):
    analysis_uuid: str
    channel_title: Optional[str] = None
    channel_handle: Optional[str] = None
    created_at: datetime
    summary: Optional[str] = None

    class Config:
        from_attributes = True