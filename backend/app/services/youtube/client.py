# from typing import List, Dict, Any

# import scrapetube
# import httpx

# from app.core.config import settings


# class YouTubeClient:
#     """
#     Combined client using scrapetube for listing videos and YouTube Data API for stats.

#     Only free-tier API usage is assumed.
#     """

#     def __init__(self) -> None:
#         self.api_key = settings.youtube_api_key

#     def list_channel_videos(self, channel_id: str, limit: int = 50) -> List[Dict[str, Any]]:
#         # scrapetube works without API key and is great for listing uploads.
#         videos = scrapetube.get_channel(channel_id)
#         result = []
#         for i, video in enumerate(videos):
#             if i >= limit:
#                 break
#             result.append(video)
#         return result

#     async def fetch_video_stats(self, video_ids: List[str]) -> Dict[str, Dict[str, Any]]:
#         """
#         Use YouTube Data API's videos endpoint to get statistics.
#         """
#         if not self.api_key:
#             return {}
#         url = "https://www.googleapis.com/youtube/v3/videos"
#         params = {
#             "part": "statistics,contentDetails,snippet",
#             "id": ",".join(video_ids),
#             "key": self.api_key,
#         }
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             resp = await client.get(url, params=params)
#             resp.raise_for_status()
#             data = resp.json()
#         stats = {}
#         for item in data.get("items", []):
#             vid = item["id"]
#             stats[vid] = item
#         return stats

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
    2. Fetch channel videos using Scrapetube.
    3. Support fallback inputs: channel_id, channel_url, channel_username.

    Why this design:
    - Official API gives us reliable ID resolution for @handle and /user/ forms.
    - Scrapetube is still useful for free-tier scraping of video lists.
    """

    def __init__(self) -> None:
        self.api_key = settings.youtube_api_key

    async def resolve_channel_id(
        self,
        raw_url: str,
        handle: Optional[str] = None,
        username: Optional[str] = None,
    ) -> Optional[str]:
        """
        Resolve a handle or legacy username into a canonical UC... channel ID.

        Notes:
        - YouTube Data API supports 'forHandle' for @handle lookup.
        - It also supports 'forUsername' for old username-based channels.
        """
        if handle and self.api_key:
            clean_handle = handle if handle.startswith("@") else f"@{handle}"

            logger.info(
                "Attempting channel ID resolution using forHandle | handle=%s raw_url=%s",
                clean_handle,
                raw_url,
            )

            url = "https://www.googleapis.com/youtube/v3/channels"
            params = {
                "part": "id,snippet",
                "forHandle": clean_handle,
                "key": self.api_key,
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            items = data.get("items", [])
            if items:
                channel_id = items[0]["id"]
                logger.info(
                    "Resolved handle to channel ID | handle=%s channel_id=%s",
                    clean_handle,
                    channel_id,
                )
                return channel_id

            logger.warning(
                "No channel found using forHandle | handle=%s raw_url=%s",
                clean_handle,
                raw_url,
            )

        if username and self.api_key:
            logger.info(
                "Attempting channel ID resolution using forUsername | username=%s raw_url=%s",
                username,
                raw_url,
            )

            url = "https://www.googleapis.com/youtube/v3/channels"
            params = {
                "part": "id,snippet",
                "forUsername": username,
                "key": self.api_key,
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

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
                "No channel found using forUsername | username=%s raw_url=%s",
                username,
                raw_url,
            )

        logger.warning(
            "Could not resolve channel ID via YouTube API | raw_url=%s handle=%s username=%s",
            raw_url,
            handle,
            username,
        )
        return None

    def list_channel_videos(
        self,
        channel_id: Optional[str] = None,
        channel_url: Optional[str] = None,
        channel_username: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Fetch channel videos using Scrapetube.

        Scrapetube supports:
        - channel_id
        - channel_url
        - channel_username

        We prefer channel_id when available, but fallback to URL/username when needed.
        """
        if not channel_id and not channel_url and not channel_username:
            raise ValueError("A channel identifier is required")

        logger.info(
            "Fetching videos with Scrapetube | channel_id=%s channel_url=%s channel_username=%s limit=%s",
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
            "Scrapetube fetch complete | count=%s channel_id=%s channel_url=%s channel_username=%s",
            len(results),
            channel_id,
            channel_url,
            channel_username,
        )
        return results

    async def fetch_video_stats(self, video_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch video stats from the YouTube Data API.

        This remains optional because the app should still function in a degraded
        mode when the API key is not configured.
        """
        if not self.api_key or not video_ids:
            logger.warning(
                "Skipping fetch_video_stats | api_key_configured=%s video_count=%s",
                bool(self.api_key),
                len(video_ids),
            )
            return {}

        logger.info("Fetching YouTube video stats | video_count=%s", len(video_ids))

        url = "https://www.googleapis.com/youtube/v3/videos"
        params = {
            "part": "statistics,contentDetails,snippet",
            "id": ",".join(video_ids),
            "key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        stats: Dict[str, Dict[str, Any]] = {}
        for item in data.get("items", []):
            stats[item["id"]] = item

        logger.info("Fetched YouTube video stats successfully | resolved_count=%s", len(stats))
        return stats