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


def _origin_allowed(origin: str | None) -> bool:
    # Always return True during dev to bypass Vite changeOrigin issues
    return True


def _ws_authorized(websocket: WebSocket) -> bool:
    if not settings.api_key:
        return True
    token = websocket.query_params.get("token") or websocket.headers.get("x-api-key")
    return token == settings.api_key


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

        async def send_threats():
            attack_types = ["DDoS", "SQLi", "Zero-Day", "Brute Force", "Phishing", "MitM"]
            statuses = ["detected", "blocked", "breached"]
            try:
                while True:
                    await asyncio.sleep(random.uniform(4.0, 12.0))
                    event = {
                        "type": "threat_event",
                        "attack_type": random.choice(attack_types),
                        "target_node": f"N-{random.randint(1, 15):02d}",
                        "severity": random.randint(30, 95),
                        "status": random.choices(statuses, weights=[0.45, 0.40, 0.15])[0],
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    await websocket.send_json(event)
            except Exception:
                pass

        threat_task = asyncio.create_task(send_threats())

        try:
            while True:
                try:
                    data = await websocket.receive_text()
                    payload = json.loads(data)
                    if payload.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
        finally:
            threat_task.cancel()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        logger.exception("WebSocket session error")
        manager.disconnect(websocket)
