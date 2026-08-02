from fastapi import APIRouter, HTTPException, status, BackgroundTasks

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.analysis import Analysis
from app.schemas.analysis import AnalysisCreateResponse, AnalysisHistoryItem
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

@router.get("/history", response_model=list[AnalysisHistoryItem])
def get_analysis_history(db: Session = Depends(get_db)):
    analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        AnalysisHistoryItem(
            analysis_uuid=a.analysis_uuid,
            channel_title=a.channel.title if a.channel else None,
            channel_handle=a.channel.handle if a.channel else None,
            created_at=a.created_at,
            summary=a.summary if hasattr(a, "summary") else None,
        )
        for a in analyses
    ]


@router.get("/{analysis_uuid}", response_model=AnalysisCreateResponse)
def get_analysis_by_uuid(analysis_uuid: str, db: Session = Depends(get_db)):
    analysis = (
        db.query(Analysis)
        .filter(Analysis.analysis_uuid == analysis_uuid)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return AnalysisCreateResponse(
        analysis_uuid=analysis.analysis_uuid,
        channel=analysis.channel.to_overview_response(),  # adapt to your model
        trends=[t.to_response() for t in analysis.trend_signals],
        recommendations=[r.to_response() for r in analysis.recommendations],
        report_download_path=analysis.report_download_path,
    )