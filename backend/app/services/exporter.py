import json
import re
from datetime import datetime, timezone
from typing import Dict, Optional
from app.models.audit import AuditResponse, ExportRequest


def sanitize_filename_slug(purpose: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", purpose.strip().lower()).strip("-")
    return cleaned[:30] or "form"


def generate_audit_text_report(audit: AuditResponse, language: str = "en") -> str:
    """
    Renders a comprehensive, plain-text compliance audit report
    suitable for downloading or printing.
    """
    date_str = audit.created_at[:10]
    time_str = audit.created_at[11:19]

    # Pick notice language
    notice_text = audit.notice.en
    lang_label = "English"
    if language.lower() in {"hi", "hindi"}:
        notice_text = audit.notice.hi
        lang_label = "Hindi (हिन्दी)"
    elif language.lower() in {"mr", "marathi"}:
        notice_text = audit.notice.mr
        lang_label = "Marathi (मराठी)"

    # Format fields table
    field_rows = []
    field_rows.append(f"{'FIELD':<20} | {'CATEGORY':<16} | {'SENSITIVE':<9} | {'VERDICT':<10} | {'REASON'}")
    field_rows.append("-" * 110)

    for f in audit.fields:
        f_name = f.name[:19]
        f_cat = f.category.value.replace("_", " ").title()[:15]
        f_sens = "Yes" if f.sensitive else "No"
        f_verdict = f.verdict.value.upper()[:9]
        f_reason = f.reason
        field_rows.append(f"{f_name:<20} | {f_cat:<16} | {f_sens:<9} | {f_verdict:<10} | {f_reason}")

    fields_table_str = "\n".join(field_rows)

    # Score breakdown
    score_reasons_str = "\n".join(f"  • {r}" for r in audit.score.reasons) if audit.score.reasons else "  • Standard baseline scoring applied."
    improvements_str = "\n".join(f"  [{i+1}] {imp}" for i, imp in enumerate(audit.score.improvements)) if audit.score.improvements else "  • No critical actions required."

    report = f"""================================================================================
                       DPDP FORM AUDITOR - COMPLIANCE REPORT
                      Digital Personal Data Protection Act, 2023
================================================================================
Audit Reference ID: {audit.id}
Generated At      : {date_str} {time_str} UTC
Stated Purpose    : {audit.purpose}
Input Mode        : {audit.input_mode.value.upper()}
Overall Score     : {audit.score.score}/100  [{audit.score.band.value.upper()}]
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
Total Form Fields Analyzed : {audit.summary.total_fields}
Personal Data Fields       : {audit.summary.personal_data_count}
  - Strictly Needed        : {audit.summary.needed_count}
  - Excessive Collection   : {audit.summary.excess_count} (FLAGGED FOR REMOVAL)
  - Borderline / Review    : {audit.summary.review_count} (JUSTIFICATION REQUIRED)
Non-Personal / Technical   : {audit.summary.not_personal_count}

2. DETAILED FIELD COMPLIANCE TABLE
--------------------------------------------------------------------------------
{fields_table_str}

3. COMPLIANCE SCORE BREAKDOWN ({audit.score.score}/100)
--------------------------------------------------------------------------------
Rating Band: {audit.score.band.value.upper()}
Scoring Rationale:
{score_reasons_str}

Key Improvement Recommendations:
{improvements_str}

4. DRAFT CONSENT NOTICE (SECTION 6 DPDP ACT) - [{lang_label}]
--------------------------------------------------------------------------------
{notice_text}

================================================================================
IMPORTANT DISCLAIMER:
This report and draft notice are generated strictly as educational and technical
guidance based on rule-based data minimisation principles under the DPDP Act, 2023.
This report DOES NOT constitute legal advice or formal regulatory certification.
Consult a qualified data privacy legal professional prior to production deployment.
================================================================================
"""
    return report.strip()


def export_audit_data(request: ExportRequest, audit: AuditResponse) -> Dict[str, str]:
    """Generates file content and target filename for audit export."""
    slug = sanitize_filename_slug(audit.purpose)
    date_str = audit.created_at[:10]

    if request.format.lower() == "json":
        filename = f"dpdp-audit-{slug}-{date_str}.json"
        content = json.dumps(audit.model_dump(), indent=2)
        media_type = "application/json"
    else:
        filename = f"dpdp-audit-{slug}-{date_str}.txt"
        content = generate_audit_text_report(audit, language=request.language)
        media_type = "text/plain; charset=utf-8"

    return {
        "filename": filename,
        "content": content,
        "media_type": media_type,
    }
