from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    init_db()

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
