from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.ai.reasoning_graph import ReasoningOrchestrator


def test_reasoning_orchestrator_init():
    db: Session = SessionLocal()
    orchestrator = ReasoningOrchestrator(db=db)
    assert orchestrator is not None