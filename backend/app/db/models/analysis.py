from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False)

    analysis_uuid = Column(String(64), unique=True, nullable=False)
    summary = Column(Text, nullable=True)
    report_path = Column(String(512), nullable=True)  # Excel report file path

    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    channel = relationship("Channel", back_populates="analyses")
    recommendations = relationship("Recommendation", back_populates="analysis")