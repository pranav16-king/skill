from app.models.audit import Category, Verdict
from app.services.rules import (
    classify_field,
    evaluate_field_verdict,
    normalize_purpose_slug,
)


def test_classify_field():
    cat, sensitive, matched_by = classify_field({"name": "mob_no", "tokens": ["mob"], "type": "tel"})
    assert cat == Category.CONTACT
    assert not sensitive
    assert any("mob" in m or "tel" in m for m in matched_by)

    cat_aadhaar, sens_aadhaar, matched_aadhaar = classify_field(
        {"name": "aadhaar_num", "tokens": ["aadhaar", "num"], "type": "text"}
    )
    assert cat_aadhaar == Category.GOVERNMENT_ID
    assert sens_aadhaar is True

    cat_csrf, sens_csrf, _ = classify_field(
        {"name": "csrf_token", "tokens": ["csrf", "token"], "type": "hidden"}
    )
    assert cat_csrf == Category.NOT_PERSONAL
    assert not sens_csrf


def test_newsletter_verdict():
    purpose_slug, purpose_rule = normalize_purpose_slug("newsletter signup")

    # Email -> Needed
    email_verdict, email_reason = evaluate_field_verdict(
        {"name": "email", "tokens": ["email"]},
        Category.CONTACT,
        False,
        ["name:email"],
        purpose_slug,
        purpose_rule,
        "newsletter signup",
    )
    assert email_verdict == Verdict.NEEDED

    # Name -> Review
    name_verdict, _ = evaluate_field_verdict(
        {"name": "usr_nm", "tokens": ["nm"]},
        Category.IDENTITY,
        False,
        ["name:usr_nm"],
        purpose_slug,
        purpose_rule,
        "newsletter signup",
    )
    assert name_verdict == Verdict.REVIEW

    # Aadhaar -> Excess
    aadhaar_verdict, _ = evaluate_field_verdict(
        {"name": "aadhaar", "tokens": ["aadhaar"]},
        Category.GOVERNMENT_ID,
        True,
        ["token:aadhaar"],
        purpose_slug,
        purpose_rule,
        "newsletter signup",
    )
    assert aadhaar_verdict == Verdict.EXCESS


def test_purpose_switch_checkout_vs_newsletter():
    # In newsletter, address is excess
    p_news, rule_news = normalize_purpose_slug("newsletter signup")
    v_news, _ = evaluate_field_verdict(
        {"name": "shipping_address", "tokens": ["shipping", "address"]},
        Category.LOCATION,
        False,
        ["token:address"],
        p_news,
        rule_news,
        "newsletter signup",
    )
    assert v_news == Verdict.EXCESS

    # In checkout, address is needed
    p_check, rule_check = normalize_purpose_slug("online checkout")
    v_check, _ = evaluate_field_verdict(
        {"name": "shipping_address", "tokens": ["shipping", "address"]},
        Category.LOCATION,
        False,
        ["token:address"],
        p_check,
        rule_check,
        "online checkout",
    )
    assert v_check == Verdict.NEEDED
