from typing import Optional

from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    title: str
    hook: Optional[str]
    thumbnail_idea: Optional[str]
    summary: Optional[str]
    target_audience: Optional[str]
    why_it_should_work: Optional[str]
    supporting_evidence: Optional[str]
    trend_explanation: Optional[str]
    risk_factors: Optional[str]

    estimated_effort: Optional[str]
    expected_ctr: Optional[float]
    search_potential: Optional[float]
    virality_score: Optional[float]
    confidence_score: Optional[float]
    hit_probability: Optional[float]
    publishing_window: Optional[str]