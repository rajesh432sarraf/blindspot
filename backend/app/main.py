import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.security_middleware import SecurityHeadersMiddleware, RateLimitMiddleware
from app.api.router import api_router

logger = logging.getLogger("blindspot")

app = FastAPI(
    title="Blindspot API",
    description="Evidence-grounded information gap and conflict detection platform for Shinchan Online Hackathon 2026",
    version="0.1.0"
)

# 1. Security Headers: nosniff, DENY frame, CSP, XSS filter, Referrer-Policy
app.add_middleware(SecurityHeadersMiddleware)

# 2. Rate Limiting: IP-based sliding window protection against DoS and quota drain
app.add_middleware(RateLimitMiddleware, analyze_limit=20, default_limit=120)

# 3. CORS configuration: Restricted to approved origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Requested-With"],
)

# 4. Global Safe Exception Handler: Prevent tracebacks & secrets leaking in 500 responses
@app.exception_handler(Exception)
async def global_safe_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled internal exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred during processing. Please verify source availability and try again."}
    )

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

