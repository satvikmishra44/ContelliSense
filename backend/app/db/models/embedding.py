from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float

from app.db.base import Base


class EmbeddingMetadata(Base):
    __tablename__ = "embeddings_metadata"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=True)

    doc_type = Column(String(64), nullable=False)  # "video", "trend", "comment", "summary"
    doc_id = Column(String(128), nullable=False)
    text_snippet = Column(Text, nullable=False)

    vector_dim = Column(Integer, nullable=False)
    vector_norm = Column(Float, nullable=True)

    index_name = Column(String(128), nullable=False)

    created_at = Column(DateTime, default=datetime.now(timezone.utc))