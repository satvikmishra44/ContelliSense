from typing import List

import feedparser

from app.db.models.trend import Trend
from sqlalchemy.orm import Session


class NewsTrendService:
    """
    Lightweight Google News RSS ingestion to detect emerging topics.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def collect_news_trends(self, topic: str, max_items: int = 20) -> List[Trend]:
        feed_url = f"https://news.google.com/rss/search?q={topic}"
        feed = feedparser.parse(feed_url)

        trends: List[Trend] = []
        for entry in feed.entries[:max_items]:
            t = Trend(
                source="news",
                keyword=topic,
                category=None,
                region=None,
                momentum_score=None,
                velocity_score=None,
                confidence_score=0.5,
                raw_payload=entry.title,
            )
            self.db.add(t)
            trends.append(t)
        self.db.commit()
        return trends