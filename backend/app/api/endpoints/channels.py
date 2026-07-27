from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import DbSessionDep
from app.schemas.channel import ChannelCreateRequest, ChannelOverviewResponse
from app.services.youtube.channel_analyzer import ChannelAnalyzer
from app.utils.youtube_parsing import parse_channel_url

router = APIRouter()


@router.post(
    "/analyze",
    response_model=ChannelOverviewResponse,
    summary="Analyze a YouTube channel",
)
def analyze_channel(payload: ChannelCreateRequest, db: DbSessionDep):
    channel_id, handle, username = parse_channel_url(payload.channel_url)
    if not channel_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract channel ID from URL",
        )

    analyzer = ChannelAnalyzer(db=db)
    overview = analyzer.analyze_channel(
        channel_id=channel_id,
        handle=handle,
        username=username,
        raw_url=str(payload.channel_url),
    )

    return overview