from fastapi.testclient import TestClient


def test_root_and_health(client: TestClient):
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert "DPDP Form Auditor" in r_root.json()["service"]

    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    data = r_health.json()
    assert data["status"] == "ok"
    assert "mongodb" in data
    assert "connected" in data["mongodb"]
    assert "mode" in data["mongodb"]
    assert "storage" in data


def test_get_purposes(client: TestClient):
    res = client.get("/api/purposes")
    assert res.status_code == 200
    data = res.json()
    assert "purposes" in data
    assert "categories" in data
    purpose_ids = [p["id"] for p in data["purposes"]]
    assert "newsletter_signup" in purpose_ids
    assert "contact_us" in purpose_ids
    assert "online_checkout" in purpose_ids


def test_audit_messy_form(client: TestClient):
    # Test case matching SKILL.md section 14 (messy form test)
    messy_input = "usr_nm, mob_no, e_mail, dob_dd, aadhar_no, pan, addr_line1, pincode, gender_sel, income_range, csrf_token, submit"
    payload = {
        "form_input": messy_input,
        "purpose": "newsletter signup",
    }
    res = client.post("/api/audit", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["id"].startswith("aud_")
    assert data["purpose"] == "newsletter signup"
    assert "summary" in data
    assert data["summary"]["total_fields"] >= 10

    # Fields verification
    fields = data["fields"]
    email_field = next(f for f in fields if "mail" in f["name"])
    assert email_field["verdict"] == "needed"

    csrf_field = next(f for f in fields if "csrf" in f["name"])
    assert csrf_field["verdict"] == "not_personal"

    aadhaar_field = next(f for f in fields if "aadhar" in f["name"])
    assert aadhaar_field["verdict"] == "excess"
    assert aadhaar_field["sensitive"] is True

    # Consent notice
    assert "[your contact email]" in data["notice"]["en"]
    assert "हम क्या एकत्र करते हैं" in data["notice"]["hi"]

    # History verification
    h_res = client.get("/api/history")
    assert h_res.status_code == 200
    h_data = h_res.json()
    assert h_data["total"] >= 1
    assert any(item["id"] == data["id"] for item in h_data["items"])

    # Single item history
    single_res = client.get(f"/api/history/{data['id']}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == data["id"]

    # Export report
    exp_res = client.post(
        "/api/export",
        json={"audit_id": data["id"], "format": "txt", "language": "en"},
    )
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert "filename" in exp_data
    assert "DPDP FORM AUDITOR - COMPLIANCE REPORT" in exp_data["content"]


def test_audit_html_form(client: TestClient):
    html = """
    <form>
        <input name="email" type="email" placeholder="Your Email">
        <input name="message" type="text" placeholder="Your Message">
        <input name="name" type="text" placeholder="Your Name">
    </form>
    """
    res = client.post("/api/audit", json={"form_input": html, "purpose": "contact us"})
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["excess_count"] == 0
    assert data["score"]["score"] >= 85


def test_validation_errors(client: TestClient):
    # Empty input
    r1 = client.post("/api/audit", json={"form_input": "", "purpose": "newsletter"})
    assert r1.status_code == 422

    # Empty purpose
    r2 = client.post("/api/audit", json={"form_input": "email", "purpose": ""})
    assert r2.status_code == 422
