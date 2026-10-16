from app.routes.audit import router as audit_router
from app.routes.export import router as export_router
from app.routes.health import router as health_router
from app.routes.history import router as history_router
from app.routes.purposes import router as purposes_router
from app.routes.translate import router as translate_router

__all__ = [
    "audit_router",
    "history_router",
    "purposes_router",
    "health_router",
    "export_router",
    "translate_router",
]
