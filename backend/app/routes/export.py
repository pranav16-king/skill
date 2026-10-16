from fastapi import APIRouter, HTTPException, Query, Response, status
from app.database import db_manager
from app.models.audit import AuditResponse, ExportRequest
from app.services.exporter import export_audit_data

router = APIRouter(prefix="/api", tags=["Export"])


@router.post("/export", status_code=status.HTTP_200_OK)
def export_audit_report(
    request: ExportRequest,
    download: bool = Query(False, description="Set true to trigger direct browser file download attachment"),
):
    """
    Exports a compliance audit as a downloadable .txt or .json formatted report,
    including summary, categorized fields table, score breakdown, and draft consent notice.
    """
    audit: AuditResponse

    if request.audit_data:
        audit = request.audit_data
    elif request.audit_id:
        doc = db_manager.get_audit_by_id(request.audit_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Audit with ID '{request.audit_id}' does not exist.",
            )
        audit = AuditResponse(**doc)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'audit_id' or 'audit_data' must be supplied to generate an export.",
        )

    export_result = export_audit_data(request, audit)

    if download:
        return Response(
            content=export_result["content"],
            media_type=export_result["media_type"],
            headers={
                "Content-Disposition": f'attachment; filename="{export_result["filename"]}"'
            },
        )

    return export_result
