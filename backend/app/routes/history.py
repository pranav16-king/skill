from fastapi import APIRouter, HTTPException, Query, status
from app.database import db_manager
from app.models.audit import AuditHistoryResponse, AuditResponse
from app.services.audit_service import get_audit_history

router = APIRouter(prefix="/api", tags=["History"])


@router.get("/history", response_model=AuditHistoryResponse, status_code=status.HTTP_200_OK)
def get_audits_history(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Max items to return"),
) -> AuditHistoryResponse:
    """
    Retrieves stored compliance audit logs from MongoDB
    (or persistent local fallback store) with pagination.
    """
    try:
        return get_audit_history(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve audit history: {str(e)}",
        )


@router.get("/history/{audit_id}", response_model=AuditResponse, status_code=status.HTTP_200_OK)
def get_single_audit(audit_id: str) -> AuditResponse:
    """Fetches full details of a specific past audit by ID."""
    doc = db_manager.get_audit_by_id(audit_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit with ID '{audit_id}' was not found.",
        )
    return AuditResponse(**doc)
