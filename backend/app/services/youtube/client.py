from typing import Any, Dict, List, Optional

import httpx
import scrapetube

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.services.youtube.client")


class YouTubeClient:
    def __init__(self) -> None:
        self.api_key = settings.youtube_api_key

    async def resolve_channel_id(
        self,
        raw_url: str,
        handle: Optional[str] = None,
        username: Optional[str] = None,
    ) -> Optional[str]:
        if not self.api_key:
            logger.warning("YouTube API key not configured | raw_url=%s", raw_url)
            return None

        async with httpx.AsyncClient(timeout=15.0) as client:
            if handle:
                clean_handle = handle if handle.startswith("@") else f"@{handle}"
                resp = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "id,snippet,contentDetails", "forHandle": clean_handle, "key": self.api_key},
                )
                resp.raise_for_status()
                items = resp.json().get("items", [])
                if items:
                    return items[0]["id"]

            if username:
                resp = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "id,snippet,contentDetails", "forUsername": username, "key": self.api_key},
                )
                resp.raise_for_status()
                items = resp.json().get("items", [])
                if items:
                    return items[0]["id"]

        return None

    async def _fetch_uploads_playlist_id(self, client: httpx.AsyncClient, channel_id: str) -> Optional[str]:
        resp = await client.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "contentDetails", "id": channel_id, "key": self.api_key},
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            return None
        return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

    async def _fetch_playlist_video_ids(
        self,
        client: httpx.AsyncClient,
        uploads_playlist_id: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
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

            resp = await client.get("https://www.googleapis.com/youtube/v3/playlistItems", params=params)
            resp.raise_for_status()
            data = resp.json()

            videos.extend(data.get("items", []))
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break

        return videos

    async def _fetch_video_statistics(
        self,
        client: httpx.AsyncClient,
        video_ids: List[str],
    ) -> Dict[str, Dict[str, Any]]:
        """
        Fetch statistics + contentDetails (duration) for a batch of video IDs.
        YouTube API allows up to 50 IDs per call.
        """
        stats_by_id: Dict[str, Dict[str, Any]] = {}

        for i in range(0, len(video_ids), 50):
            batch = video_ids[i : i + 50]
            resp = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "statistics,contentDetails,snippet",
                    "id": ",".join(batch),
                    "key": self.api_key,
                },
            )
            resp.raise_for_status()
            data = resp.json()

            for item in data.get("items", []):
                vid = item["id"]
                stats_by_id[vid] = {
                    "views": int(item.get("statistics", {}).get("viewCount", 0)),
                    "likes": int(item.get("statistics", {}).get("likeCount", 0)) if "likeCount" in item.get("statistics", {}) else None,
                    "comments": int(item.get("statistics", {}).get("commentCount", 0)) if "commentCount" in item.get("statistics", {}) else None,
                    "duration": item.get("contentDetails", {}).get("duration"),
                    "published_at": item.get("snippet", {}).get("publishedAt"),
                }

        return stats_by_id

    def _iso8601_duration_to_seconds(self, duration: Optional[str]) -> Optional[int]:
        if not duration:
            return None
        import re

        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
        if not match:
            return None
        hours, minutes, seconds = (int(x) if x else 0 for x in match.groups())
        return hours * 3600 + minutes * 60 + seconds

    async def _fetch_videos_via_api(self, channel_id: str, limit: int) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []

        async with httpx.AsyncClient(timeout=20.0) as client:
            uploads_playlist_id = await self._fetch_uploads_playlist_id(client, channel_id)
            if not uploads_playlist_id:
                return []

            playlist_items = await self._fetch_playlist_video_ids(client, uploads_playlist_id, limit)
            video_ids = [
                item["contentDetails"]["videoId"]
                for item in playlist_items
                if item.get("contentDetails", {}).get("videoId")
            ]

            stats_by_id = await self._fetch_video_statistics(client, video_ids)

        normalized: List[Dict[str, Any]] = []
        for item in playlist_items:
            video_id = item.get("contentDetails", {}).get("videoId")
            snippet = item.get("snippet", {})
            stats = stats_by_id.get(video_id, {})

            views = stats.get("views")
            likes = stats.get("likes")
            engagement_rate = None
            if views and likes is not None and views > 0:
                engagement_rate = round(likes / views, 4)

            normalized.append(
                {
                    "videoId": video_id,
                    "title": snippet.get("title"),
                    "views": views,
                    "likes": likes,
                    "engagement_rate": engagement_rate,
                    "published_at": stats.get("published_at") or snippet.get("publishedAt"),
                    "duration_seconds": self._iso8601_duration_to_seconds(stats.get("duration")),
                }
            )

        logger.info("YouTube API fetch complete | channel_id=%s count=%s", channel_id, len(normalized))
        return normalized

    async def list_channel_videos_api_first(
        self,
        channel_id: Optional[str],
        channel_url: Optional[str],
        channel_username: Optional[str],
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        if not channel_id and not channel_url and not channel_username:
            raise ValueError("A channel identifier is required")

        if channel_id and self.api_key:
            try:
                api_items = await self._fetch_videos_via_api(channel_id=channel_id, limit=limit)
                if api_items:
                    return api_items
                logger.warning("YouTube API returned no videos; falling back to Scrapetube | channel_id=%s", channel_id)
            except Exception:
                logger.exception("YouTube API video fetch failed; falling back to Scrapetube | channel_id=%s", channel_id)

        logger.info("Fetching channel videos via Scrapetube fallback | channel_id=%s", channel_id)
        video_generator = scrapetube.get_channel(
            channel_id=channel_id,
            channel_url=channel_url,
            channel_username=channel_username,
            limit=limit,
        )

        results: List[Dict[str, Any]] = []
        for item in video_generator:
            title_runs = item.get("title", {}).get("runs", [])
            title = title_runs[0]["text"] if title_runs else None
            results.append(
                {
                    "videoId": item.get("videoId"),
                    "title": title,
                    "views": None,
                    "likes": None,
                    "engagement_rate": None,
                    "published_at": None,
                    "duration_seconds": None,
                }
            )

        logger.info("Scrapetube fallback complete | count=%s", len(results))
        return results