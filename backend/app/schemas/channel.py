from typing import Optional, List

from pydantic import BaseModel, HttpUrl


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
    channel_id: str
    handle: Optional[str]
    username: Optional[str]
    title: Optional[str]
    url: str
    avg_views: Optional[float]
    avg_engagement_rate: Optional[float]
    upload_frequency_per_week: Optional[float]
    top_videos: List[VideoSummary]