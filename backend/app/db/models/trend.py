from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.db.base import Base


class Trend(Base):
    __tablename__ = "trends"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(64), nullable=False)  # "google_trends", "news", "youtube_trending"
    keyword = Column(String(256), nullable=False)
    category = Column(String(128), nullable=True)
    region = Column(String(64), nullable=True)

    momentum_score = Column(Float, nullable=True)
    velocity_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)

    raw_payload = Column(Text, nullable=True)

    collected_at = Column(DateTime, default=datetime.utcnow)