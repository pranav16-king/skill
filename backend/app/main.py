from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import db_manager
from app.routes import (
    audit_router,
    export_router,
    health_router,
    history_router,
    purposes_router,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("dpdp_auditor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB or activate offline resilient fallback
    logger.info("Initializing DPDP Form Auditor backend...")
    connected = db_manager.connect()
    if connected:
        logger.info(f"Connected to MongoDB at {settings.mongodb_uri}")
    else:
        logger.warning(
            f"MongoDB offline at {settings.mongodb_uri}. Local persistent storage active at {settings.local_storage_path}"
        )
    yield
    # Shutdown: Cleanly close DB pool
    logger.info("Shutting down database connections...")
    db_manager.close()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Rule-based, DPDP Act 2023 compliant Form Auditor backend. "
        "Audits web forms for personal data collection, flags excessive fields, "
        "drafts multi-lingual consent notices, and maintains audit history."
    ),
    lifespan=lifespan,
)

# Enable CORS for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(audit_router)
app.include_router(history_router)
app.include_router(purposes_router)
app.include_router(health_router)
app.include_router(export_router)


@app.get("/", tags=["Root"])
def root_status():
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/api/health",
        "purposes": "/api/purposes",
        "message": "DPDP Form Auditor API is online.",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
