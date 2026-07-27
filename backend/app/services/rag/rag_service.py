from typing import List

from sqlalchemy.orm import Session

from app.db.models.video import Video
from app.db.models.trend import Trend
from .vectorstore import VectorStore


class RagService:
    """
    Builds a RAG context for an analysis: channel history + trend data + sentiment snippets.
    """

    def __init__(self, db: Session, index_name: str) -> None:
        self.db = db
        self.vector_store = VectorStore(index_name=index_name)

    def build_context_for_channel(self, channel_id: int) -> None:
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

        self.vector_store.add_texts(texts)

    def retrieve_context(self, query: str, k: int = 20) -> List[str]:
        results = self.vector_store.search(query=query, k=k)
        return [text for text, _dist in results]