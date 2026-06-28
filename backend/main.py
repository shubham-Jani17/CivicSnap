from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.config import settings, init_firebase, logger
from backend.middleware.logging import RequestLoggingMiddleware
from backend.routers import issues, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous lifespan manager for FastAPI.
    Performs startup/shutdown tasks like initializing global DB and Firebase pools.
    """
    logger.info("Starting up CivicSnap FastAPI Service...")
    # Initialize the Firebase App pool on application boot
    init_firebase()
    
    yield
    
    logger.info("Shutting down CivicSnap FastAPI Service...")

# Create the core FastAPI App
app = FastAPI(
    title=settings.app_name,
    description="A highly optimized, production-grade citizen safety and civic triage backend.",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# ─── CORS MIDDLEWARE SETUP ───
# Crucial for allowing frontend SPAs (Vite, React) to communicate securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In a strict production environment, replace with explicit domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── LOGGING MIDDLEWARE SETUP ───
# Registers our custom RequestLoggingMiddleware to capture processing times
app.add_middleware(RequestLoggingMiddleware)

# ─── REGISTER API ROUTERS ───
app.include_router(issues.router)
app.include_router(auth.router)

# ─── HEALTCHECK ENDPOINT ───
@app.get("/health", tags=["System Checks"])
def health_check():
    """Returns a simple JSON verification status of the server."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Launching server on http://{settings.host}:{settings.port}")
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
