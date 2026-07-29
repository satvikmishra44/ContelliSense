from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(String(128), unique=True, index=True, nullable=True)
    handle = Column(String(128), unique=True, index=True, nullable=True)
    username = Column(String(256), unique=True, nullable=True)
    title = Column(String(256), nullable=True)
    description = Column(Text, nullable=True)
    url = Column(String(512), nullable=False)

    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    videos = relationship("Video", back_populates="channel")
    analyses = relationship("Analysis", back_populates="channel")