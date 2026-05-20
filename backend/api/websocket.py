import asyncio
import json
import logging
import random
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger("cybergamegt.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        if len(self.active_connections) >= settings.ws_max_connections:
            await websocket.close(code=1013, reason="Server at capacity")
            return False
        await websocket.accept()
        self.active_connections.append(websocket)
        return True

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for dead_conn in dead:
            self.disconnect(dead_conn)


manager = ConnectionManager()

ATTACK_TYPES = ["DDoS", "SQLi", "Zero-Day", "Brute Force", "Phishing", "MitM"]
STATUS_OPTIONS = ["detected", "blocked", "breached"]
NODES = ["N-01", "N-02", "N-03", "N-04", "N-05", "N-06"]


def _origin_allowed(origin: str | None) -> bool:
    if not origin:
        return settings.debug
    if origin in settings.ws_allowed_origins:
        return True
    parsed = urlparse(origin)
    host = parsed.netloc or parsed.path
    return host in settings.trusted_hosts


def _ws_authorized(websocket: WebSocket) -> bool:
    if settings.api_key:
        token = websocket.query_params.get("token") or websocket.headers.get("x-api-key")
        return token == settings.api_key
    return True


def _make_threat_event() -> dict:
    attack = random.choice(ATTACK_TYPES)
    severity = random.randint(20, 95)
    status = random.choices(STATUS_OPTIONS, weights=[0.5, 0.35, 0.15])[0]
    target = random.choice(NODES)
    return {
        "type": "threat_event",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "attack_type": attack,
        "target_node": target,
        "severity": severity,
        "status": status,
        "threat_level": min(severity + random.randint(-5, 10), 100),
        "message": f"[{status.upper()}] {attack} attack on {target} — severity {severity}",
    }


@router.websocket("/ws/threats")
async def websocket_threats(websocket: WebSocket):
    """Stream live threat events. Requires token query param when API_KEY is set."""
    origin = websocket.headers.get("origin")
    if not _origin_allowed(origin):
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    if not _ws_authorized(websocket):
        await websocket.close(code=1008, reason="Unauthorized")
        return

    connected = await manager.connect(websocket)
    if not connected:
        return

    try:
        await websocket.send_json({
            "type": "connected",
            "message": "CyberGameGT threat stream connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=3.0)
                payload = json.loads(data)
                if payload.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                pass
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})

            event = _make_threat_event()
            await manager.broadcast(event)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        logger.exception("WebSocket session error")
        manager.disconnect(websocket)
