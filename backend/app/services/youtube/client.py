from typing import List, Dict, Any

import scrapetube
import httpx

from app.core.config import settings


class YouTubeClient:
    """
    Combined client using scrapetube for listing videos and YouTube Data API for stats.

    Only free-tier API usage is assumed.
    """

    def __init__(self) -> None:
        self.api_key = settings.youtube_api_key

    def list_channel_videos(self, channel_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        # scrapetube works without API key and is great for listing uploads.
        videos = scrapetube.get_channel(channel_id)
        result = []
        for i, video in enumerate(videos):
            if i >= limit:
                break
            result.append(video)
        return result

    async def fetch_video_stats(self, video_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Use YouTube Data API's videos endpoint to get statistics.
        """
        if not self.api_key:
            return {}
        url = "https://www.googleapis.com/youtube/v3/videos"
        params = {
            "part": "statistics,contentDetails,snippet",
            "id": ",".join(video_ids),
            "key": self.api_key,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        stats = {}
        for item in data.get("items", []):
            vid = item["id"]
            stats[vid] = item
        return stats