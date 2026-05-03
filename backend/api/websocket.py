import asyncio
import json
import random
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from fastapi import APIRouter

router = APIRouter(tags=["WebSocket"])

# Connected clients registry
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

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
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()

ATTACK_TYPES = ["DDoS", "SQLi", "Zero-Day", "Brute Force", "Phishing", "MitM"]
STATUS_OPTIONS = ["detected", "blocked", "breached"]
NODES = ["N-01", "N-02", "N-03", "N-04", "N-05", "N-06"]


def _make_threat_event() -> dict:
    attack = random.choice(ATTACK_TYPES)
    severity = random.randint(20, 95)
    status = random.choices(STATUS_OPTIONS, weights=[0.5, 0.35, 0.15])[0]
    return {
        "type": "threat_event",
        "timestamp": datetime.utcnow().isoformat(),
        "attack_type": attack,
        "target_node": random.choice(NODES),
        "severity": severity,
        "status": status,
        "threat_level": min(severity + random.randint(-5, 10), 100),
        "message": f"[{status.upper()}] {attack} attack on {random.choice(NODES)} — severity {severity}",
    }


@router.websocket("/ws/threats")
async def websocket_threats(websocket: WebSocket):
    """
    WebSocket endpoint that streams live threat events to connected clients.
    Sends a new event every 3 seconds.
    """
    await manager.connect(websocket)
    try:
        # Send connection acknowledgment
        await websocket.send_json({
            "type": "connected",
            "message": "CyberGameGT threat stream connected",
            "timestamp": datetime.utcnow().isoformat(),
        })

        while True:
            # Wait for any incoming message (keeps connection alive) or 3s timeout
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=3.0)
                # Handle ping/pong or client commands
                payload = json.loads(data)
                if payload.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                pass

            # Broadcast a new threat event
            event = _make_threat_event()
            await manager.broadcast(event)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
