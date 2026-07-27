import time
from typing import Any, Dict, Tuple


class SimpleTTLCache:
    """
    Minimal TTL cache for short-lived data (e.g., trends for a keyword).

    This is in-memory and per-process; later you can swap it out for Redis.
    """

    def __init__(self, ttl_seconds: int = 300) -> None:
        self.ttl = ttl_seconds
        self.store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self.store.get(key)
        if not item:
            return None
        ts, value = item
        if time.time() - ts > self.ttl:
            self.store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self.store[key] = (time.time(), value)