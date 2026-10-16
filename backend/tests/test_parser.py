from app.models.audit import InputMode
from app.services.parser import (
    detect_mode,
    normalize_tokens,
    parse_field_list,
    parse_form_input,
    parse_html_form,
)


def test_normalize_tokens():
    assert "mob" in normalize_tokens("mob_no")
    assert "email" in normalize_tokens("userEmailAddress")
    assert "dob" in normalize_tokens("usr_dob")
    assert "aadhaar" in normalize_tokens("aadhaar_num")
    assert "csrf" in normalize_tokens("csrf_token")


def test_detect_mode():
    assert detect_mode("<form><input name='email'></form>") == InputMode.HTML
    assert detect_mode("email, phone, name") == InputMode.FIELD_LIST


def test_parse_html_form():
    html = """
    <form action="/submit" method="POST">
        <label for="usr">Full Name</label>
        <input type="text" id="usr" name="usr_nm" placeholder="Enter your full name">

        <label for="ph">Mobile</label>
        <input type="tel" id="ph" name="mob_no" autocomplete="tel">

        <input type="email" name="e_mail" placeholder="user@example.com">
        <input type="password" name="pwd">
        <input type="hidden" name="csrf_token" value="abc123xyz">
        <button type="submit">Submit Form</button>
    </form>
    """
    fields = parse_html_form(html)
    assert len(fields) == 5  # submit button skipped
    field_names = [f["name"] for f in fields]
    assert "usr_nm" in field_names
    assert "mob_no" in field_names
    assert "e_mail" in field_names
    assert "pwd" in field_names
    assert "csrf_token" in field_names

    # Check labels extracted
    usr_field = next(f for f in fields if f["name"] == "usr_nm")
    assert "Full Name" in usr_field["label"]

    ph_field = next(f for f in fields if f["name"] == "mob_no")
    assert ph_field["autocomplete"] == "tel"


def test_parse_field_list():
    raw_list = "usr_nm, mob_no, e_mail, dob_dd, aadhar_no, pan, csrf_token"
    fields = parse_field_list(raw_list)
    assert len(fields) == 7
    names = [f["name"] for f in fields]
    assert "usr_nm" in names
    assert "aadhar_no" in names
    assert "pan" in names
