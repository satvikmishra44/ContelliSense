import asyncio
import time
from datetime import datetime
from typing import List, Optional

import numpy as np
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.db.models.channel import Channel
from app.db.models.video import Video
from app.schemas.channel import ChannelOverviewResponse, VideoSummary
from .client import YouTubeClient

logger = get_logger("app.services.youtube.channel_analyzer")


class ChannelAnalyzer:
    """
    Analyzes a YouTube channel and persists discovered channel/video metadata.

    Responsibilities:
    - Resolve canonical channel ID when possible
    - Reuse an existing channel row if it already exists by channel_id / handle / username / url
    - Fetch video list
    - Persist unseen videos
    - Compute basic aggregates
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.client = YouTubeClient()

    def _safe_extract_title(self, item: dict) -> str:
        try:
            return item["title"]["runs"][0]["text"]
        except Exception:
            return "Untitled Video"

    def _safe_extract_published_at(self, item: dict) -> Optional[datetime]:
        """
        Scrapetube payloads vary. We keep this tolerant so analysis does not fail
        just because publish date extraction is inconsistent.
        """
        try:
            raw_value = item.get("publishedTimeText")
            if not raw_value:
                return None
            return None
        except Exception:
            return None

    def _find_existing_channel(
        self,
        channel_id: Optional[str],
        handle: Optional[str],
        username: Optional[str],
        raw_url: str,
    ) -> Optional[Channel]:
        """
        Reuse an existing row if we already know this channel under any unique identifier.

        Lookup priority:
        1. channel_id
        2. handle
        3. username
        4. url
        """
        if channel_id:
            existing = (
                self.db.query(Channel)
                .filter(Channel.channel_id == channel_id)
                .first()
            )
            if existing:
                logger.info(
                    "Existing channel found by channel_id | db_id=%s channel_id=%s",
                    existing.id,
                    channel_id,
                )
                return existing

        if handle:
            existing = (
                self.db.query(Channel)
                .filter(Channel.handle == handle)
                .first()
            )
            if existing:
                logger.info(
                    "Existing channel found by handle | db_id=%s handle=%s",
                    existing.id,
                    handle,
                )
                return existing

        if username:
            existing = (
                self.db.query(Channel)
                .filter(Channel.username == username)
                .first()
            )
            if existing:
                logger.info(
                    "Existing channel found by username | db_id=%s username=%s",
                    existing.id,
                    username,
                )
                return existing

        existing = (
            self.db.query(Channel)
            .filter(Channel.url == raw_url)
            .first()
        )
        if existing:
            logger.info(
                "Existing channel found by url | db_id=%s url=%s",
                existing.id,
                raw_url,
            )
            return existing

        return None

    def _upsert_channel(
        self,
        channel_id: Optional[str],
        handle: Optional[str],
        username: Optional[str],
        raw_url: str,
    ) -> Channel:
        """
        Reuse/update existing channel row when possible, otherwise create one.

        This prevents duplicate unique-key violations on handle/username/channel_id.
        """
        existing = self._find_existing_channel(
            channel_id=channel_id,
            handle=handle,
            username=username,
            raw_url=raw_url,
        )

        if existing:
            changed = False

            if channel_id and existing.channel_id != channel_id:
                existing.channel_id = channel_id
                changed = True

            if handle and existing.handle != handle:
                existing.handle = handle
                changed = True

            if username and existing.username != username:
                existing.username = username
                changed = True

            if raw_url and existing.url != raw_url:
                existing.url = raw_url
                changed = True

            if changed:
                try:
                    self.db.commit()
                    self.db.refresh(existing)
                    logger.info(
                        "Existing channel updated | db_id=%s channel_id=%s handle=%s username=%s",
                        existing.id,
                        existing.channel_id,
                        existing.handle,
                        existing.username,
                    )
                except IntegrityError:
                    self.db.rollback()
                    logger.exception(
                        "Channel update failed due to unique constraint | channel_id=%s handle=%s username=%s raw_url=%s",
                        channel_id,
                        handle,
                        username,
                        raw_url,
                    )
                    raise
            else:
                logger.info(
                    "Existing channel reused without changes | db_id=%s",
                    existing.id,
                )

            return existing

        new_channel = Channel(
            channel_id=channel_id or "",
            handle=handle,
            username=username,
            url=raw_url,
        )
        self.db.add(new_channel)

        try:
            self.db.commit()
            self.db.refresh(new_channel)
            logger.info(
                "Created new channel row | db_id=%s channel_id=%s handle=%s username=%s",
                new_channel.id,
                new_channel.channel_id,
                new_channel.handle,
                new_channel.username,
            )
            return new_channel
        except IntegrityError:
            # Another row may already exist due to earlier partial state or race condition.
            self.db.rollback()
            logger.warning(
                "Create channel hit unique constraint, retrying lookup | channel_id=%s handle=%s username=%s raw_url=%s",
                channel_id,
                handle,
                username,
                raw_url,
            )

            recovered = self._find_existing_channel(
                channel_id=channel_id,
                handle=handle,
                username=username,
                raw_url=raw_url,
            )
            if recovered:
                logger.info(
                    "Recovered existing channel after IntegrityError | db_id=%s",
                    recovered.id,
                )
                return recovered

            logger.exception(
                "Channel create failed and recovery lookup did not find a row | channel_id=%s handle=%s username=%s raw_url=%s",
                channel_id,
                handle,
                username,
                raw_url,
            )
            raise

    def analyze_channel(
        self,
        channel_id: Optional[str],
        handle: Optional[str],
        username: Optional[str],
        raw_url: str,
    ) -> ChannelOverviewResponse:
        logger.info(
            "Channel analysis invoked | raw_url=%s channel_id=%s handle=%s username=%s",
            raw_url,
            channel_id,
            handle,
            username,
        )

        # Step 1: Resolve channel ID if missing.
        if not channel_id:
            logger.info(
                "Channel ID missing, attempting resolution | raw_url=%s handle=%s username=%s",
                raw_url,
                handle,
                username,
            )
            try:
                resolved_channel_id = asyncio.run(
                    self.client.resolve_channel_id(
                        raw_url=raw_url,
                        handle=handle,
                        username=username,
                    )
                )
            except RuntimeError:
                logger.warning(
                    "asyncio.run() failed due to active event loop; skipping direct resolution | raw_url=%s",
                    raw_url,
                )
                resolved_channel_id = None

            if resolved_channel_id:
                channel_id = resolved_channel_id
                logger.info("Channel ID resolved successfully | channel_id=%s", channel_id)
            else:
                logger.warning(
                    "Could not resolve channel ID through API; will fallback to URL/username-based fetch | raw_url=%s",
                    raw_url,
                )

        # Step 2: Upsert/reuse channel row safely.
        channel = self._upsert_channel(
            channel_id=channel_id,
            handle=handle,
            username=username,
            raw_url=raw_url,
        )

        # Step 3: Fetch videos using best available identifier.
        fetch_start = time.perf_counter()
        logger.info("Fetching channel videos from Scrapetube")

        videos_raw = asyncio.run(
            self.client.list_channel_videos_api_first(
                channel_id=channel.channel_id or None,
                channel_url=raw_url if not channel.channel_id else None,
                channel_username=username if (not channel.channel_id and username) else None,
                limit=100,
            )
        )

        logger.info(
            "Fetched channel videos from Scrapetube | count=%s duration_ms=%s",
            len(videos_raw),
            round((time.perf_counter() - fetch_start) * 1000, 2),
        )

        # Step 4: Persist unseen videos.
        inserted_video_count = 0
        for item in videos_raw:
            video_id = item.get("videoId")
            if not video_id:
                continue

            existing_video = (
                self.db.query(Video)
                .filter(Video.video_id == video_id)
                .first()
            )
            if existing_video:
                continue

            title = self._safe_extract_title(item)
            published_at = self._safe_extract_published_at(item)
            video_url = f"https://www.youtube.com/watch?v={video_id}"

            video = Video(
                channel_id=channel.id,
                video_id=video_id,
                title=title,
                url=video_url,
                published_at=published_at,
            )
            self.db.add(video)
            inserted_video_count += 1

        self.db.commit()

        logger.info("Prepared video entities | inserted_video_count=%s", inserted_video_count)

        # Step 5: Build aggregates.
        all_channel_videos: List[Video] = (
            self.db.query(Video)
            .filter(Video.channel_id == channel.id)
            .all()
        )

        views = [v.views for v in all_channel_videos if v.views is not None]
        avg_views = float(np.mean(views)) if views else None

        engagements = [
            v.engagement_rate for v in all_channel_videos if v.engagement_rate is not None
        ]
        avg_engagement = float(np.mean(engagements)) if engagements else None

        timestamps = [v.published_at for v in all_channel_videos if v.published_at]
        if len(timestamps) >= 2:
            timestamps.sort()
            total_weeks = max(1.0, (timestamps[-1] - timestamps[0]).days / 7.0)
            upload_freq = len(timestamps) / total_weeks
        elif len(timestamps) == 1:
            upload_freq = 1.0
        else:
            upload_freq = None

        sorted_videos = sorted(
            all_channel_videos,
            key=lambda v: (v.views is not None, v.views if v.views is not None else -1),
            reverse=True,
        )

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
            for v in sorted_videos[:10]
        ]

        logger.info(
            "Channel analysis complete | channel_db_id=%s avg_views=%s avg_engagement=%s upload_frequency_per_week=%s total_videos=%s",
            channel.id,
            avg_views,
            avg_engagement,
            upload_freq,
            len(all_channel_videos),
        )

        return ChannelOverviewResponse(
            channel_id=channel.channel_id or "",
            handle=channel.handle,
            username=channel.username,
            title=channel.title,
            url=channel.url,
            avg_views=avg_views,
            avg_engagement_rate=avg_engagement,
            upload_frequency_per_week=upload_freq,
            top_videos=top_videos,
        )