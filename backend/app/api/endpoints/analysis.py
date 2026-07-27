from fastapi import APIRouter, HTTPException, status, BackgroundTasks

from app.api.dependencies import DbSessionDep
from app.schemas.channel import ChannelCreateRequest
from app.schemas.analysis import AnalysisCreateResponse
from app.services.ai.reasoning_graph import ReasoningOrchestrator
from app.workers.background_tasks import generate_report_background

router = APIRouter()


@router.post(
    "/full",
    response_model=AnalysisCreateResponse,
    summary="Run full analysis: channel + trends + AI recommendations",
)
def run_full_analysis(
    payload: ChannelCreateRequest,
    db: DbSessionDep,
    background_tasks: BackgroundTasks,
):
    orchestrator = ReasoningOrchestrator(db=db)
    try:
        analysis_result = orchestrator.run_full_analysis(channel_url=str(payload.channel_url))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Kick off Excel report generation in background (short task).
    background_tasks.add_task(
        generate_report_background,
        db,
        analysis_result.analysis_uuid,
    )

    return analysis_result