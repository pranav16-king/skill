from typing import List, Tuple
from app.models.audit import Category, FieldResult, ScoreBand, ScoreBreakdown, Verdict


def calculate_compliance_score(
    fields: List[FieldResult],
    raw_purpose: str,
    has_parental_consent_clause: bool = False,
) -> ScoreBreakdown:
    """
    Computes DPDP compliance score from 0-100 based on data minimisation,
    field verdicts, sensitivity, and purpose alignment.
    """
    score = 100
    reasons: List[str] = []
    improvements: List[str] = []

    excess_fields = [f for f in fields if f.verdict == Verdict.EXCESS]
    review_fields = [f for f in fields if f.verdict == Verdict.REVIEW]
    gov_id_fields = [f for f in fields if f.category == Category.GOVERNMENT_ID and f.verdict != Verdict.NEEDED]
    children_fields = [f for f in fields if f.category == Category.CHILDREN_DATA]

    # Stated purpose baseline
    if raw_purpose.strip():
        reasons.append("+10 Clear stated purpose specified for data processing")

    # Penalties for excess fields
    for f in excess_fields:
        if f.sensitive:
            deduction = 20
            score -= deduction
            reasons.append(f"-{deduction} Collects sensitive data '{f.name}' ({f.category.value.replace('_', ' ')}) without necessity")
        else:
            deduction = 12
            score -= deduction
            reasons.append(f"-{deduction} Collects unnecessary field '{f.name}' for {raw_purpose}")

    # Penalties for review fields
    for f in review_fields:
        deduction = 5
        score -= deduction
        reasons.append(f"-{deduction} Field '{f.name}' requires justification or should be strictly optional")

    # Government ID penalty if non-essential
    for f in gov_id_fields:
        deduction = 10
        score -= deduction
        reasons.append(f"-{deduction} Requests Government ID document ('{f.name}') without demonstrated legal mandate")

    # Children's data penalty if no parental consent
    if children_fields and not has_parental_consent_clause:
        deduction = 15
        score -= deduction
        reasons.append(f"-{deduction} Collects data related to minors without verifiable parental consent mechanism")

    # Clamp score between 0 and 100
    clamped_score = max(0, min(100, score))

    # Assign band
    if clamped_score >= 85:
        band = ScoreBand.STRONG
    elif clamped_score >= 65:
        band = ScoreBand.FAIR
    elif clamped_score >= 40:
        band = ScoreBand.WEAK
    else:
        band = ScoreBand.POOR

    # Improvement recommendations
    if excess_fields:
        excess_names = ", ".join(f"'{f.name}'" for f in excess_fields[:4])
        improvements.append(f"Remove excessive fields ({excess_names}) to adhere to DPDP data minimisation.")
    if review_fields:
        review_names = ", ".join(f"'{f.name}'" for f in review_fields[:3])
        improvements.append(f"Mark borderline fields ({review_names}) as optional and state their specific use.")
    if gov_id_fields:
        improvements.append("Avoid collecting national identity cards (Aadhaar/PAN) at initial form submission.")
    if children_fields and not has_parental_consent_clause:
        improvements.append("Add a verifiable parental consent workflow and age confirmation before collecting minor's data.")
    if not improvements:
        improvements.append("Maintain data minimisation and review consent withdrawal mechanisms periodically.")

    return ScoreBreakdown(
        score=clamped_score,
        band=band,
        reasons=reasons,
        improvements=improvements[:3],
    )
