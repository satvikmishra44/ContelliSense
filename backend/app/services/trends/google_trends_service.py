import time
from typing import List

from pytrends.exceptions import ResponseError, TooManyRequestsError
from pytrends.request import TrendReq

from app.core.logging_config import get_logger
from app.schemas.trend import TrendSignalResponse

logger = get_logger("app.services.trends.google_trends_service")


class GoogleTrendsService:
    """
    Niche-aware Google Trends integration.

    Instead of querying the channel handle (low-volume, meaningless term),
    this service accepts a list of niche-derived keywords and queries each
    one, merging results. Failures on individual keywords degrade gracefully.
    """

    def __init__(self) -> None:
        requests_args = {
            "headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                )
            }
        }
        self.trend_req = TrendReq(hl="en-US", tz=330, requests_args=requests_args)

    def _normalize_geo(self, region: str) -> str:
        if not region:
            return ""
        normalized = region.strip().lower()
        if normalized in {"world", "global", "worldwide"}:
            return ""
        return region

    def _fetch_single_keyword(self, keyword: str, geo: str) -> TrendSignalResponse | None:
        for attempt in range(1, 3):
            try:
                self.trend_req.build_payload(
                    [keyword],
                    cat=0,
                    timeframe="today 3-m",
                    geo=geo,
                    gprop="",
                )
                interest_over_time = self.trend_req.interest_over_time()

                if interest_over_time.empty or keyword not in interest_over_time.columns:
                    logger.warning("Empty trend data | keyword=%s attempt=%s", keyword, attempt)
                    return None

                series = interest_over_time[keyword]
                latest = float(series.iloc[-1])
                median = float(series.median())
                momentum = latest / median if median else None
                velocity = float(series.iloc[-1] - series.iloc[0])
                confidence = min(1.0, len(series) / 12.0)

                return TrendSignalResponse(
                    source="google_trends",
                    keyword=keyword,
                    category=None,
                    region=geo if geo else "WORLDWIDE",
                    momentum_score=momentum,
                    velocity_score=velocity,
                    confidence_score=confidence,
                )

            except TooManyRequestsError:
                logger.warning("Rate-limited (429) | keyword=%s attempt=%s", keyword, attempt)
                time.sleep(attempt * 4)
            except ResponseError as exc:
                logger.warning("Response error | keyword=%s error=%s", keyword, str(exc))
                return None
            except Exception:
                logger.exception("Unexpected trend fetch failure | keyword=%s", keyword)
                return None

        return None

    def fetch_trends_for_keywords(
        self,
        keywords: List[str],
        region: str = "IN",
    ) -> List[TrendSignalResponse]:
        geo = self._normalize_geo(region)
        logger.info("Multi-keyword trend fetch started | keywords=%s region=%s", keywords, region)

        results: List[TrendSignalResponse] = []
        for keyword in keywords:
            signal = self._fetch_single_keyword(keyword, geo)
            if signal:
                results.append(signal)
            time.sleep(1.5)

        logger.info(
            "Multi-keyword trend fetch completed | requested=%s successful=%s",
            len(keywords),
            len(results),
        )
        return results