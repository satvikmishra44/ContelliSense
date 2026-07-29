from typing import List

from pytrends.request import TrendReq

from app.schemas.trend import TrendSignalResponse


class GoogleTrendsService:
    def __init__(self) -> None:
        self.trend_req = TrendReq(hl="en-US", tz=360)

    def fetch_trends(self, keyword: str, region: str = "") -> List[TrendSignalResponse]:
        """
        Simple Google Trends wrapper: gets interest over time and computes momentum/velocity.
        """
        self.trend_req.build_payload([keyword], geo=region)
        interest_over_time = self.trend_req.interest_over_time()
        if interest_over_time.empty:
            return []

        series = interest_over_time[keyword]
        # Momentum: latest value / median
        latest = float(series.iloc[-1])
        median = float(series.median())
        momentum = latest / median if median else None

        # Velocity: difference between last and first value
        velocity = float(series.iloc[-1] - series.iloc[0])

        # Confidence: rough heuristic based on number of data points
        confidence = min(1.0, len(series) / 52.0)

        return [
            TrendSignalResponse(
                source="google_trends",
                keyword=keyword,
                category=None,
                region=region,
                momentum_score=momentum,
                velocity_score=velocity,
                confidence_score=confidence,
            )
        ]