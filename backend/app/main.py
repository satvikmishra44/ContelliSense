import faulthandler
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.middleware import RequestLoggingMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger("app.main")

# Enable traceback dumps for stuck/hung code.
faulthandler.enable(file=sys.stderr, all_threads=True)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(RequestLoggingMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    logger.info(
        "FastAPI application created | env=%s app_name=%s",
        settings.app_env,
        settings.app_name,
    )
    return app


app = create_app()