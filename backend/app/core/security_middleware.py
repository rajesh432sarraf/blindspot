import time
import threading
from typing import Dict, List
from starlette.responses import JSONResponse

class RateLimiter:
    """
    In-memory thread-safe sliding-window rate limiter per client IP.
    Automatically purges expired window entries to prevent memory growth.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._requests: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str, max_requests: int, window_seconds: float = 60.0) -> bool:
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._requests.get(client_ip, [])
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= max_requests:
                self._requests[client_ip] = valid_timestamps
                return False

            valid_timestamps.append(now)
            self._requests[client_ip] = valid_timestamps
            return True

    def reset(self):
        """Clears all tracked rates (used for testing)."""
        with self._lock:
            self._requests.clear()

global_rate_limiter = RateLimiter()

class SecurityHeadersMiddleware:
    """
    Pure ASGI middleware that injects enterprise-grade HTTP security headers
    into all HTTP responses without BaseHTTPMiddleware thread-blocking overhead.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"DENY"))
                headers.append((b"x-xss-protection", b"1; mode=block"))
                headers.append((b"referrer-policy", b"strict-origin-when-cross-origin"))
                headers.append((b"permissions-policy", b"geolocation=(), camera=(), microphone=(), payment=()"))
                headers.append((b"content-security-policy", b"default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

class RateLimitMiddleware:
    """
    Pure ASGI middleware protecting expensive endpoints against denial-of-service,
    rapid scripting, and API quota exhaustion.
    """
    def __init__(self, app, analyze_limit: int = 20, default_limit: int = 120, window_seconds: float = 60.0):
        self.app = app
        self.analyze_limit = analyze_limit
        self.default_limit = default_limit
        self.window_seconds = window_seconds

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract client IP
        client = scope.get("client")
        client_ip = client[0] if client else "127.0.0.1"
        path = scope.get("path", "")

        for name, value in scope.get("headers", []):
            if name.lower() == b"x-forwarded-for":
                client_ip = value.decode("latin1").split(",")[0].strip()
                break

        if path.startswith("/api/analyze"):
            allowed = global_rate_limiter.is_allowed(
                f"{client_ip}:analyze",
                max_requests=self.analyze_limit,
                window_seconds=self.window_seconds
            )
            if not allowed:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded for investigation requests. Please wait a moment before trying again."},
                    headers={"Retry-After": str(int(self.window_seconds))}
                )
                await response(scope, receive, send)
                return
        else:
            allowed = global_rate_limiter.is_allowed(
                f"{client_ip}:general",
                max_requests=self.default_limit,
                window_seconds=self.window_seconds
            )
            if not allowed:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please slow down."},
                    headers={"Retry-After": str(int(self.window_seconds))}
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
