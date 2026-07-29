import json
import time
from typing import List

from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.db.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationResponse

logger = get_logger("app.services.ai.recommendation_engine")


class RecommendationEngine:
    """
    Parses Gemini JSON output and persists recommendations.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def _safe_load_json(self, raw_text: str):
        """
        Robust JSON loader that handles occasional markdown fences or
        stray commentary around JSON.

        We first try direct json.loads; on failure, attempt to extract
        the first JSON array/object substring.
        """
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Direct json.loads failed; attempting JSON extraction fallback")

        # Very simple fallback: find first '[' and last ']' and try to parse.
        start = raw_text.find("[")
        end = raw_text.rfind("]")
        if start != -1 and end != -1 and end > start:
            candidate = raw_text[start : end + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                logger.exception("JSON extraction fallback failed as well")
                return []

        logger.error("Could not find JSON array in model output")
        return []

    def persist_and_format(
        self,
        analysis,
        raw_text: str,
    ) -> List[RecommendationResponse]:
        start = time.perf_counter()
        logger.info("Recommendation parsing started | analysis_id=%s", analysis.id)

        data = self._safe_load_json(raw_text)
        if not isinstance(data, list):
            logger.warning(
                "Model output JSON is not a list; treating as empty | type=%s",
                type(data).__name__,
            )
            data = []

        recommendations: List[RecommendationResponse] = []

        for item in data:
            try:
                title = item.get("title", "Untitled")
                summary = item.get("summary", "")

                rec = Recommendation(
                    analysis_id=analysis.id,
                    title=title,
                    summary=summary,
                    hook=item.get("hook"),
                    thumbnail_idea=item.get("thumbnail_idea"),
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
                self.db.flush()

                recommendations.append(
                    RecommendationResponse(
                        id=rec.id,
                        title=title,
                        summary=summary,
                        hook=rec.hook,
                        thumbnail_idea=rec.thumbnail_idea,
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
            except Exception:
                logger.exception("Failed to parse/persist one recommendation item; skipping")

        self.db.commit()

        logger.info(
            "Recommendation parsing completed | count=%s duration_ms=%s",
            len(recommendations),
            round((time.perf_counter() - start) * 1000, 2),
        )
        return recommendations