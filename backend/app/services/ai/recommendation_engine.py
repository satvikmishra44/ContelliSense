import json
import time
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.db.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationResponse

logger = get_logger("app.services.ai.recommendation_engine")


class RecommendationEngine:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _safe_load_json(self, raw_text: str):
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Direct json.loads failed; attempting extraction fallback")

        start = raw_text.find("[")
        end = raw_text.rfind("]")
        if start != -1 and end != -1 and end > start:
            candidate = raw_text[start : end + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                logger.exception("JSON extraction fallback failed")
                return []

        logger.error("No JSON array found in model output")
        return []

    def _to_float(self, value, default: Optional[float] = None) -> Optional[float]:
        if value is None:
            return default

        if isinstance(value, (int, float)):
            return float(value)

        if isinstance(value, str):
            raw = value.strip().lower()
            mapping = {
                "low": 0.30,
                "medium": 0.60,
                "high": 0.85,
                "very high": 0.95,
                "very low": 0.15,
            }
            if raw in mapping:
                return mapping[raw]

            raw = raw.replace("%", "").strip()
            try:
                num = float(raw)
                if num > 1:
                    return round(num / 100.0, 4)
                return num
            except ValueError:
                return default

        return default

    def _clamp_score(self, value, default: Optional[float] = None) -> Optional[float]:
        num = self._to_float(value, default=default)
        if num is None:
            return None
        return max(0.0, min(1.0, num))

    def persist_and_format(self, analysis, raw_text: str) -> List[RecommendationResponse]:
        start = time.perf_counter()
        logger.info("Recommendation parsing started | analysis_id=%s", analysis.id)

        data = self._safe_load_json(raw_text)
        if not isinstance(data, list):
            logger.warning("Model output is not a list | type=%s", type(data).__name__)
            data = []

        recommendations: List[RecommendationResponse] = []

        try:
            for item in data:
                if not isinstance(item, dict):
                    continue

                title = item.get("title") or "Untitled idea"
                summary = item.get("summary") or ""

                virality_score = self._clamp_score(item.get("virality_score"))
                confidence_score = self._clamp_score(item.get("confidence_score"))
                hit_probability = self._clamp_score(item.get("hit_probability"))
                expected_ctr = self._clamp_score(item.get("expected_ctr"))
                search_potential = self._clamp_score(item.get("search_potential"))

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
                    expected_ctr=expected_ctr,
                    search_potential=search_potential,
                    virality_score=virality_score,
                    confidence_score=confidence_score,
                    hit_probability=hit_probability,
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

            self.db.commit()

        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "Recommendation persistence failed; transaction rolled back | analysis_id=%s",
                analysis.id,
            )
            raise

        logger.info(
            "Recommendation parsing completed | count=%s duration_ms=%s",
            len(recommendations),
            round((time.perf_counter() - start) * 1000, 2),
        )
        return recommendations