from sqlalchemy.orm import Session

from app.services.reports.excel_report_service import ExcelReportService


def generate_report_background(db: Session, analysis_uuid: str) -> None:
    """
    Background task to generate Excel report after analysis completion.

    FastAPI's BackgroundTasks are suitable for short, non-critical tasks that
    can run after sending the HTTP response. [web:76][web:78]
    """
    service = ExcelReportService(db=db)
    try:
        service.generate_report(analysis_uuid=analysis_uuid)
    except Exception as exc:
        # In production, you'd log this and add observability.
        # For Phase 1, we keep error handling simple.
        print(f"Error generating report for {analysis_uuid}: {exc}")