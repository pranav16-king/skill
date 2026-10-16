from fastapi import APIRouter, status
from app.config import settings
from app.database import db_manager

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
def check_health():
    """
    Health check endpoint reporting application readiness,
    live MongoDB connection state on localhost:27017,
    and active persistence storage metrics.
    """
    health_info = db_manager.get_health_status()
    health_info["app"] = {
        "name": settings.app_name,
        "environment": settings.app_env,
        "debug": settings.debug,
    }
    return health_info
