import asyncio
import time
from datetime import datetime
from statistics import mean
from typing import Optional

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

    def _run_async(self, coro):
        try:
            return asyncio.run(coro)
        except RuntimeError:
            logger.warning("asyncio.run() unavailable due to active event loop")
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(coro)
            finally:
                loop.close()

    def _find_existing_channel(
        self,
        channel_id: Optional[str],
        handle: Optional[str],
        username: Optional[str],
        raw_url: str,
    ) -> Optional[Channel]:
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

        if not channel_id:
            logger.info(
                "Channel ID missing, attempting resolution | raw_url=%s handle=%s username=%s",
                raw_url,
                handle,
                username,
            )
            try:
                resolved_channel_id = self._run_async(
                    self.client.resolve_channel_id(
                        raw_url=raw_url,
                        handle=handle,
                        username=username,
                    )
                )
            except Exception:
                logger.exception(
                    "Channel ID resolution failed | raw_url=%s handle=%s username=%s",
                    raw_url,
                    handle,
                    username,
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

        channel = self._upsert_channel(
            channel_id=channel_id,
            handle=handle,
            username=username,
            raw_url=raw_url,
        )

        fetch_start = time.perf_counter()
        logger.info("Fetching channel videos via YouTube API/Scrapetube")

        videos_raw = self._run_async(
            self.client.list_channel_videos_api_first(
                channel_id=channel.channel_id or None,
                channel_url=raw_url if not channel.channel_id else None,
                channel_username=username if (not channel.channel_id and username) else None,
                limit=30,
            )
        )

        logger.info(
            "Fetched channel videos | count=%s duration_ms=%s",
            len(videos_raw),
            round((time.perf_counter() - fetch_start) * 1000, 2),
        )

        existing_video_ids = {
            row[0]
            for row in self.db.query(Video.video_id)
            .filter(Video.channel_id == channel.id)
            .all()
        }

        video_entities = []
        views_list = []
        engagement_list = []

        for v in videos_raw:
            video_id = v.get("videoId")
            if not video_id:
                continue

            if video_id in existing_video_ids:
                continue

            views = v.get("views")
            likes = v.get("likes")
            engagement_rate = v.get("engagement_rate")
            published_at = v.get("published_at")
            duration_seconds = v.get("duration_seconds")

            video_entities.append(
                Video(
                    channel_id=channel.id,
                    video_id=video_id,
                    title=v.get("title"),
                    url=f"https://www.youtube.com/watch?v={video_id}",
                    views=views,
                    likes=likes,
                    engagement_rate=engagement_rate,
                    published_at=published_at,
                    duration_seconds=duration_seconds,
                )
            )

        if video_entities:
            try:
                self.db.add_all(video_entities)
                self.db.commit()
                logger.info(
                    "Persisted new videos | inserted_count=%s channel_db_id=%s",
                    len(video_entities),
                    channel.id,
                )
            except IntegrityError:
                self.db.rollback()
                logger.exception(
                    "Video persistence failed due to integrity error | channel_db_id=%s",
                    channel.id,
                )
                raise
        else:
            logger.info("No new videos to persist | channel_db_id=%s", channel.id)

        for v in videos_raw:
            if v.get("views") is not None:
                views_list.append(v["views"])
            if v.get("engagement_rate") is not None:
                engagement_list.append(v["engagement_rate"])

        avg_views = round(mean(views_list), 2) if views_list else None
        avg_engagement_rate = round(mean(engagement_list), 4) if engagement_list else None
        upload_frequency_per_week = self._estimate_upload_frequency(videos_raw)

        logger.info(
            "Channel analysis complete | channel_db_id=%s avg_views=%s avg_engagement=%s upload_frequency_per_week=%s total_videos=%s",
            channel.id,
            avg_views,
            avg_engagement_rate,
            upload_frequency_per_week,
            len(videos_raw),
        )

        return ChannelOverviewResponse(
            channel_id=channel.channel_id,
            handle=channel.handle,
            username=channel.username,
            title=channel.title,
            url=raw_url,
            avg_views=avg_views,
            avg_engagement_rate=avg_engagement_rate,
            upload_frequency_per_week=upload_frequency_per_week,
            top_videos=[
                VideoSummary(
                    video_id=v.get("videoId"),
                    title=v.get("title"),
                    url=f"https://www.youtube.com/watch?v={v.get('videoId')}",
                    views=v.get("views"),
                    likes=v.get("likes"),
                    engagement_rate=v.get("engagement_rate"),
                    published_at=v.get("published_at"),
                    duration_seconds=v.get("duration_seconds"),
                )
                for v in videos_raw[:10]
                if v.get("videoId")
            ],
        )

    def _estimate_upload_frequency(self, videos_raw) -> float | None:
        dates = []
        for v in videos_raw:
            ts = v.get("published_at")
            if not ts:
                continue
            try:
                dates.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            except ValueError:
                continue

        if len(dates) < 2:
            return None

        dates.sort()
        span_days = (dates[-1] - dates[0]).days or 1
        weeks = span_days / 7
        return round(len(dates) / weeks, 2) if weeks > 0 else None