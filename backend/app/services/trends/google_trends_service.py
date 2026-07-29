import time
from typing import List

from pytrends.exceptions import ResponseError, TooManyRequestsError
from pytrends.request import TrendReq

from app.core.logging_config import get_logger
from app.schemas.trend import TrendSignalResponse

logger = get_logger("app.services.trends.google_trends_service")


class GoogleTrendsService:
    """
    Lightweight Google Trends integration.

    Important operational notes:
    - pytrends is unofficial and can return 400/429 frequently.
    - Worldwide trends use geo="" rather than "world".
    - This service should fail gracefully so the full analysis pipeline can continue.
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
        self.trend_req = TrendReq(
            hl="en-US",
            tz=330,
            requests_args=requests_args,
        )

    def _normalize_geo(self, region: str) -> str:
        """
        Convert app-level region values into pytrends-compatible geo codes.

        pytrends expects:
        - "" for worldwide
        - ISO country code like "IN", "US"
        """
        if not region:
            return ""
        normalized = region.strip().lower()
        if normalized in {"world", "global", "worldwide"}:
            return ""
        return region

    def _fallback_keyword(self, keyword: str) -> str:
        """
        Make pytrends queries more robust.

        Handles like 'ChandrKathaByJyoti' or '@Something' can be poor Google Trends
        keywords. We soften them into a plain text keyword.
        """
        cleaned = keyword.strip().lstrip("@")
        return cleaned if cleaned else "youtube"

    def fetch_trends(self, keyword: str, region: str = "world") -> List[TrendSignalResponse]:
        """
        Fetch a simple trend signal for a keyword.

        Returns an empty list when pytrends fails. This is intentional:
        trend enrichment should degrade gracefully instead of crashing analysis.
        """
        original_keyword = keyword
        keyword = self._fallback_keyword(keyword)
        geo = self._normalize_geo(region)

        logger.info(
            "Google Trends fetch started | keyword=%s normalized_keyword=%s region=%s pytrends_geo=%s",
            original_keyword,
            keyword,
            region,
            geo if geo else "WORLDWIDE",
        )

        last_error: Exception | None = None

        for attempt in range(1, 4):
            start = time.perf_counter()
            try:
                logger.info(
                    "Google Trends attempt started | keyword=%s attempt=%s",
                    keyword,
                    attempt,
                )

                self.trend_req.build_payload(
                    [keyword],
                    cat=0,
                    timeframe="today 12-m",
                    geo=geo,
                    gprop="",
                )
                interest_over_time = self.trend_req.interest_over_time()

                if interest_over_time.empty or keyword not in interest_over_time.columns:
                    logger.warning(
                        "Google Trends returned empty data | keyword=%s region=%s attempt=%s duration_ms=%s",
                        keyword,
                        region,
                        attempt,
                        round((time.perf_counter() - start) * 1000, 2),
                    )
                    return []

                series = interest_over_time[keyword]
                latest = float(series.iloc[-1])
                median = float(series.median())
                momentum = latest / median if median else None
                velocity = float(series.iloc[-1] - series.iloc[0])
                confidence = min(1.0, len(series) / 52.0)

                logger.info(
                    "Google Trends fetch complete | keyword=%s points=%s duration_ms=%s",
                    keyword,
                    len(series),
                    round((time.perf_counter() - start) * 1000, 2),
                )

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

            except TooManyRequestsError as exc:
                last_error = exc
                logger.warning(
                    "Google Trends rate-limited (429) | keyword=%s attempt=%s",
                    keyword,
                    attempt,
                )
                time.sleep(attempt * 3)
            except ResponseError as exc:
                last_error = exc
                logger.warning(
                    "Google Trends response error | keyword=%s attempt=%s error=%s",
                    keyword,
                    attempt,
                    str(exc),
                )
                # 400-type cases are often unrecoverable for that exact keyword/geo combo.
                break
            except Exception as exc:
                last_error = exc
                logger.exception(
                    "Unexpected Google Trends failure | keyword=%s attempt=%s",
                    keyword,
                    attempt,
                )
                break

        logger.error(
            "Google Trends fetch failed after retries | keyword=%s region=%s last_error=%s",
            keyword,
            region,
            str(last_error) if last_error else "unknown",
        )
        return []