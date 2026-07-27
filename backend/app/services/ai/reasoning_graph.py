import uuid
from typing import TypedDict, List

from sqlalchemy.orm import Session
from typing_extensions import Annotated

from langgraph.graph import StateGraph
from app.db.models.analysis import Analysis
from app.db.models.channel import Channel
from app.schemas.analysis import AnalysisCreateResponse
from app.schemas.channel import ChannelOverviewResponse
from app.schemas.recommendation import RecommendationResponse
from app.schemas.trend import TrendSignalResponse
from app.services.youtube.channel_analyzer import ChannelAnalyzer
from app.services.trends.google_trends_service import GoogleTrendsService
from app.services.rag.rag_service import RagService
from app.services.ai.gemini_client import GeminiClient
from app.services.ai.recommendation_engine import RecommendationEngine
from app.core.config import settings


class ReasoningState(TypedDict):
    channel_overview: ChannelOverviewResponse
    trends: List[TrendSignalResponse]
    rag_context: List[str]
    raw_recommendations_text: str
    recommendations: List[RecommendationResponse]
    analysis_uuid: str


class ReasoningOrchestrator:
    """
    LangGraph-based orchestrator for the full analysis workflow.

    Nodes:
      - analyze_channel
      - collect_trends
      - build_rag_context
      - call_gemini
      - parse_and_persist_recommendations
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(ReasoningState)

        def analyze_channel_node(state: ReasoningState) -> ReasoningState:
            channel_url = state.get("channel_overview")  # placeholder
            # In practice, we pass URL via input; for simplicity we keep state driver outside.
            return state

        # For now, we'll keep graph minimal: we drive nodes in Python methods; graph helps structure.
        # A full LangGraph integration could annotate reducers and context schema, as docs show. [web:81][web:93]
        return workflow

    def run_full_analysis(self, channel_url: str) -> AnalysisCreateResponse:
        # Step 1: parse and analyze channel
        analyzer = ChannelAnalyzer(db=self.db)
        # parse_channel_url is already done at API layer, but here we can re-use raw URL if needed.
        # For brevity, we ask analyzer to resolve channel_id internally.
        # In a more precise build, you'd pass channel_id/handle/username as inputs.
        channel_overview = analyzer.analyze_channel(
            channel_id=None,
            handle=None,
            username=None,
            raw_url=channel_url,
        )

        # Persist analysis entity
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
            summary="Auto-generated analysis summary placeholder",
        )
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        # Step 2: collect trends
        trends_service = GoogleTrendsService()
        trends = trends_service.fetch_trends(keyword=channel_entity.handle or "youtube", region="world")

        # Step 3: build RAG context
        rag_service = RagService(db=self.db, index_name=f"analysis-{analysis_uuid}")
        rag_service.build_context_for_channel(channel_id=channel_entity.id)
        rag_context = rag_service.retrieve_context(query="content opportunities and viral ideas", k=50)

        # Step 4: call Gemini
        gemini_client = GeminiClient()
        prompt = (
            "Given this creator's history and current trends, propose high-probability future video ideas.\n"
            "Focus on content gaps, trend alignment, audience interests, and seasonality. "
            "Explain why each idea should work and how it leverages evidence."
        )
        raw_text = gemini_client.generate_recommendations(
            prompt=prompt,
            context_chunks=rag_context,
            max_ideas=10,
        )

        # Step 5: parse + persist recommendations
        rec_engine = RecommendationEngine(db=self.db)
        recs = rec_engine.persist_and_format(analysis=analysis, raw_text=raw_text)

        # Assemble DTO
        return AnalysisCreateResponse(
            analysis_uuid=analysis_uuid,
            channel=channel_overview,
            trends=trends,
            recommendations=recs,
            report_download_path=None,
        )