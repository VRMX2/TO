import logging
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional

from fastapi import HTTPException, Request, Security, WebSocket
from fastapi.security import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.config import settings

logger = logging.getLogger("cybergamegt.security")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

PUBLIC_PATHS = {"/", "/health", "/ready"}
PUBLIC_PREFIXES = ("/docs", "/redoc", "/openapi.json")


def is_public_path(path: str) -> bool:
    if path in PUBLIC_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in PUBLIC_PREFIXES)


async def require_api_key(api_key: Optional[str] = Security(api_key_header)) -> None:
    """Require API key when API_KEY is configured in the environment."""
    if not settings.api_key:
        return
    if not api_key or api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


async def require_api_key_ws(websocket: WebSocket) -> None:
    if not settings.api_key:
        return
    token = websocket.query_params.get("token") or websocket.headers.get("x-api-key")
    if token != settings.api_key:
        await websocket.close(code=1008, reason="Unauthorized")
        raise HTTPException(status_code=401, detail="Invalid WebSocket credentials")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-XSS-Protection"] = "0"
        if not settings.debug:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int):
        super().__init__(app)
        self.limit = max(1, limit_per_minute)
        self.hits: Dict[str, Deque[float]] = defaultdict(deque)

    def _client_id(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method == "OPTIONS" or is_public_path(request.url.path):
            return await call_next(request)

        now = time.time()
        key = self._client_id(request)
        window = self.hits[key]
        while window and now - window[0] > 60:
            window.popleft()
        if len(window) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again shortly."},
            )
        window.append(now)
        return await call_next(request)


class ApiKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.api_key or request.method == "OPTIONS":
            return await call_next(request)
        if is_public_path(request.url.path):
            return await call_next(request)
        provided = request.headers.get("x-api-key")
        if provided != settings.api_key:
            return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})
        return await call_next(request)


class SlidingWindowRateLimiter:
    def __init__(self, limit_per_minute: int):
        self.limit = max(1, limit_per_minute)
        self.hits: Dict[str, Deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.time()
        window = self.hits[key]
        while window and now - window[0] > 60:
            window.popleft()
        if len(window) >= self.limit:
            raise HTTPException(status_code=429, detail="AI rate limit exceeded.")
        window.append(now)


ai_rate_limiter = SlidingWindowRateLimiter(settings.ai_rate_limit_per_minute)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def safe_error_detail(exc: Exception) -> str:
    if settings.debug:
        return str(exc)
    return "An internal server error occurred."
