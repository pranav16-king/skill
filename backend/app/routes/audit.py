from fastapi import APIRouter, HTTPException, status
from app.models.audit import AuditRequest, AuditResponse
from app.services.audit_service import execute_form_audit

router = APIRouter(prefix="/api", tags=["Audit"])


@router.post("/audit", response_model=AuditResponse, status_code=status.HTTP_200_OK)
def run_form_audit(request: AuditRequest) -> AuditResponse:
    """
    Submits a web form (HTML markup or field list) and stated purpose
    to perform a comprehensive DPDP compliance audit.
    Returns classified fields, excess flags, reasons, draft notice, and compliance score.
    """
    effective_input = request.get_effective_input() if hasattr(request, "get_effective_input") else (request.form_input or "").strip()
    if not effective_input:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Form input cannot be empty. Paste HTML form code or provide a list of field names.",
        )
    request.form_input = effective_input
    if not request.purpose or not request.purpose.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Purpose cannot be empty. Provide a one-line purpose (e.g., 'newsletter signup').",
        )

    try:
        response = execute_form_audit(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while auditing the form: {str(e)}",
        )
