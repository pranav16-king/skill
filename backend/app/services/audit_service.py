import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.database import db_manager
from app.models.audit import (
    AuditHistoryItem,
    AuditHistoryResponse,
    AuditRequest,
    AuditResponse,
    AuditSummary,
    Category,
    FieldResult,
    InputMode,
    Verdict,
)
from app.services.notice import generate_draft_notice
from app.services.parser import parse_form_input
from app.services.rules import (
    classify_field,
    evaluate_field_verdict,
    normalize_purpose_slug,
)
from app.services.scorer import calculate_compliance_score


def execute_form_audit(request: AuditRequest) -> AuditResponse:
    """
    Executes a complete compliance audit on the input form:
    1. Parses form fields from HTML or raw name list.
    2. Identifies data category and sensitivity.
    3. Evaluates DPDP necessity against stated purpose.
    4. Computes compliance score and explanation.
    5. Drafts Section 6 compliant consent notice (EN/HI/MR).
    6. Persists the audit record to MongoDB/local fallback.
    """
    mode, raw_fields = parse_form_input(request.form_input, request.mode)
    purpose_slug, purpose_rule = normalize_purpose_slug(request.purpose)

    field_results: List[FieldResult] = []

    for f_info in raw_fields:
        category, sensitive, matched_by = classify_field(f_info)
        verdict, reason = evaluate_field_verdict(
            field_info=f_info,
            category=category,
            sensitive=sensitive,
            matched_by=matched_by,
            purpose_slug=purpose_slug,
            purpose_rule=purpose_rule,
            raw_purpose=request.purpose,
        )

        field_results.append(
            FieldResult(
                name=f_info["name"],
                label=f_info.get("label"),
                type=f_info.get("type", "text"),
                autocomplete=f_info.get("autocomplete") or None,
                category=category,
                sensitive=sensitive,
                verdict=verdict,
                reason=reason,
                matchedBy=matched_by,
            )
        )

    # Sort fields: Excess -> Review -> Needed -> Not Personal (SKILL.md Sec 7.4)
    verdict_priority = {
        Verdict.EXCESS: 0,
        Verdict.REVIEW: 1,
        Verdict.NEEDED: 2,
        Verdict.NOT_PERSONAL: 3,
    }
    field_results.sort(key=lambda item: verdict_priority.get(item.verdict, 99))

    # Calculate summary counts
    total = len(field_results)
    needed_count = sum(1 for f in field_results if f.verdict == Verdict.NEEDED)
    excess_count = sum(1 for f in field_results if f.verdict == Verdict.EXCESS)
    review_count = sum(1 for f in field_results if f.verdict == Verdict.REVIEW)
    not_personal_count = sum(1 for f in field_results if f.verdict == Verdict.NOT_PERSONAL)
    personal_count = total - not_personal_count

    summary = AuditSummary(
        total_fields=total,
        personal_data_count=personal_count,
        needed_count=needed_count,
        excess_count=excess_count,
        review_count=review_count,
        not_personal_count=not_personal_count,
    )

    # Calculate compliance score
    score_breakdown = calculate_compliance_score(field_results, request.purpose)

    # Generate draft consent notice
    draft_notice = generate_draft_notice(field_results, request.purpose)

    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    audit_response = AuditResponse(
        id=audit_id,
        created_at=created_at,
        purpose=request.purpose,
        input_mode=mode,
        summary=summary,
        fields=field_results,
        score=score_breakdown,
        notice=draft_notice,
    )

    # Persist document to MongoDB / local resilient fallback
    db_manager.save_audit(audit_response.model_dump())

    return audit_response


def get_audit_history(skip: int = 0, limit: int = 20) -> AuditHistoryResponse:
    """Retrieves paginated audit history."""
    docs, total = db_manager.get_audits(skip=skip, limit=limit)
    items: List[AuditHistoryItem] = []

    for d in docs:
        try:
            summary = AuditSummary(**d["summary"])
            items.append(
                AuditHistoryItem(
                    id=d["id"],
                    created_at=d["created_at"],
                    purpose=d["purpose"],
                    input_mode=d.get("input_mode", "html"),
                    summary=summary,
                    score=d["score"]["score"],
                    score_band=d["score"]["band"],
                )
            )
        except Exception:
            # Skip corrupted item gracefully
            continue

    return AuditHistoryResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )
