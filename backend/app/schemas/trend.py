from typing import Optional

from pydantic import BaseModel


class TrendSignalResponse(BaseModel):
    source: str
    keyword: str
    category: Optional[str]
    region: Optional[str]

    momentum_score: Optional[float]
    velocity_score: Optional[float]
    confidence_score: Optional[float]