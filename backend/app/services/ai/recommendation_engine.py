import json
from typing import List

from sqlalchemy.orm import Session

from app.db.models.analysis import Analysis
from app.db.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationResponse

import time
from app.core.logging_config import get_logger

logger = get_logger("app.services.ai.recommendation_engine")


class RecommendationEngine:
    """
    Parses Gemini JSON-like output, persists recommendations, and converts to DTOs.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def persist_and_format(
        self,
        analysis: Analysis,
        raw_text: str,
    ) -> List[RecommendationResponse]:
        # Try to extract JSON from model output.
        start = time.perf_counter()
        logger.info("Recommendation parsing started | analysis_id=%s", analysis.id)
        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError:
            # Fallback: very simple extraction or empty list.
            logger.exception("Recommendation parsing failed | invalid JSON from model")
            return []

        recommendations: List[RecommendationResponse] = []

        for item in data:
            rec = Recommendation(
                analysis_id=analysis.id,
                title=item.get("title", ""),
                hook=item.get("hook"),
                thumbnail_idea=item.get("thumbnail_idea"),
                summary=item.get("summary"),
                target_audience=item.get("target_audience"),
                why_it_should_work=item.get("why_it_should_work"),
                supporting_evidence=item.get("supporting_evidence"),
                trend_explanation=item.get("trend_explanation"),
                risk_factors=item.get("risk_factors"),
                estimated_effort=item.get("estimated_effort"),
                expected_ctr=item.get("expected_ctr"),
                search_potential=item.get("search_potential"),
                virality_score=item.get("virality_score"),
                confidence_score=item.get("confidence_score"),
                hit_probability=item.get("hit_probability"),
                publishing_window=item.get("publishing_window"),
            )
            self.db.add(rec)
            recommendations.append(
                RecommendationResponse(
                    title=rec.title,
                    hook=rec.hook,
                    thumbnail_idea=rec.thumbnail_idea,
                    summary=rec.summary,
                    target_audience=rec.target_audience,
                    why_it_should_work=rec.why_it_should_work,
                    supporting_evidence=rec.supporting_evidence,
                    trend_explanation=rec.trend_explanation,
                    risk_factors=rec.risk_factors,
                    estimated_effort=rec.estimated_effort,
                    expected_ctr=rec.expected_ctr,
                    search_potential=rec.search_potential,
                    virality_score=rec.virality_score,
                    confidence_score=rec.confidence_score,
                    hit_probability=rec.hit_probability,
                    publishing_window=rec.publishing_window,
                )
            )

        self.db.commit()
        logger.info(
            "Recommendation parsing completed | count=%s duration_ms=%s",
            len(recommendations),
            round((time.perf_counter() - start) * 1000, 2),
        )
        return recommendations