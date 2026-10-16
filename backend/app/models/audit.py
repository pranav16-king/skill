from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InputMode(str, Enum):
    HTML = "html"
    FIELD_LIST = "field_list"


class Verdict(str, Enum):
    NEEDED = "needed"
    EXCESS = "excess"
    REVIEW = "review"
    NOT_PERSONAL = "not_personal"


class Category(str, Enum):
    IDENTITY = "identity"
    CONTACT = "contact"
    GOVERNMENT_ID = "government_id"
    FINANCIAL = "financial"
    HEALTH = "health"
    BIOMETRIC = "biometric"
    CHILDREN_DATA = "children_data"
    DEMOGRAPHIC = "demographic"
    CREDENTIALS = "credentials"
    LOCATION = "location"
    EMPLOYMENT_EDUCATION = "employment_education"
    BEHAVIORAL_PREFERENCE = "behavioral_preference"
    TECHNICAL = "technical"
    NOT_PERSONAL = "not_personal"



class ScoreBand(str, Enum):
    STRONG = "strong"  # 85-100
    FAIR = "fair"      # 65-84
    WEAK = "weak"      # 40-64
    POOR = "poor"      # 0-39


class FieldResult(BaseModel):
    name: str = Field(..., description="Field name or identifier")
    label: Optional[str] = Field(None, description="Human-readable label or inferred context")
    type: Optional[str] = Field("text", description="HTML input type or data type")
    autocomplete: Optional[str] = Field(None, description="Autocomplete attribute if detected")
    category: Category = Field(..., description="Data category under DPDP principles")
    sensitive: bool = Field(False, description="Whether this is sensitive personal data")
    verdict: Verdict = Field(..., description="Compliance verdict: needed, excess, review, not_personal")
    reason: str = Field(..., description="One sentence plain-language compliance rationale")
    matchedBy: List[str] = Field(default_factory=list, description="Winning heuristics used to match")


class AuditSummary(BaseModel):
    total_fields: int
    personal_data_count: int
    needed_count: int
    excess_count: int
    review_count: int
    not_personal_count: int


class ScoreBreakdown(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall compliance score from 0 to 100")
    band: ScoreBand = Field(..., description="Score rating band: strong, fair, weak, poor")
    reasons: List[str] = Field(default_factory=list, description="Itemized score breakdown lines")
    improvements: List[str] = Field(default_factory=list, description="Key recommendations to improve score")


class DraftNotice(BaseModel):
    en: str = Field(..., description="Consent notice drafted in English")
    hi: str = Field(..., description="Consent notice drafted in Hindi")
    mr: str = Field(..., description="Consent notice drafted in Marathi")
    collected_fields: List[str] = Field(default_factory=list, description="Items included in notice (needed fields only)")
    purpose: str = Field(..., description="Purpose formulated in notice")
    disclaimer: str = Field(
        default="Draft notice for guidance only. Review with a qualified legal professional before publishing.",
        description="Disclaimer note"
    )


class AuditRequest(BaseModel):
    form_input: str = Field(
        ...,
        min_length=1,
        description="Form HTML snippet or comma/newline-separated list of field names",
        examples=['<form><input name="email" type="email"><input name="aadhaar"></form>', "email, mob_no, dob"]
    )
    purpose: str = Field(
        ...,
        min_length=1,
        description="Stated purpose of the form (e.g. 'newsletter signup', 'contact us')",
        examples=["newsletter signup", "online checkout", "job application"]
    )
    mode: Optional[InputMode] = Field(
        None,
        description="Optional input mode: 'html' or 'field_list'. Auto-detected if omitted."
    )


class AuditResponse(BaseModel):
    id: str
    created_at: str
    purpose: str
    input_mode: InputMode
    summary: AuditSummary
    fields: List[FieldResult]
    score: ScoreBreakdown
    notice: DraftNotice


class AuditHistoryItem(BaseModel):
    id: str
    created_at: str
    purpose: str
    input_mode: str
    summary: AuditSummary
    score: int
    score_band: ScoreBand


class AuditHistoryResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[AuditHistoryItem]


class ExportRequest(BaseModel):
    audit_id: Optional[str] = Field(None, description="ID of previously saved audit to export")
    audit_data: Optional[AuditResponse] = Field(None, description="Full audit data payload if exporting without DB lookup")
    format: str = Field("txt", description="Export format: 'txt' or 'json'")
    language: str = Field("en", description="Notice language in report: 'en', 'hi', or 'mr'")
