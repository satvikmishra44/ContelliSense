from typing import Any, Dict, List, Optional

import httpx
import scrapetube

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.services.youtube.client")


class YouTubeClient:
    """
    YouTube access layer.

    Strategy:
    1. Resolve canonical channel ID using official YouTube Data API when possible.
    2. Fetch channel videos primarily via the uploads playlist with the Data API.
    3. Fallback to Scrapetube when the API is unavailable or errors occur.
    """

    def __init__(self) -> None:
        self.api_key = settings.youtube_api_key

    async def resolve_channel_id(
        self,
        raw_url: str,
        handle: Optional[str] = None,
        username: Optional[str] = None,
    ) -> Optional[str]:
        if not self.api_key:
            logger.warning(
                "YouTube API key not configured; cannot resolve channel ID | raw_url=%s",
                raw_url,
            )
            return None

        if handle:
            clean_handle = handle if handle.startswith("@") else f"@{handle}"
            logger.info(
                "Attempting channel ID resolution using forHandle | handle=%s raw_url=%s",
                clean_handle,
                raw_url,
            )
            url = "https://www.googleapis.com/youtube/v3/channels"
            params = {
                "part": "id,snippet,contentDetails",
                "forHandle": clean_handle,
                "key": self.api_key,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            items = data.get("items", [])
            if items:
                channel_id = items[0]["id"]
                logger.info(
                    "Resolved handle to channel ID | handle=%s channel_id=%s",
                    clean_handle,
                    channel_id,
                )
                return channel_id

        if username:
            logger.info(
                "Attempting channel ID resolution using forUsername | username=%s raw_url=%s",
                username,
                raw_url,
            )
            url = "https://www.googleapis.com/youtube/v3/channels"
            params = {
                "part": "id,snippet,contentDetails",
                "forUsername": username,
                "key": self.api_key,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            items = data.get("items", [])
            if items:
                channel_id = items[0]["id"]
                logger.info(
                    "Resolved username to channel ID | username=%s channel_id=%s",
                    username,
                    channel_id,
                )
                return channel_id

        logger.warning(
            "Could not resolve channel ID via YouTube API | raw_url=%s handle=%s username=%s",
            raw_url,
            handle,
            username,
        )
        return None

    async def _fetch_videos_via_api(
        self,
        channel_id: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        """
        Fetch videos via the official YouTube Data API.

        We use the uploads playlist from contentDetails.
        """
        if not self.api_key:
            logger.warning(
                "YouTube API key not configured; skipping API video fetch | channel_id=%s",
                channel_id,
            )
            return []

        logger.info(
            "Fetching channel videos via YouTube Data API | channel_id=%s limit=%s",
            channel_id,
            limit,
        )

        async with httpx.AsyncClient(timeout=20.0) as client:
            # Step 1: get uploads playlist id
            ch_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/channels",
                params={
                    "part": "contentDetails",
                    "id": channel_id,
                    "key": self.api_key,
                },
            )
            ch_resp.raise_for_status()
            ch_data = ch_resp.json()
            items = ch_data.get("items", [])
            if not items:
                logger.warning(
                    "YouTube API: no channel contentDetails found | channel_id=%s",
                    channel_id,
                )
                return []

            uploads_playlist_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

            # Step 2: list videos from uploads playlist
            videos: List[Dict[str, Any]] = []
            next_page_token: Optional[str] = None

            while len(videos) < limit:
                params = {
                    "part": "contentDetails,snippet",
                    "playlistId": uploads_playlist_id,
                    "maxResults": min(50, limit - len(videos)),
                    "key": self.api_key,
                }
                if next_page_token:
                    params["pageToken"] = next_page_token

                pl_resp = await client.get(
                    "https://www.googleapis.com/youtube/v3/playlistItems",
                    params=params,
                )
                pl_resp.raise_for_status()
                pl_data = pl_resp.json()

                for item in pl_data.get("items", []):
                    videos.append(item)

                next_page_token = pl_data.get("nextPageToken")
                if not next_page_token:
                    break

        logger.info(
            "YouTube API fetch complete | channel_id=%s count=%s",
            channel_id,
            len(videos),
        )
        return videos

    def _convert_api_video_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize YouTube API playlistItems response into internal shape
        similar to what we used with Scrapetube.
        """
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        video_id = content_details.get("videoId")
        title = snippet.get("title")
        published_at = snippet.get("publishedAt")

        return {
            "videoId": video_id,
            "title": {"runs": [{"text": title}]},
            "publishedTimeText": published_at,
        }

    async def list_channel_videos_api_first(
        self,
        channel_id: Optional[str],
        channel_url: Optional[str],
        channel_username: Optional[str],
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Prefer YouTube Data API to fetch videos; fallback to Scrapetube if needed.

        This replaces the old Scrapetube-only strategy that was returning 0 videos
        for some channels.
        """
        if not channel_id and not channel_url and not channel_username:
            raise ValueError("A channel identifier is required")

        # Try API first if we have a channel_id and an API key.
        if channel_id and self.api_key:
            try:
                api_items = await self._fetch_videos_via_api(channel_id=channel_id, limit=limit)
                if api_items:
                    normalized = [self._convert_api_video_item(it) for it in api_items]
                    logger.info(
                        "Using YouTube Data API results for videos | channel_id=%s count=%s",
                        channel_id,
                        len(normalized),
                    )
                    return normalized
                logger.warning(
                    "YouTube Data API returned no videos; falling back to Scrapetube | channel_id=%s",
                    channel_id,
                )
            except Exception as exc:
                logger.exception(
                    "YouTube Data API video fetch failed; falling back to Scrapetube | channel_id=%s error=%s",
                    channel_id,
                    str(exc),
                )

        # Fallback to Scrapetube.
        logger.info(
            "Fetching channel videos via Scrapetube fallback | channel_id=%s channel_url=%s channel_username=%s limit=%s",
            channel_id,
            channel_url,
            channel_username,
            limit,
        )
        video_generator = scrapetube.get_channel(
            channel_id=channel_id,
            channel_url=channel_url,
            channel_username=channel_username,
            limit=limit,
        )

        results: List[Dict[str, Any]] = []
        for item in video_generator:
            results.append(item)

        logger.info(
            "Scrapetube fallback fetch complete | count=%s channel_id=%s channel_url=%s channel_username=%s",
            len(results),
            channel_id,
            channel_url,
            channel_username,
        )
        return results