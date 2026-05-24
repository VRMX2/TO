from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime, timezone
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .security import (
    ApiKeyMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    is_public_path,
)
from db.database import init_db

from api.routes_game import router as game_router
from api.routes_network import router as network_router
from api.routes_ai import router as ai_router
from api.websocket import router as websocket_router

app = FastAPI(
    title=settings.app_name,
    description="CyberGameGT - Game Theoretic Cyber Defense Simulator API",
    version="2.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

logger = logging.getLogger("cybergamegt.startup")
if not logger.handlers:
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

app.state.started_at = None
app.state.db_ready = False

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.api_rate_limit_per_minute)
app.add_middleware(ApiKeyMiddleware)

if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.trusted_hosts,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    detail = str(exc) if settings.debug else "An internal server error occurred."
    return JSONResponse(status_code=500, content={"detail": detail})


@app.on_event("startup")
def startup_event():
    logger.info("Starting %s (debug=%s, api_key=%s)", settings.app_name, settings.debug, bool(settings.api_key))
    app.state.started_at = datetime.now(timezone.utc).isoformat()
    try:
        init_db()
        app.state.db_ready = True
        logger.info("Database initialized successfully")
    except Exception:
        app.state.db_ready = False
        logger.exception("Database initialization failed")


app.include_router(game_router)
app.include_router(network_router)
app.include_router(ai_router)
app.include_router(websocket_router)


@app.get("/")
def read_root():
    return {
        "name": settings.app_name,
        "status": "online",
        "version": app.version,
        "docs_enabled": settings.debug,
        "auth_required": bool(settings.api_key),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": app.version,
        "db_ready": app.state.db_ready,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ready")
def ready():
    if not app.state.db_ready:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "service": settings.app_name,
                "db_ready": app.state.db_ready,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
    return {
        "status": "ready",
        "service": settings.app_name,
        "db_ready": app.state.db_ready,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
