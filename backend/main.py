import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api import auth, users, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"[STARTUP] Starting {settings.PROJECT_NAME} Python / FastAPI Backend...")
    await connect_to_mongo()
    yield
    # Shutdown
    print(f"[SHUTDOWN] Shutting down {settings.PROJECT_NAME} Backend...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-Grade Cyber Security Authentication & Identity Management Platform",
    lifespan=lifespan
)

# CORS Policy
origins = [
    settings.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helmet-style Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "engine": "Python 3.11 / FastAPI",
        "version": settings.VERSION
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "FastAPI Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
