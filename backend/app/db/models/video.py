from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    BigInteger,
    Float,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False)

    video_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # should be comma-separated for simplicity
    url = Column(String(512), nullable=False)

    published_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    views = Column(BigInteger, nullable=True)
    likes = Column(BigInteger, nullable=True)
    comments_count = Column(BigInteger, nullable=True)

    engagement_rate = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("Channel", back_populates="videos")