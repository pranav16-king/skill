import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.services.translator import GoogleTranslatorService, translator_service


def test_dpdp_terminology_hindi_and_marathi():
    """Verify high-fidelity DPDP term translations in Hindi and Marathi."""
    service = GoogleTranslatorService()

    # Consent
    res_hi_consent = service.translate("consent", target_lang="hi")
    assert "सहमति" in res_hi_consent["translated_text"]

    res_mr_consent = service.translate("consent", target_lang="mr")
    assert "संमती" in res_mr_consent["translated_text"]

    # Personal Data
    res_hi_pd = service.translate("personal data", target_lang="hi")
    assert "व्यक्तिगत डेटा" in res_hi_pd["translated_text"]

    res_mr_pd = service.translate("personal data", target_lang="mr")
    assert "वैयक्तिक माहिती" in res_mr_pd["translated_text"]

    # Withdraw / Withdraw Consent
    res_hi_withdraw = service.translate("withdraw consent", target_lang="hi")
    assert "सहमति वापस लेना" in res_hi_withdraw["translated_text"]

    res_mr_withdraw = service.translate("withdraw consent", target_lang="mr")
    assert "संमती मागे घेणे" in res_mr_withdraw["translated_text"]


def test_field_name_translation():
    """Verify field name translations for forms."""
    service = GoogleTranslatorService()

    # Email
    assert service.translate_field_name("email", "hi") == "ईमेल पता"
    assert service.translate_field_name("email", "mr") == "ईमेल पत्ता"

    # Phone / Mobile
    assert "मोबाइल" in service.translate_field_name("mobile_number", "hi") or "फ़ोन" in service.translate_field_name("mobile_number", "hi")
    assert "मोबाईल" in service.translate_field_name("mobile_number", "mr") or "फोन" in service.translate_field_name("mobile_number", "mr")

    # Full Name
    assert service.translate_field_name("full_name", "hi") == "पूर्ण नाम"
    assert service.translate_field_name("full_name", "mr") == "पूर्ण नाव"


def test_caching_mechanism():
    """Verify in-memory caching avoids repeated network calls."""
    service = GoogleTranslatorService()
    text = "Custom inquiry for customer assistance"

    # First call
    res1 = service.translate(text, target_lang="hi")
    assert res1["translated_text"]

    # Second call should be served from cache
    res2 = service.translate(text, target_lang="hi")
    assert res2["engine"] == "cached"
    assert res2["translated_text"] == res1["translated_text"]


def test_offline_fallback_on_network_failure():
    """Verify offline fallback gracefully succeeds even when network translation throws."""
    service = GoogleTranslatorService()

    with patch("app.services.translator.GoogleTranslator") as mock_gt:
        instance = mock_gt.return_value
        instance.translate.side_effect = RuntimeError("Network timeout or 429 Too Many Requests")

        # Must not raise an error and must return offline fallback
        res = service.translate("Aadhaar card and PAN number collection", target_lang="hi")
        assert res["translated_text"]
        assert res["engine"] in {"offline_fallback", "cached"}
        assert res["target_lang"] == "hi"


def test_notice_generation_all_languages():
    """Verify complete notice generation in en, hi, mr with children's clause."""
    service = GoogleTranslatorService()
    fields = ["email", "name", "phone_number", "address"]
    purpose = "Job application and candidate interview screening"

    notice = service.generate_translated_notice(
        purpose=purpose,
        fields=fields,
        company_name="Innovate Tech Ltd",
        dpo_email="dpo@innovatetech.in",
        retention_period="12 months following application decision",
        has_children_data=True,
    )

    # English Notice
    assert "Innovate Tech Ltd" in notice["en"]
    assert "dpo@innovatetech.in" in notice["en"]
    assert "Protection of Children's Personal Data" in notice["en"]
    assert "How to Withdraw Consent" in notice["en"]
    assert "Data Protection Board of India" in notice["en"]

    # Hindi Notice
    assert "Innovate Tech Ltd" in notice["hi"]
    assert "सहमति सूचना प्रारूप" in notice["hi"]
    assert "हम क्या एकत्र करते हैं" in notice["hi"]
    assert "सहमति कैसे वापस लें" in notice["hi"]
    assert "बच्चों के व्यक्तिगत डेटा का संरक्षण" in notice["hi"]
    assert "भारतीय डेटा संरक्षण बोर्ड" in notice["hi"]

    # Marathi Notice
    assert "Innovate Tech Ltd" in notice["mr"]
    assert "संमती सूचना मसुदा" in notice["mr"]
    assert "आम्ही काय गोळा करतो" in notice["mr"]
    assert "संमती कशी मागे घ्यावी" in notice["mr"]
    assert "लहान मुलांच्या वैयक्तिक डेटाचे संरक्षण" in notice["mr"]
    assert "भारतीय डेटा संरक्षण मंडळाकडे" in notice["mr"]


def test_api_translate_endpoint(client: TestClient):
    """Test POST /api/translate endpoint."""
    payload = {
        "text": "Consent for processing personal data",
        "target_lang": "hi",
        "source_lang": "en",
    }
    res = client.post("/api/translate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "translated_text" in data
    assert "सहमति" in data["translated_text"]
    assert data["target_lang"] == "hi"
    assert data["source_lang"] == "en"

    # Test Marathi translation
    payload_mr = {
        "text": "Consent for processing personal data",
        "target_lang": "mr",
        "source_lang": "en",
    }
    res_mr = client.post("/api/translate", json=payload_mr)
    assert res_mr.status_code == 200
    data_mr = res_mr.json()
    assert "संमती" in data_mr["translated_text"]
    assert data_mr["target_lang"] == "mr"


def test_api_translate_validation_errors(client: TestClient):
    """Test validation errors for translate endpoint."""
    # Empty text
    res = client.post("/api/translate", json={"text": "", "target_lang": "hi"})
    assert res.status_code == 422

    # Unsupported language
    res = client.post("/api/translate", json={"text": "hello", "target_lang": "fr"})
    assert res.status_code == 400
    assert "Unsupported target language" in res.json()["detail"]


def test_api_translate_notice_endpoint(client: TestClient):
    """Test POST /api/translate/notice endpoint."""
    payload = {
        "purpose": "newsletter signup and periodic privacy bulletin updates",
        "fields": ["email", "first_name", "preferences"],
        "company_name": "DPDP Auditor Org",
        "dpo_email": "privacy@dpdp-auditor.org",
        "retention_period": "Until unsubscribe or consent withdrawal",
        "has_children_data": False,
    }
    res = client.post("/api/translate/notice", json=payload)
    assert res.status_code == 200
    data = res.json()

    # All three languages must be present
    assert "en" in data
    assert "hi" in data
    assert "mr" in data
    assert "What We Collect" in data["en"]
    assert "हम क्या एकत्र करते हैं" in data["hi"]
    assert "आम्ही काय गोळा करतो" in data["mr"]

    # Purpose and field translations
    assert "purpose_translations" in data
    assert "en" in data["purpose_translations"]
    assert "hi" in data["purpose_translations"]
    assert "mr" in data["purpose_translations"]
    assert "field_translations" in data

    # When has_children_data is false, children clause should not be present
    assert "बच्चों के व्यक्तिगत डेटा का संरक्षण" not in data["hi"]
