import logging
from logging import Logger

from .config import settings


def setup_logging() -> Logger:
    logging.basicConfig(
        level=getattr(logging, settings.app_log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    logger = logging.getLogger(settings.app_name)
    logger.info("Logging configured with level %s", settings.app_log_level)
    return logger


logger = setup_logging()