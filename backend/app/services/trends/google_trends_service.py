import time
from typing import List

from pytrends.exceptions import ResponseError, TooManyRequestsError
from pytrends.request import TrendReq

from app.core.logging_config import get_logger
from app.schemas.trend import TrendSignalResponse

logger = get_logger("app.services.trends.google_trends_service")


class GoogleTrendsService:
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
        if not region:
            return ""

        normalized = region.strip().lower()
        if normalized in {"world", "global", "worldwide"}:
            return ""

        return region.strip().upper()

    def _fetch_single_keyword(
        self,
        keyword: str,
        geo: str,
    ) -> TrendSignalResponse | None:
        normalized_keyword = keyword.strip()

        if not normalized_keyword:
            logger.warning("Skipping empty Google Trends keyword")
            return None

        for attempt in range(1, 3):
            try:
                logger.info(
                    "Google Trends request started | keyword=%s geo=%s attempt=%s",
                    normalized_keyword,
                    geo or "WORLDWIDE",
                    attempt,
                )

                self.trend_req.build_payload(
                    kw_list=[normalized_keyword],
                    cat=0,
                    timeframe="today 3-m",
                    geo=geo,
                    gprop="",
                )

                interest_over_time = self.trend_req.interest_over_time()

                logger.info(
                    "Google Trends dataframe received | keyword=%s shape=%s columns=%s empty=%s",
                    normalized_keyword,
                    interest_over_time.shape,
                    list(interest_over_time.columns),
                    interest_over_time.empty,
                )

                if interest_over_time.empty:
                    logger.warning(
                        "Google Trends returned empty dataframe | keyword=%s geo=%s attempt=%s",
                        normalized_keyword,
                        geo or "WORLDWIDE",
                        attempt,
                    )
                    return None

                if normalized_keyword not in interest_over_time.columns:
                    logger.warning(
                        "Google Trends keyword missing from dataframe columns | keyword=%s columns=%s",
                        normalized_keyword,
                        list(interest_over_time.columns),
                    )
                    return None

                series = interest_over_time[normalized_keyword].dropna()

                if series.empty:
                    logger.warning(
                        "Google Trends series is empty after dropping nulls | keyword=%s",
                        normalized_keyword,
                    )
                    return None

                latest = float(series.iloc[-1])
                first = float(series.iloc[0])
                median = float(series.median())
                maximum = float(series.max())

                momentum = round(latest / median, 4) if median > 0 else None
                velocity = round(latest - first, 4)
                confidence = round(min(1.0, len(series) / 12.0), 4)

                is_partial = None
                if "isPartial" in interest_over_time.columns:
                    is_partial = bool(interest_over_time["isPartial"].iloc[-1])

                logger.info(
                    "Google Trends result extracted | keyword=%s points=%s first=%s latest=%s "
                    "median=%s max=%s momentum=%s velocity=%s confidence=%s is_partial=%s "
                    "recent_values=%s",
                    normalized_keyword,
                    len(series),
                    first,
                    latest,
                    median,
                    maximum,
                    momentum,
                    velocity,
                    confidence,
                    is_partial,
                    series.tail(5).tolist(),
                )

                return TrendSignalResponse(
                    source="google_trends",
                    keyword=normalized_keyword,
                    category=None,
                    region=geo or "WORLDWIDE",
                    momentum_score=momentum,
                    velocity_score=velocity,
                    confidence_score=confidence,
                )

            except TooManyRequestsError:
                wait_seconds = attempt * 4

                logger.warning(
                    "Google Trends rate-limited (429) | keyword=%s geo=%s attempt=%s wait_seconds=%s",
                    normalized_keyword,
                    geo or "WORLDWIDE",
                    attempt,
                    wait_seconds,
                )

                time.sleep(wait_seconds)

            except ResponseError as exc:
                logger.warning(
                    "Google Trends response error | keyword=%s geo=%s attempt=%s error=%s",
                    normalized_keyword,
                    geo or "WORLDWIDE",
                    attempt,
                    str(exc),
                )
                return None

            except Exception:
                logger.exception(
                    "Unexpected Google Trends fetch failure | keyword=%s geo=%s attempt=%s",
                    normalized_keyword,
                    geo or "WORLDWIDE",
                    attempt,
                )
                return None

        logger.error(
            "Google Trends keyword failed after all retries | keyword=%s geo=%s",
            normalized_keyword,
            geo or "WORLDWIDE",
        )
        return None

    def fetch_trends_for_keywords(
        self,
        keywords: List[str],
        region: str = "IN",
    ) -> List[TrendSignalResponse]:
        geo = self._normalize_geo(region)
        cleaned_keywords = list(
            dict.fromkeys(
                keyword.strip()
                for keyword in keywords
                if keyword and keyword.strip()
            )
        )

        logger.info(
            "Google Trends multi-keyword fetch started | requested_keywords=%s cleaned_keywords=%s region=%s",
            keywords,
            cleaned_keywords,
            geo or "WORLDWIDE",
        )

        results: List[TrendSignalResponse] = []
        failed_keywords: List[str] = []

        for index, keyword in enumerate(cleaned_keywords, start=1):
            logger.info(
                "Google Trends processing keyword | position=%s total=%s keyword=%s",
                index,
                len(cleaned_keywords),
                keyword,
            )

            signal = self._fetch_single_keyword(keyword, geo)

            if signal is not None:
                results.append(signal)
            else:
                failed_keywords.append(keyword)

            if index < len(cleaned_keywords):
                time.sleep(1.5)

        logger.info(
            "Google Trends multi-keyword fetch completed | requested=%s successful=%s failed=%s "
            "successful_keywords=%s failed_keywords=%s extracted_results=%s",
            len(cleaned_keywords),
            len(results),
            len(failed_keywords),
            [result.keyword for result in results],
            failed_keywords,
            [
                {
                    "keyword": result.keyword,
                    "momentum_score": result.momentum_score,
                    "velocity_score": result.velocity_score,
                    "confidence_score": result.confidence_score,
                }
                for result in results
            ],
        )

        return results