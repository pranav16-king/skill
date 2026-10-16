from app.models.audit import Category, FieldResult, Verdict
from app.services.notice import generate_draft_notice


def test_notice_multilingual():
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
            name="dob",
            category=Category.DEMOGRAPHIC,
            sensitive=False,
            verdict=Verdict.EXCESS,
            reason="Excess.",
            matchedBy=["token:dob"],
        ),
    ]
    notice = generate_draft_notice(fields, "newsletter signup")

    # English notice
    assert "What We Collect" in notice.en
    assert "How to Withdraw Consent" in notice.en
    assert "[your contact email]" in notice.en
    # Excess field 'dob' must not be in collected fields
    assert "Dob" not in notice.collected_fields
    assert "Email" in notice.collected_fields

    # Hindi notice
    assert "हम क्या एकत्र करते हैं" in notice.hi
    assert "सहमति कैसे वापस लें" in notice.hi

    # Marathi notice
    assert "आम्ही काय गोळा करतो" in notice.mr
    assert "संमती कशी मागे घ्यावी" in notice.mr
