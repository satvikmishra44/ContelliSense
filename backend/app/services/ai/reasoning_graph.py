import faulthandler
import time
import uuid
from typing import List, TypedDict

from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.db.models.analysis import Analysis
from app.db.models.channel import Channel
from app.schemas.analysis import AnalysisCreateResponse
from app.schemas.channel import ChannelOverviewResponse
from app.schemas.recommendation import RecommendationResponse
from app.schemas.trend import TrendSignalResponse
from app.services.ai.gemini_client import GeminiClient
from app.services.ai.recommendation_engine import RecommendationEngine
from app.services.rag.rag_service import RagService
from app.services.trends.google_trends_service import GoogleTrendsService
from app.services.youtube.channel_analyzer import ChannelAnalyzer
from app.utils.youtube_parsing import parse_channel_url

logger = get_logger("app.services.ai.reasoning_graph")


class ReasoningState(TypedDict):
    channel_overview: ChannelOverviewResponse
    trends: List[TrendSignalResponse]
    rag_context: List[str]
    raw_recommendations_text: str
    recommendations: List[RecommendationResponse]
    analysis_uuid: str


class ReasoningOrchestrator:
    """
    Coordinates the full end-to-end analysis workflow.

    Design rule:
    Trend enrichment is useful but non-critical. If pytrends fails, the pipeline
    should continue with empty trend signals instead of returning HTTP 500.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def run_full_analysis(self, channel_url: str) -> AnalysisCreateResponse:
        request_start = time.perf_counter()
        logger.info("Full analysis started | channel_url=%s", channel_url)

        faulthandler.dump_traceback_later(120, repeat=True)

        try:
            # Step 1: Parse channel URL.
            parsed_channel_id, parsed_handle, parsed_username = parse_channel_url(channel_url)
            logger.info(
                "Parsed channel URL | raw_url=%s channel_id=%s handle=%s username=%s",
                channel_url,
                parsed_channel_id,
                parsed_handle,
                parsed_username,
            )

            # Step 2: Channel analysis.
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
                "STEP 1 END | channel analysis complete | channel_id=%s duration_ms=%s",
                channel_overview.channel_id,
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 3: Persist analysis entity.
            step_start = time.perf_counter()
            logger.info("STEP 2 START | persist analysis entity")

            channel_entity = (
                self.db.query(Channel)
                .filter(Channel.channel_id == channel_overview.channel_id)
                .first()
            )

            if channel_entity is None and not channel_overview.channel_id:
                channel_entity = (
                    self.db.query(Channel)
                    .filter(Channel.url == channel_url)
                    .first()
                )

            if channel_entity is None:
                raise ValueError("Channel not found after analysis")

            analysis_uuid = uuid.uuid4().hex
            analysis = Analysis(
                channel_id=channel_entity.id,
                analysis_uuid=analysis_uuid,
                summary="Auto-generated analysis summary placeholder",
            )
            self.db.add(analysis)
            self.db.commit()
            self.db.refresh(analysis)

            logger.info(
                "STEP 2 END | analysis persisted | analysis_uuid=%s duration_ms=%s",
                analysis_uuid,
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 4: Trend collection - graceful degradation.
            step_start = time.perf_counter()
            logger.info("STEP 3 START | trend collection")

            trend_keyword = (
                channel_entity.handle.lstrip("@")
                if channel_entity.handle
                else (channel_entity.username or "youtube")
            )

            trends_service = GoogleTrendsService()
            try:
                trends = trends_service.fetch_trends(
                    keyword=trend_keyword,
                    region="IN",
                )
            except Exception:
                logger.exception(
                    "Trend collection hard-failed; continuing with empty trends | keyword=%s",
                    trend_keyword,
                )
                trends = []

            logger.info(
                "STEP 3 END | trend collection complete | trend_count=%s duration_ms=%s",
                len(trends),
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 5: Build RAG context.
            step_start = time.perf_counter()
            logger.info("STEP 4 START | rag context build")

            rag_service = RagService(db=self.db, index_name=f"analysis-{analysis_uuid}")
            rag_service.build_context_for_channel(channel_id=channel_entity.id)
            rag_context = rag_service.retrieve_context(
                query="content opportunities and viral ideas",
                k=50,
            )

            logger.info(
                "STEP 4 END | rag context ready | context_count=%s duration_ms=%s",
                len(rag_context),
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 6: Gemini generation.
            step_start = time.perf_counter()
            logger.info("STEP 5 START | gemini recommendation generation")

            gemini_client = GeminiClient()
            prompt = (
                "Given this creator's history and current trends, propose high-probability "
                "future video ideas. Focus on content gaps, trend alignment, audience "
                "interests, and seasonality. Explain why each idea should work and how it "
                "leverages evidence. If trend data is weak or missing, rely more heavily "
                "on channel history, audience continuity, format patterns, and evergreen potential."
            )
            raw_text = gemini_client.generate_recommendations(
                prompt=prompt,
                context_chunks=rag_context,
                max_ideas=10,
            )

            logger.info(
                "STEP 5 END | gemini response received | chars=%s duration_ms=%s",
                len(raw_text) if raw_text else 0,
                round((time.perf_counter() - step_start) * 1000, 2),
            )

            # Step 7: Parse and persist recommendations.
            step_start = time.perf_counter()
            logger.info("STEP 6 START | persist recommendations")

            rec_engine = RecommendationEngine(db=self.db)
            recs = rec_engine.persist_and_format(
                analysis=analysis,
                raw_text=raw_text,
            )

            logger.info(
                "STEP 6 END | recommendations persisted | recommendation_count=%s duration_ms=%s",
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
        finally:
            faulthandler.cancel_dump_traceback_later()