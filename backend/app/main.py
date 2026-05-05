from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime, timezone
from .config import settings
from db.database import init_db

# Import routers
from api.routes_game import router as game_router
from api.routes_network import router as network_router
from api.routes_ai import router as ai_router
from api.websocket import router as websocket_router

app = FastAPI(
    title=settings.app_name,
    description="CyberGameGT - Game Theoretic Cyber Defense Simulator API",
    version="1.0.0"
)

logger = logging.getLogger("cybergamegt.startup")
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

app.state.started_at = None
app.state.db_ready = False

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
@app.on_event("startup")
def startup_event():
    logger.info("Starting %s", settings.app_name)
    app.state.started_at = datetime.now(timezone.utc).isoformat()
    try:
        init_db()
        app.state.db_ready = True
        logger.info("Database initialized successfully")
    except Exception:
        app.state.db_ready = False
        logger.exception("Database initialization failed")

# Include Routers
app.include_router(game_router)
app.include_router(network_router)
app.include_router(ai_router)
app.include_router(websocket_router)


@app.get("/")
def read_root():
    return {
        "name": settings.app_name,
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": app.version,
        "db_ready": app.state.db_ready,
        "started_at": app.state.started_at,
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
                "started_at": app.state.started_at,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
    return {
        "status": "ready",
        "service": settings.app_name,
        "db_ready": app.state.db_ready,
        "started_at": app.state.started_at,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
