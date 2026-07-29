from typing import List

from sqlalchemy.orm import Session

from app.db.models.video import Video
from app.db.models.trend import Trend
from .vectorstore import VectorStore

import time
from app.core.logging_config import get_logger

logger = get_logger("app.services.rag.rag_service")

class RagService:
    """
    Builds a RAG context for an analysis: channel history + trend data + sentiment snippets.
    """

    def __init__(self, db: Session, index_name: str) -> None:
        self.db = db
        self.vector_store = VectorStore(index_name=index_name)

    def build_context_for_channel(self, channel_id: int) -> None:
        start = time.perf_counter()
        logger.info("RAG build started | channel_id=%s index_name=%s", channel_id, self.vector_store.index_name)

        videos: List[Video] = (
            self.db.query(Video).filter(Video.channel_id == channel_id).limit(200).all()
        )
        texts: List[str] = []
        for v in videos:
            snippet = f"Video: {v.title}. Desc: {v.description or ''}. Views: {v.views}."
            texts.append(snippet)

        trends: List[Trend] = self.db.query(Trend).limit(100).all()
        for t in trends:
            snippet = f"Trend: {t.keyword} source={t.source} momentum={t.momentum_score} velocity={t.velocity_score}."
            texts.append(snippet)

        logger.info(
            "RAG texts prepared | video_docs=%s trend_docs=%s total_docs=%s",
            len(videos),
            len(trends),
            len(texts),
        )

        self.vector_store.add_texts(texts)

        logger.info(
            "RAG build completed | total_docs=%s duration_ms=%s",
            len(texts),
            round((time.perf_counter() - start) * 1000, 2),
        )

    def retrieve_context(self, query: str, k: int = 20) -> List[str]:
        start = time.perf_counter()
        logger.info("RAG retrieve started | query=%s k=%s", query, k)
        results = self.vector_store.search(query=query, k=k)
        logger.info(
            "RAG retrieve completed | hits=%s duration_ms=%s",
            len(results),
            round((time.perf_counter() - start) * 1000, 2),
        )
        return [text for text, _dist in results]