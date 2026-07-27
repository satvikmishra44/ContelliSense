import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.api.dependencies import DbSessionDep
from app.db.models.analysis import Analysis

router = APIRouter()


@router.get(
    "/download/{analysis_uuid}",
    summary="Download Excel report for a given analysis",
)
def download_report(analysis_uuid: str, db: DbSessionDep):
    analysis = db.query(Analysis).filter(Analysis.analysis_uuid == analysis_uuid).first()
    if not analysis or not analysis.report_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    if not os.path.exists(analysis.report_path):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Report path missing on disk",
        )

    return FileResponse(
        analysis.report_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(analysis.report_path),
    )