from app.models.audit import Category, FieldResult, ScoreBand, Verdict
from app.services.scorer import calculate_compliance_score


def test_scorer_all_needed():
    fields = [
        FieldResult(
            name="email",
            category=Category.CONTACT,
            sensitive=False,
            verdict=Verdict.NEEDED,
            reason="Needed to send newsletter.",
            matchedBy=["type:email"],
        )
    ]
    score_breakdown = calculate_compliance_score(fields, "newsletter signup")
    assert score_breakdown.score == 100
    assert score_breakdown.band == ScoreBand.STRONG


def test_scorer_with_excess_and_sensitive():
    fields = [
        FieldResult(
            name="email",
            category=Category.CONTACT,
            sensitive=False,
            verdict=Verdict.NEEDED,
            reason="Needed to send newsletter.",
            matchedBy=["type:email"],
        ),
        FieldResult(
            name="aadhaar",
            category=Category.GOVERNMENT_ID,
            sensitive=True,
            verdict=Verdict.EXCESS,
            reason="Disproportionate.",
            matchedBy=["token:aadhaar"],
        ),
        FieldResult(
            name="phone",
            category=Category.CONTACT,
            sensitive=False,
            verdict=Verdict.REVIEW,
            reason="Optional.",
            matchedBy=["token:phone"],
        ),
    ]
    breakdown = calculate_compliance_score(fields, "newsletter signup")
    # 100 - 20 (sensitive excess) - 5 (review) - 10 (gov id) = 65
    assert breakdown.score <= 75
    assert len(breakdown.improvements) > 0
