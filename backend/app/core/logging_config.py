# import logging
# from logging import Logger

# from .config import settings


# def setup_logging() -> Logger:
#     logging.basicConfig(
#         level=getattr(logging, settings.app_log_level.upper(), logging.INFO),
#         format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
#     )
#     logger = logging.getLogger(settings.app_name)
#     logger.info("Logging configured with level %s", settings.app_log_level)
#     return logger


# logger = setup_logging()

import logging
import logging.config
import sys
from contextvars import ContextVar

# Request-scoped context variable.
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="-")

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "()": "app.core.logging_config.RequestAwareFormatter",
            "format": "%(asctime)s | %(levelname)s | %(name)s | request_id=%(request_id)s | %(message)s",
        },
        "access": {
            "()": "app.core.logging_config.RequestAwareFormatter",
            "format": "%(asctime)s | %(levelname)s | %(name)s | request_id=%(request_id)s | %(message)s",
        },
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "stream": sys.stdout,
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": "INFO",
        },
        "uvicorn": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.error": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False,
        },
        "app": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False,
        },
    },
}


class RequestAwareFormatter(logging.Formatter):
    """
    Adds request_id from ContextVar into every log line.
    """

    def format(self, record: logging.LogRecord) -> str:
        record.request_id = request_id_ctx_var.get("-")
        return super().format(record)


def setup_logging() -> None:
    logging.config.dictConfig(LOGGING_CONFIG)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)