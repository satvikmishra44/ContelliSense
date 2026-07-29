from typing import Optional, List

from pydantic import BaseModel, HttpUrl, Field


class ChannelCreateRequest(BaseModel):
    channel_url: HttpUrl


class VideoSummary(BaseModel):
    video_id: str
    title: str
    url: str
    views: Optional[int]
    likes: Optional[int]
    engagement_rate: Optional[float]
    published_at: Optional[str]
    duration_seconds: Optional[int]


class ChannelOverviewResponse(BaseModel):
    channel_id: Optional[str] = None
    handle: Optional[str] = None
    username: Optional[str] = None
    title: Optional[str] = None
    url: str
    avg_views: Optional[float] = None
    avg_engagement_rate: Optional[float] = None
    upload_frequency_per_week: Optional[float] = None
    top_videos: List[VideoSummary] = Field(default_factory=list)