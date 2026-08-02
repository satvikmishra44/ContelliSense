from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.dependencies import DbSessionDep
from app.db.session import get_db
from app.db.models.analysis import Analysis
from app.schemas.analysis import AnalysisCreateResponse, AnalysisHistoryItem
from app.schemas.channel import ChannelCreateRequest, ChannelOverviewResponse, VideoSummary
from app.schemas.recommendation import RecommendationResponse
from app.schemas.trend import TrendSignalResponse
from app.services.ai.reasoning_graph import ReasoningOrchestrator
from app.workers.background_tasks import generate_report_background

router = APIRouter()


@router.post("/full", response_model=AnalysisCreateResponse)
def run_full_analysis(
    payload: ChannelCreateRequest,
    db: DbSessionDep,
    background_tasks: BackgroundTasks,
):
    orchestrator = ReasoningOrchestrator(db=db)
    try:
        analysis_result = orchestrator.run_full_analysis(channel_url=str(payload.channel_url))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    background_tasks.add_task(generate_report_background, db, analysis_result.analysis_uuid)
    return analysis_result


@router.get("/history", response_model=list[AnalysisHistoryItem])
def get_analysis_history(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(50).all()
    return [
        AnalysisHistoryItem(
            analysis_uuid=a.analysis_uuid,
            channel_title=a.channel.title if a.channel else None,
            channel_handle=a.channel.handle if a.channel else None,
            created_at=a.created_at,
            summary=a.summary,
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

    channel_obj = analysis.channel
    if not channel_obj:
        raise HTTPException(status_code=404, detail="Channel data missing for this analysis")

    videos = list(channel_obj.videos or [])

    views_list = [v.views for v in videos if v.views is not None]
    engagement_list = [v.engagement_rate for v in videos if v.engagement_rate is not None]

    avg_views = round(sum(views_list) / len(views_list), 2) if views_list else None
    avg_engagement_rate = (
        round(sum(engagement_list) / len(engagement_list), 4)
        if engagement_list
        else None
    )

    upload_frequency_per_week = None
    published_dates = [v.published_at for v in videos if v.published_at is not None]
    if len(published_dates) >= 2:
        published_dates.sort()
        span_days = (published_dates[-1] - published_dates[0]).days or 1
        weeks = span_days / 7
        upload_frequency_per_week = round(len(published_dates) / weeks, 2) if weeks > 0 else None

    top_videos = sorted(
        videos,
        key=lambda v: (
            v.views if v.views is not None else -1,
            v.published_at.isoformat() if v.published_at else "",
        ),
        reverse=True,
    )[:10]

    channel_response = ChannelOverviewResponse(
        channel_id=channel_obj.channel_id,
        handle=channel_obj.handle,
        username=channel_obj.username,
        title=channel_obj.title,
        url=channel_obj.url,
        avg_views=avg_views,
        avg_engagement_rate=avg_engagement_rate,
        upload_frequency_per_week=upload_frequency_per_week,
        top_videos=[
            VideoSummary(
                video_id=v.video_id,
                title=v.title,
                url=v.url,
                views=v.views,
                likes=v.likes,
                engagement_rate=v.engagement_rate,
                published_at=v.published_at.isoformat() if v.published_at else None,
                duration_seconds=v.duration_seconds,
            )
            for v in top_videos
        ],
    )

    recommendation_response = [
        RecommendationResponse(
            id=r.id,
            title=r.title,
            hook=r.hook,
            thumbnail_idea=r.thumbnail_idea,
            summary=r.summary,
            target_audience=r.target_audience,
            why_it_should_work=r.why_it_should_work,
            supporting_evidence=r.supporting_evidence,
            trend_explanation=r.trend_explanation,
            risk_factors=r.risk_factors,
            estimated_effort=r.estimated_effort,
            expected_ctr=r.expected_ctr,
            search_potential=r.search_potential,
            virality_score=r.virality_score,
            confidence_score=r.confidence_score,
            hit_probability=r.hit_probability,
            publishing_window=r.publishing_window,
        )
        for r in (analysis.recommendations or [])
    ]

    return AnalysisCreateResponse(
        analysis_uuid=analysis.analysis_uuid,
        channel=channel_response,
        trends=[],
        recommendations=recommendation_response,
        report_download_path=analysis.report_path,
    )