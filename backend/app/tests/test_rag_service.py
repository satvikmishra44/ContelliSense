from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.rag.rag_service import RagService


def test_rag_service_empty_index():
    db: Session = SessionLocal()
    service = RagService(db=db, index_name="test-index")
    context = service.retrieve_context(query="anything", k=5)
    assert context == []