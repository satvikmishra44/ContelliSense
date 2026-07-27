from sqlalchemy import Column, ForeignKey, Integer, String, Float, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)

    title = Column(String(256), nullable=False)
    hook = Column(Text, nullable=True)
    thumbnail_idea = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    why_it_should_work = Column(Text, nullable=True)
    supporting_evidence = Column(Text, nullable=True)
    trend_explanation = Column(Text, nullable=True)
    risk_factors = Column(Text, nullable=True)

    estimated_effort = Column(String(64), nullable=True)
    expected_ctr = Column(Float, nullable=True)
    search_potential = Column(Float, nullable=True)
    virality_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    hit_probability = Column(Float, nullable=True)
    publishing_window = Column(String(128), nullable=True)

    analysis = relationship("Analysis", back_populates="recommendations")