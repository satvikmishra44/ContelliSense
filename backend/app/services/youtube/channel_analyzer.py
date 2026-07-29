from datetime import datetime
from typing import List

import numpy as np
from sqlalchemy.orm import Session

from app.db.models.channel import Channel
from app.db.models.video import Video
from app.schemas.channel import ChannelOverviewResponse, VideoSummary
from .client import YouTubeClient


class ChannelAnalyzer:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.client = YouTubeClient()

    def analyze_channel(
        self,
        channel_id: str | None,
        handle: str | None,
        username: str | None,
        raw_url: str,
    ) -> ChannelOverviewResponse:
        # Persist/find channel
        query = self.db.query(Channel)

        if channel_id:
            channel = query.filter(Channel.channel_id == channel_id).first()
        elif handle:
            channel = query.filter(Channel.handle == handle).first()
        elif username:
            channel = query.filter(Channel.username == username).first()
        else:
            channel = query.filter(Channel.url == raw_url).first()
            
        if channel is None:
            channel = Channel(
                channel_id=channel_id,
                handle=handle,
                username=username,
                url=raw_url,
            )
            self.db.add(channel)
            self.db.commit()
            self.db.refresh(channel)

        # List videos via scrapetube
        videos_raw = self.client.list_channel_videos(channel_id=channel.channel_id, handle=channel.handle, username=channel.username, raw_url=channel.url, limit=100)
        video_ids = []
        video_entities: List[Video] = []

        for item in videos_raw:
            vid = item["videoId"]
            title = item["title"]["runs"][0]["text"]
            published_at = datetime.fromtimestamp(int(item["publishedTimeText"]["runs"][0]["text"]))
            url = f"https://www.youtube.com/watch?v={vid}"

            video = (
                self.db.query(Video).filter(Video.video_id == vid).first()
            )
            if video is None:
                video = Video(
                    channel_id=channel.id,
                    video_id=vid,
                    title=title,
                    url=url,
                    published_at=published_at,
                )
                self.db.add(video)
                video_entities.append(video)
            video_ids.append(vid)

        self.db.commit()

        # Fetch stats via YouTube Data API (async call)
        # For Phase 1, we keep this synchronous by skipping extra awaits; you can refine later.
        # Statistics could be fetched in a background task to avoid blocking.

        # Compute aggregates (dummy until stats are filled)
        views = [v.views for v in video_entities if v.views is not None]
        avg_views = float(np.mean(views)) if views else None

        engagements = [v.engagement_rate for v in video_entities if v.engagement_rate is not None]
        avg_engagement = float(np.mean(engagements)) if engagements else None

        # Upload frequency: videos per week based on timestamps
        if video_entities:
            timestamps = [v.published_at for v in video_entities if v.published_at]
            timestamps.sort()
            weeks = max(
                1,
                ((timestamps[-1] - timestamps[0]).days / 7.0) or 1,
            )
            upload_freq = len(timestamps) / weeks
        else:
            upload_freq = None

        top_videos = [
            VideoSummary(
                video_id=v.video_id,
                title=v.title,
                url=v.url,
                views=v.views,
                likes=v.likes,
                engagement_rate=v.engagement_rate,
                published_at=v.published_at.isoformat() if v.published_at else None,
                duration_seconds=v.duration_seconds,
            )
            for v in video_entities[:10]
        ]

        return ChannelOverviewResponse(
            channel_id=channel.channel_id,
            handle=channel.handle,
            username=channel.username,
            title=channel.title,
            url=channel.url,
            avg_views=avg_views,
            avg_engagement_rate=avg_engagement,
            upload_frequency_per_week=upload_freq,
            top_videos=top_videos,
        )