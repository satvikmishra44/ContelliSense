import time
import uuid
from typing import List, TypedDict
import json

from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.db.models.analysis import Analysis
from app.db.models.channel import Channel
from app.db.models.trend import Trend
from app.schemas.analysis import AnalysisCreateResponse
from app.schemas.channel import ChannelOverviewResponse
from app.schemas.recommendation import RecommendationResponse
from app.schemas.trend import TrendSignalResponse
from app.services.ai.gemini_client import GeminiClient
from app.services.ai.niche_classifier import NicheClassifier
from app.services.ai.recommendation_engine import RecommendationEngine
from app.services.rag.rag_service import RagService
from app.services.trends.google_trends_service import GoogleTrendsService
from app.services.youtube.channel_analyzer import ChannelAnalyzer
from app.utils.youtube_parsing import parse_channel_url

logger = get_logger("app.services.ai.reasoning_graph")


class ReasoningOrchestrator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _persist_google_trends(
        self,
        trends: List[TrendSignalResponse],
    ) -> List[Trend]:
        if not trends:
            logger.warning("No Google Trends signals available to persist")
            return []

        trend_entities = [
            Trend(
                source=trend.source,
                keyword=trend.keyword,
                category=trend.category,
                region=trend.region,
                momentum_score=trend.momentum_score,
                velocity_score=trend.velocity_score,
                confidence_score=trend.confidence_score,
                raw_payload=json.dumps(
                    {
                        "keyword": trend.keyword,
                        "region": trend.region,
                        "momentum_score": trend.momentum_score,
                        "velocity_score": trend.velocity_score,
                        "confidence_score": trend.confidence_score,
                    }
                ),
            )
            for trend in trends
        ]

        try:
            self.db.add_all(trend_entities)
            self.db.commit()

            for trend_entity in trend_entities:
                self.db.refresh(trend_entity)

            logger.info(
                "Google Trends persisted to database | count=%s ids=%s",
                len(trend_entities),
                [trend_entity.id for trend_entity in trend_entities],
            )

            return trend_entities

        except Exception:
            self.db.rollback()
            logger.exception(
                "Google Trends persistence failed | signals_count=%s",
                len(trends),
            )
            raise
        
    def run_full_analysis(self, channel_url: str) -> AnalysisCreateResponse:
        request_start = time.perf_counter()
        logger.info("Full analysis started | channel_url=%s", channel_url)

        try:
            parsed_channel_id, parsed_handle, parsed_username = parse_channel_url(channel_url)

            step_start = time.perf_counter()
            logger.info("STEP 1 START | channel analysis")

            analyzer = ChannelAnalyzer(db=self.db)
            channel_overview = analyzer.analyze_channel(
                channel_id=parsed_channel_id,
                handle=parsed_handle,
                username=parsed_username,
                raw_url=channel_url,
            )

            logger.info(
                "STEP 1 END | channel analysis complete | duration_ms=%s",
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            step_start = time.perf_counter()
            logger.info("STEP 2 START | persist analysis entity")

            channel_entity = (
                self.db.query(Channel)
                .filter(Channel.channel_id == channel_overview.channel_id)
                .first()
            )
            if channel_entity is None:
                raise ValueError("Channel not found after analysis")

            analysis_uuid = uuid.uuid4().hex
            analysis = Analysis(
                channel_id=channel_entity.id,
                analysis_uuid=analysis_uuid,
                summary="Auto-generated analysis summary",
            )
            self.db.add(analysis)
            self.db.commit()
            self.db.refresh(analysis)

            logger.info(
                "STEP 2 END | analysis persisted | analysis_uuid=%s duration_ms=%s",
                analysis_uuid,
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 3: Niche classification from video titles.
            step_start = time.perf_counter()
            logger.info("STEP 3 START | niche classification")

            video_titles = [v.title for v in channel_overview.top_videos if v.title]
            classifier = NicheClassifier()
            niche_result = classifier.classify(video_titles)

            logger.info(
                "STEP 3 END | niche classified | primary_topic=%s queries=%s duration_ms=%s",
                niche_result["primary_topic"],
                niche_result["search_queries"],
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 4: Trend collection using niche-derived multi-keyword search.
            step_start = time.perf_counter()
            logger.info("STEP 4 START | trend collection")

            trends_service = GoogleTrendsService()

            try:
                trends = trends_service.fetch_trends_for_keywords(
                    keywords=niche_result["search_queries"],
                    region="IN",
                )

                logger.info(
                    "Google Trends returned to orchestrator | count=%s data=%s",
                    len(trends),
                    [
                        {
                            "keyword": trend.keyword,
                            "momentum_score": trend.momentum_score,
                            "velocity_score": trend.velocity_score,
                            "confidence_score": trend.confidence_score,
                        }
                        for trend in trends
                    ],
                )

                persisted_trends = self._persist_google_trends(trends)

                logger.info(
                    "Google Trends fetch + persistence verified | fetched=%s persisted=%s",
                    len(trends),
                    len(persisted_trends),
                )

            except Exception:
                logger.exception("Trend collection or persistence failed; continuing with empty trends")
                trends = []
            logger.info(
                "STEP 4 END | trend collection complete | trend_count=%s duration_ms=%s",
                len(trends),
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 5: RAG context build.
            step_start = time.perf_counter()
            logger.info("STEP 5 START | rag context build")

            rag_service = RagService(db=self.db, index_name=f"analysis-{analysis_uuid}")
            rag_service.build_context_for_channel(channel_id=channel_entity.id)
            rag_context = rag_service.retrieve_context(
                query="content opportunities and viral ideas",
                k=15,
            )

            logger.info(
                "STEP 5 END | rag context ready | context_count=%s duration_ms=%s",
                len(rag_context),
                round((time.perf_counter() - step_start) * 1000, 2),
            )            

            # Step 6: Gemini generation.
            step_start = time.perf_counter()
            logger.info("STEP 6 START | gemini recommendation generation")

            trend_summary = "\n".join(
                f"- {t.keyword}: momentum={t.momentum_score}, "
                f"velocity={t.velocity_score}, "
                f"confidence={t.confidence_score}"
                for t in trends
            )

            if not trend_summary:
                trend_summary = (
                    "No Google Trends data was available for this analysis. "
                    "Do not claim a trend is rising unless supported by channel context."
                )

            logger.info(
                "Trend summary passed to Gemini | trend_count=%s trend_summary=%r",
                len(trends),
                trend_summary,
            )

            gemini_client = GeminiClient()
            prompt = (
                f"This channel's primary niche is '{niche_result['primary_topic']}'. "
                "Propose high-probability future video ideas that fit this niche, "
                "leveraging channel history, audience continuity, format patterns, "
                "and any trend signals provided. Explain reasoning for each idea."
            )

            try:
                raw_text = gemini_client.generate_recommendations(
                    prompt=prompt,
                    context_chunks=rag_context,
                    trend_summary=trend_summary,
                    max_ideas=10,
                )
            except Exception:
                logger.exception("Gemini generation failed; continuing with empty recommendations")
                raw_text = "[]"

            logger.info(
                "STEP 6 END | gemini response received | chars=%s duration_ms=%s",
                len(raw_text) if raw_text else 0,
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 7: Persist recommendations.
            step_start = time.perf_counter()
            logger.info("STEP 7 START | persist recommendations")

            rec_engine = RecommendationEngine(db=self.db)
            recs = rec_engine.persist_and_format(analysis=analysis, raw_text=raw_text)

            logger.info(
                "STEP 7 END | recommendations persisted | count=%s duration_ms=%s",
                len(recs),
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            total_duration = round((time.perf_counter() - request_start) * 1000, 2)
            logger.info(
                "Full analysis completed | analysis_uuid=%s total_duration_ms=%s",
                analysis_uuid,
                total_duration,
            )

            return AnalysisCreateResponse(
                analysis_uuid=analysis_uuid,
                channel=channel_overview,
                trends=trends,
                recommendations=recs,
                report_download_path=None,
            )

        except Exception:
            logger.exception("Full analysis failed | channel_url=%s", channel_url)
            raise