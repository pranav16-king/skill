"""
Validation suite for shared/rules_dictionary.json
Validates:
1. 14 categories with valid sensitivity and risk tiers
2. 14 purpose profiles with needed, review, and excess lists
3. Qualifier guard definitions
4. Regex patterns (Aadhaar, PAN, PIN code, Phone, etc.)
5. Multilingual templates (en, hi, mr) with valid placeholders
"""

import json
import re
import sys
from pathlib import Path

REQUIRED_CATEGORIES = {
    "identity",
    "contact",
    "government_id",
    "financial",
    "health",
    "biometric",
    "children_data",
    "demographic",
    "credentials",
    "location",
    "employment_education",
    "behavioral_preference",
    "technical",
    "not_personal",
}

HIGH_RISK_CATEGORIES = {
    "government_id",
    "financial",
    "health",
    "biometric",
    "children_data",
    "demographic",
    "credentials",
}

REQUIRED_PURPOSES = {
    "newsletter_signup",
    "contact_us",
    "job_application",
    "online_checkout",
    "account_registration",
    "event_registration",
    "appointment_booking",
    "loan_kyc",
    "insurance_quote",
    "school_admission",
    "feedback_survey",
    "complaint",
    "donation",
    "coaching",
}

REQUIRED_LANGUAGES = {"en", "hi", "mr"}


def validate_dictionary(file_path: Path):
    print(f"Validating rules dictionary at {file_path} ...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Version and metadata
    assert data.get("version"), "Missing version"
    assert data.get("metadata"), "Missing metadata"

    # 2. Categories check
    categories = data.get("categories", [])
    assert len(categories) == 14, f"Expected 14 categories, found {len(categories)}"
    cat_ids = {c["id"] for c in categories}
    assert cat_ids == REQUIRED_CATEGORIES, f"Mismatch in categories: {cat_ids ^ REQUIRED_CATEGORIES}"

    for c in categories:
        assert c["name"], f"Category {c['id']} missing name"
        assert c["glyph"], f"Category {c['id']} missing glyph"
        assert "sensitive" in c, f"Category {c['id']} missing sensitive flag"
        assert c["risk_tier"] in {"high", "standard", "low", "none"}, f"Invalid risk_tier in {c['id']}"
        if c["id"] in HIGH_RISK_CATEGORIES:
            assert c["sensitive"] is True, f"Category {c['id']} must be marked sensitive=True"
            assert c["risk_tier"] == "high", f"Category {c['id']} must have risk_tier='high'"

    # 3. Qualifier guards
    guards = data.get("qualifier_guards", [])
    assert len(guards) >= 4, f"Expected at least 4 qualifier guards, found {len(guards)}"
    all_guard_tokens = [t for g in guards for t in g["tokens"]]
    assert "company_name" in all_guard_tokens, "Missing company_name in qualifier guards"
    assert "product_name" in all_guard_tokens, "Missing product_name in qualifier guards"
    assert "coupon_name" in all_guard_tokens, "Missing coupon_name in qualifier guards"
    assert "ip_address" in all_guard_tokens, "Missing ip_address in qualifier guards"

    # 4. Regex patterns
    regexes = data.get("regex_patterns", {})
    required_regex_keys = {"aadhaar", "pan", "pincode", "phone", "voter_id", "passport", "ifsc", "email"}
    for k in required_regex_keys:
        assert k in regexes, f"Missing regex pattern for {k}"
        # Validate regex compiles
        pattern = regexes[k]["pattern"]
        compiled = re.compile(pattern)
        assert compiled, f"Failed compiling pattern {pattern}"

    # Test regex patterns on sample inputs
    re_aadhaar = re.compile(regexes["aadhaar"]["pattern"])
    assert re_aadhaar.match("5482 1234 5678"), "Aadhaar regex failed valid test"
    assert not re_aadhaar.match("0123 4567 8901"), "Aadhaar cannot start with 0"
    assert not re_aadhaar.match("12345"), "Aadhaar invalid length"

    re_pan = re.compile(regexes["pan"]["pattern"])
    assert re_pan.match("ABCDE1234F"), "PAN regex failed valid test"
    assert not re_pan.match("ABC123456F"), "PAN invalid structure"

    re_pin = re.compile(regexes["pincode"]["pattern"])
    assert re_pin.match("400001"), "PIN code regex failed valid test"
    assert not re_pin.match("012345"), "PIN code cannot start with 0"

    re_phone = re.compile(regexes["phone"]["pattern"])
    assert re_phone.match("+91 9876543210") or re_phone.match("9876543210"), "Phone regex failed valid test"

    # 5. Purposes
    purposes = data.get("purposes", [])
    assert len(purposes) == 14, f"Expected 14 purposes, found {len(purposes)}"
    p_ids = {p["id"] for p in purposes}
    assert p_ids == REQUIRED_PURPOSES, f"Mismatch in purposes: {p_ids ^ REQUIRED_PURPOSES}"

    for p in purposes:
        assert p["name"], f"Purpose {p['id']} missing name"
        assert p["description"], f"Purpose {p['id']} missing description"
        assert isinstance(p.get("needed_fields"), list), f"Purpose {p['id']} missing needed_fields"
        assert isinstance(p.get("review_fields"), list), f"Purpose {p['id']} missing review_fields"
        assert isinstance(p.get("typically_excess"), list), f"Purpose {p['id']} missing typically_excess"

    # 6. Notice templates
    notices = data.get("notice_templates", {})
    assert set(notices.keys()) >= REQUIRED_LANGUAGES, f"Notice templates missing languages: {REQUIRED_LANGUAGES - set(notices.keys())}"
    for lang in REQUIRED_LANGUAGES:
        tpl = notices[lang]
        assert tpl.get("draft_banner"), f"Missing draft_banner for {lang}"
        assert tpl.get("headings"), f"Missing headings for {lang}"
        assert tpl.get("body"), f"Missing body for {lang}"
        body = tpl["body"]
        for key in ["what_we_collect", "why_we_collect", "how_to_withdraw", "grievance_redressal", "retention_period", "children_notice", "disclaimer"]:
            assert key in body, f"Missing body item {key} in language {lang}"

    print("ALL 6 VALIDATION PHASES PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    dict_file = Path("p:/skill/shared/rules_dictionary.json")
    try:
        validate_dictionary(dict_file)
    except AssertionError as err:
        print(f"VALIDATION FAILED: {err}", file=sys.stderr)
        sys.exit(1)
