"""
Automated Dictionary Coverage & Verification Tests
Validates all tricky test cases from Section 6, 7, 12, 14 of the DPDP Form Auditor Implementation Plan.
"""

import sys
from pathlib import Path

# Add shared to sys.path
SHARED_DIR = Path(__file__).resolve().parent.parent / "shared"
if str(SHARED_DIR) not in sys.path:
    sys.path.insert(0, str(SHARED_DIR))

from rules_engine import RulesEngine

ENGINE = RulesEngine()


# ---------------------------------------------------------
# Test 1: Category Structure and Sensitivity Ratings
# ---------------------------------------------------------
def test_all_14_categories_exist_with_proper_sensitivity():
    """Verify all 14 categories exist and high-risk ones are marked sensitive with high risk tier."""
    categories = ENGINE.categories
    assert len(categories) == 14, f"Expected 14 categories, found {len(categories)}"

    expected_high_risk = {
        "government_id",
        "financial",
        "health",
        "biometric",
        "children_data",
        "demographic",
        "credentials",
    }

    expected_standard_or_low = {
        "identity",
        "contact",
        "location",
        "employment_education",
        "behavioral_preference",
        "technical",
        "not_personal",
    }

    found_ids = {c["id"] for c in categories}
    assert found_ids == (expected_high_risk | expected_standard_or_low)

    for c in categories:
        cid = c["id"]
        if cid in expected_high_risk:
            assert c["sensitive"] is True, f"{cid} must be sensitive"
            assert c["risk_tier"] == "high", f"{cid} must have risk_tier='high'"
        else:
            assert c["sensitive"] is False, f"{cid} should be sensitive=False"


# ---------------------------------------------------------
# Test 2: Qualifier Guards
# ---------------------------------------------------------
def test_qualifier_guards_prevent_misclassification():
    """
    Ensure company_name, product_name, coupon_name, ip_address are NOT misclassified as personal identity or location.
    """
    # company_name should NOT be identity; should be not_personal
    res_company = ENGINE.classify_field({"name": "company_name"})
    assert res_company["category"] == "not_personal"
    assert res_company["sensitive"] is False
    assert any("qualifier_guard" in m for m in res_company["matched_by"])

    # product_name should NOT be identity
    res_product = ENGINE.classify_field({"name": "product_name"})
    assert res_product["category"] == "not_personal"
    assert res_product["sensitive"] is False

    # coupon_name should NOT be identity
    res_coupon = ENGINE.classify_field({"name": "coupon_name"})
    assert res_coupon["category"] == "not_personal"
    assert res_coupon["sensitive"] is False

    # coupon_code
    res_coupon_code = ENGINE.classify_field({"name": "coupon_code"})
    assert res_coupon_code["category"] == "not_personal"

    # ip_address should NOT be location; should be technical
    res_ip = ENGINE.classify_field({"name": "ip_address"})
    assert res_ip["category"] == "technical"
    assert res_ip["sensitive"] is False
    assert any("qualifier_guard" in m for m in res_ip["matched_by"])

    # domain_name
    res_domain = ENGINE.classify_field({"name": "domain_name"})
    assert res_domain["category"] == "not_personal"


# ---------------------------------------------------------
# Test 3: Hinglish & Vernacular Romanized Terms
# ---------------------------------------------------------
def test_hinglish_terms_classification():
    """Verify Hinglish and vernacular Romanized tokens map to correct categories."""
    # Identity
    assert ENGINE.classify_field({"name": "naam"})["category"] == "identity"
    assert ENGINE.classify_field({"name": "pura_naam"})["category"] == "identity"
    assert ENGINE.classify_field({"name": "nav"})["category"] == "identity"
    assert ENGINE.classify_field({"name": "नाम"})["category"] == "identity"

    # Location
    assert ENGINE.classify_field({"name": "pata"})["category"] == "location"
    assert ENGINE.classify_field({"name": "ghar_ka_pata"})["category"] == "location"
    assert ENGINE.classify_field({"name": "shehar"})["category"] == "location"
    assert ENGINE.classify_field({"name": "pin_kramank"})["category"] == "location"
    assert ENGINE.classify_field({"name": "पता"})["category"] == "location"

    # Date of birth / Age
    assert ENGINE.classify_field({"name": "janm_tithi"})["category"] == "demographic"
    assert ENGINE.classify_field({"name": "janm_tarikh"})["category"] == "demographic"
    assert ENGINE.classify_field({"name": "aayu"})["category"] == "demographic"
    assert ENGINE.classify_field({"name": "जन्म तिथि"})["category"] == "demographic"

    # Contact (Phone / Mobile)
    assert ENGINE.classify_field({"name": "dooranbhash"})["category"] == "contact"
    assert ENGINE.classify_field({"name": "sampark_number"})["category"] == "contact"
    assert ENGINE.classify_field({"name": "bramhanadhwani"})["category"] == "contact"
    assert ENGINE.classify_field({"name": "दूरभाष"})["category"] == "contact"

    # Government ID
    aadhaar_res = ENGINE.classify_field({"name": "aadhar_card"})
    assert aadhaar_res["category"] == "government_id"
    assert aadhaar_res["sensitive"] is True

    aadhaar_vernacular = ENGINE.classify_field({"name": "आधार कार्ड"})
    assert aadhaar_vernacular["category"] == "government_id"
    assert aadhaar_vernacular["sensitive"] is True

    pancard_res = ENGINE.classify_field({"name": "pancard"})
    assert pancard_res["category"] == "government_id"
    assert pancard_res["sensitive"] is True

    # Financial
    khata_res = ENGINE.classify_field({"name": "khata_number"})
    assert khata_res["category"] == "financial"
    assert khata_res["sensitive"] is True

    vetan_res = ENGINE.classify_field({"name": "vetan"})
    assert vetan_res["category"] == "financial"

    # Health
    swasthya_res = ENGINE.classify_field({"name": "swasthya_vivaran"})
    assert swasthya_res["category"] == "health"
    assert swasthya_res["sensitive"] is True

    rakt_res = ENGINE.classify_field({"name": "rakt_samuh"})
    assert rakt_res["category"] == "health"
    assert rakt_res["sensitive"] is True

    # Children
    balak_res = ENGINE.classify_field({"name": "balak_nav"})
    assert balak_res["category"] == "children_data"
    assert balak_res["sensitive"] is True

    vidyarthi_res = ENGINE.classify_field({"name": "vidyarthi"})
    assert vidyarthi_res["category"] == "children_data"
    assert vidyarthi_res["sensitive"] is True

    # Credentials
    chabi_res = ENGINE.classify_field({"name": "guptha_shabd"})
    assert chabi_res["category"] == "credentials"
    assert chabi_res["sensitive"] is True


# ---------------------------------------------------------
# Test 4: Section 14 Messy Form Judge Simulation
# ---------------------------------------------------------
def test_messy_form_simulation_judge_test():
    """
    Judge Test 1 from Section 14:
    Messy form: usr_nm, mob_no, e_mail, dob_dd, aadhar_no, pan, addr_line1, pincode, gender_sel, income_range, csrf_token, submit
    Purpose: "newsletter signup"
    """
    raw_fields = [
        {"name": "usr_nm", "type": "text"},
        {"name": "mob_no", "type": "tel"},
        {"name": "e_mail", "type": "email"},
        {"name": "dob_dd", "type": "text"},
        {"name": "aadhar_no", "type": "text"},
        {"name": "pan", "type": "text"},
        {"name": "addr_line1", "type": "text"},
        {"name": "pincode", "type": "text"},
        {"name": "gender_sel", "type": "text"},
        {"name": "income_range", "type": "text"},
        {"name": "csrf_token", "type": "hidden"},
        {"name": "submit", "type": "submit"},
    ]

    purpose_str = "newsletter signup"
    p_slug, _ = ENGINE.match_purpose_profile(purpose_str)
    assert p_slug == "newsletter_signup"

    classified_results = []
    for f in raw_fields:
        c_res = ENGINE.classify_field(f)
        verdict, reason = ENGINE.evaluate_necessity(
            field_info=f,
            category=c_res["category"],
            sensitive=c_res["sensitive"],
            purpose_slug=p_slug,
            raw_purpose=purpose_str,
        )
        classified_results.append({
            "name": f["name"],
            "category": c_res["category"],
            "sensitive": c_res["sensitive"],
            "verdict": verdict,
            "reason": reason,
        })

    by_name = {r["name"]: r for r in classified_results}

    # e_mail: Needed (Contact)
    assert by_name["e_mail"]["category"] == "contact"
    assert by_name["e_mail"]["verdict"] == "needed"

    # usr_nm: Review (Identity)
    assert by_name["usr_nm"]["category"] == "identity"
    assert by_name["usr_nm"]["verdict"] == "review"

    # mob_no: Excess or Review (Contact)
    assert by_name["mob_no"]["category"] == "contact"
    assert by_name["mob_no"]["verdict"] in {"excess", "review"}

    # dob_dd: Excess (Demographic)
    assert by_name["dob_dd"]["category"] == "demographic"
    assert by_name["dob_dd"]["verdict"] == "excess"

    # aadhar_no: Excess (Government ID, sensitive: True)
    assert by_name["aadhar_no"]["category"] == "government_id"
    assert by_name["aadhar_no"]["sensitive"] is True
    assert by_name["aadhar_no"]["verdict"] == "excess"

    # pan: Excess (Government ID, sensitive: True)
    assert by_name["pan"]["category"] == "government_id"
    assert by_name["pan"]["sensitive"] is True
    assert by_name["pan"]["verdict"] == "excess"

    # addr_line1: Excess (Location)
    assert by_name["addr_line1"]["category"] == "location"
    assert by_name["addr_line1"]["verdict"] == "excess"

    # pincode: Excess (Location)
    assert by_name["pincode"]["category"] == "location"
    assert by_name["pincode"]["verdict"] == "excess"

    # gender_sel: Excess (Demographic)
    assert by_name["gender_sel"]["category"] == "demographic"
    assert by_name["gender_sel"]["verdict"] == "excess"

    # income_range: Excess (Financial, sensitive: True)
    assert by_name["income_range"]["category"] == "financial"
    assert by_name["income_range"]["sensitive"] is True
    assert by_name["income_range"]["verdict"] == "excess"

    # csrf_token: Not personal
    assert by_name["csrf_token"]["category"] == "not_personal"
    assert by_name["csrf_token"]["verdict"] == "not_personal"

    # submit: Not personal
    assert by_name["submit"]["category"] == "not_personal"
    assert by_name["submit"]["verdict"] == "not_personal"


# ---------------------------------------------------------
# Test 5: Purpose Switching (Newsletter vs E-commerce)
# ---------------------------------------------------------
def test_purpose_switch_flips_verdicts():
    """
    Judge Test 3 from Section 14:
    Verifies that address and phone flip from Excess in Newsletter to Needed in Online Checkout.
    """
    address_field = {"name": "shipping_address", "type": "text"}
    phone_field = {"name": "mobile_number", "type": "tel"}

    # In Newsletter
    v_addr_news, _ = ENGINE.evaluate_necessity(
        address_field, category="location", sensitive=False, purpose_slug="newsletter_signup", raw_purpose="newsletter signup"
    )
    assert v_addr_news == "excess"

    # In E-commerce checkout
    v_addr_ecom, _ = ENGINE.evaluate_necessity(
        address_field, category="location", sensitive=False, purpose_slug="online_checkout", raw_purpose="online checkout"
    )
    assert v_addr_ecom == "needed"

    v_phone_ecom, _ = ENGINE.evaluate_necessity(
        phone_field, category="contact", sensitive=False, purpose_slug="online_checkout", raw_purpose="online checkout"
    )
    assert v_phone_ecom == "needed"


# ---------------------------------------------------------
# Test 6: Purpose Profiles - All 14 Categories Covered
# ---------------------------------------------------------
def test_all_14_purpose_profiles_exist_and_function():
    """Verify all 14 standard purposes are present in the dictionary."""
    purposes = ENGINE.purposes
    assert len(purposes) == 14

    required_slugs = {
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

    found_slugs = {p["id"] for p in purposes}
    assert found_slugs == required_slugs

    # Test Donation: PAN is Needed under 80G tax exemption rule
    pan_field = {"name": "pan", "tokens": ["pan"]}
    v_pan_donation, _ = ENGINE.evaluate_necessity(
        pan_field, category="government_id", sensitive=True, purpose_slug="donation", raw_purpose="charity donation"
    )
    assert v_pan_donation == "needed"

    # Test Loan / KYC: PAN and Aadhaar are Needed under RBI Master Directions
    v_pan_loan, _ = ENGINE.evaluate_necessity(
        pan_field, category="government_id", sensitive=True, purpose_slug="loan_kyc", raw_purpose="loan application"
    )
    assert v_pan_loan == "needed"

    # Test Job Application: resume is Needed, religion/caste is Excess
    resume_field = {"name": "resume", "tokens": ["resume"]}
    v_resume, _ = ENGINE.evaluate_necessity(
        resume_field, category="employment_education", sensitive=False, purpose_slug="job_application", raw_purpose="job application"
    )
    assert v_resume == "needed"

    religion_field = {"name": "religion", "tokens": ["religion"]}
    v_religion, _ = ENGINE.evaluate_necessity(
        religion_field, category="demographic", sensitive=True, purpose_slug="job_application", raw_purpose="job application"
    )
    assert v_religion == "excess"


# ---------------------------------------------------------
# Test 7: Regex Patterns Validation
# ---------------------------------------------------------
def test_strict_regex_patterns():
    """Verify Aadhaar, PAN, PIN code, and phone regex patterns."""
    # Aadhaar 12-digit (valid vs invalid)
    res_aadhaar_valid = ENGINE.match_regex_pattern("5482 1234 5678")
    assert res_aadhaar_valid is not None
    assert res_aadhaar_valid[0] == "aadhaar"
    assert res_aadhaar_valid[1] == "government_id"
    assert res_aadhaar_valid[2] is True

    assert ENGINE.match_regex_pattern("0123 4567 8901") is None  # Cannot start with 0 or 1
    assert ENGINE.match_regex_pattern("123456789") is None        # Invalid length

    # PAN 10-character alphanumeric (5 uppercase letters, 4 digits, 1 letter)
    res_pan_valid = ENGINE.match_regex_pattern("ABCDE1234F")
    assert res_pan_valid is not None
    assert res_pan_valid[0] == "pan"
    assert res_pan_valid[1] == "government_id"
    assert res_pan_valid[2] is True

    assert ENGINE.match_regex_pattern("ABC123456F") is None

    # PIN code (6 digits, cannot start with 0)
    res_pin_valid = ENGINE.match_regex_pattern("400001")
    assert res_pin_valid is not None
    assert res_pin_valid[0] == "pincode"
    assert res_pin_valid[1] == "location"

    assert ENGINE.match_regex_pattern("012345") is None

    # Mobile Phone (10 digits starting with 6-9, optional +91)
    res_phone_valid = ENGINE.match_regex_pattern("+91 9876543210")
    assert res_phone_valid is not None
    assert res_phone_valid[0] == "phone"
    assert res_phone_valid[1] == "contact"

    res_phone_plain = ENGINE.match_regex_pattern("9876543210")
    assert res_phone_plain is not None

    assert ENGINE.match_regex_pattern("1234567890") is None  # Starts with 1 (not 6-9)


# ---------------------------------------------------------
# Test 8: Multilingual Consent Notice Drafting (EN / HI / MR)
# ---------------------------------------------------------
def test_multilingual_notice_generation():
    """Verify consent notice generation across English, Hindi, and Marathi."""
    needed_fields = ["Email address", "Full name"]
    purpose = "sending monthly product updates"

    # English Notice
    notice_en = ENGINE.generate_notice(
        collected_fields=needed_fields,
        purpose_description=purpose,
        lang="en",
        has_children_data=False,
    )
    assert notice_en["lang"] == "en"
    assert "Draft notice" in notice_en["draft_banner"]
    assert "Section 6(4)" in notice_en["sections"]["how_to_withdraw"]
    assert "Section 8(7)" in notice_en["sections"]["retention_period"]
    assert "Email address, Full name" in notice_en["sections"]["what_we_collect"]

    # Hindi Notice
    notice_hi = ENGINE.generate_notice(
        collected_fields=needed_fields,
        purpose_description="मासिक समाचार पत्रिका भेजने",
        lang="hi",
        has_children_data=True,
    )
    assert notice_hi["lang"] == "hi"
    assert "सहमति सूचना" in notice_hi["draft_banner"]
    assert "धारा 6(4)" in notice_hi["sections"]["how_to_withdraw"]
    assert "धारा 9(1)" in notice_hi["sections"]["children_notice"]

    # Marathi Notice
    notice_mr = ENGINE.generate_notice(
        collected_fields=needed_fields,
        purpose_description="मासिक माहितीपत्रक पाठवणे",
        lang="mr",
        has_children_data=False,
    )
    assert notice_mr["lang"] == "mr"
    assert "मसुदा संमती सूचना" in notice_mr["draft_banner"]
    assert "कलम ६(४)" in notice_mr["sections"]["how_to_withdraw"]
    assert "तक्रार निवारण" in notice_mr["sections"]["grievance_redressal"]


# ---------------------------------------------------------
# Test 9: Score Calculation with Clamping and Bands
# ---------------------------------------------------------
def test_scoring_algorithm_and_bands():
    """Verify scoring logic, deductions, penalties, and bands."""
    # Perfect form
    clean_fields = [
        {"name": "email", "category": "contact", "sensitive": False, "verdict": "needed"},
    ]
    clean_score = ENGINE.calculate_score(clean_fields)
    assert clean_score["score"] == 100
    assert clean_score["band"] == "strong"

    # Excessive form with sensitive IDs
    excess_fields = [
        {"name": "email", "category": "contact", "sensitive": False, "verdict": "needed"},
        {"name": "aadhaar", "category": "government_id", "sensitive": True, "verdict": "excess"},
        {"name": "pan", "category": "government_id", "sensitive": True, "verdict": "excess"},
        {"name": "dob", "category": "demographic", "sensitive": True, "verdict": "excess"},
        {"name": "phone", "category": "contact", "sensitive": False, "verdict": "review"},
    ]
    poor_score = ENGINE.calculate_score(excess_fields, has_children_data=True)
    # Expected: 100 - (20*3) - 10 (gov id penalty) - 5 (review) - 15 (children) = 10
    assert poor_score["score"] <= 39
    assert poor_score["band"] == "poor"
    assert len(poor_score["improvements"]) > 0
