import re
from typing import Any, Dict, List, Optional, Tuple
from bs4 import BeautifulSoup

from app.models.audit import InputMode


def normalize_tokens(text: str) -> List[str]:
    """
    Splits field names by underscores, hyphens, and camelCase.
    Strips common prefixes like usr_, user_, txt_, input_, field_.
    """
    if not text:
        return []

    # Insert space before camelCase capitals
    s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    # Replace symbols and digits with spaces
    s2 = re.sub(r"[_\-\.\:\/]", " ", s1)
    # Strip non-alphanumeric
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", s2).lower()
    raw_tokens = [t.strip() for t in cleaned.split() if t.strip()]

    # Prefixes to strip
    ignored_prefixes = {"usr", "user", "txt", "input", "field", "form", "fld", "inp", "ctl"}
    final_tokens = []
    for t in raw_tokens:
        if t in ignored_prefixes:
            continue
        final_tokens.append(t)

    return final_tokens or raw_tokens


def detect_mode(form_input: str, explicit_mode: Optional[InputMode] = None) -> InputMode:
    """Detect whether input is raw HTML or field list."""
    if explicit_mode:
        return explicit_mode

    trimmed = form_input.strip()
    if trimmed.startswith("<") or re.search(r"<(input|select|textarea|form|button|div)[^>]*>", trimmed, re.IGNORECASE):
        return InputMode.HTML
    return InputMode.FIELD_LIST


def parse_html_form(html_content: str) -> List[Dict[str, Any]]:
    """
    Extracts inputs, textareas, and select elements from HTML snippet.
    Extracts name, id, type, autocomplete, placeholder, label, and normalized tokens.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    fields: List[Dict[str, Any]] = []

    # Find all input, select, textarea
    elements = soup.find_all(["input", "select", "textarea"])

    for el in elements:
        tag = el.name.lower()
        input_type = (el.get("type") or ("textarea" if tag == "textarea" else "select" if tag == "select" else "text")).lower()

        # Skip submission buttons if they don't carry personal data
        if input_type in {"submit", "reset", "button"}:
            continue

        name = el.get("name") or el.get("id") or ""
        el_id = el.get("id") or ""
        autocomplete = el.get("autocomplete") or ""
        placeholder = el.get("placeholder") or ""
        aria_label = el.get("aria-label") or ""

        # Find associated label
        label_text = ""
        if el_id:
            lbl = soup.find("label", attrs={"for": el_id})
            if lbl:
                label_text = lbl.get_text(strip=True)

        # If not found by 'for', check if element is inside a <label>
        if not label_text:
            parent_lbl = el.find_parent("label")
            if parent_lbl:
                # get text without child input text
                label_text = parent_lbl.get_text(strip=True)

        if not label_text and aria_label:
            label_text = aria_label

        # If name is empty, fallback to id, placeholder or label
        display_name = name or el_id or placeholder or label_text or f"unnamed_{tag}_{len(fields)+1}"

        tokens = normalize_tokens(display_name)
        if placeholder:
            tokens.extend(normalize_tokens(placeholder))
        if label_text:
            tokens.extend(normalize_tokens(label_text))

        fields.append({
            "name": display_name,
            "label": label_text or placeholder or display_name,
            "type": input_type,
            "autocomplete": autocomplete,
            "placeholder": placeholder,
            "tokens": list(dict.fromkeys(tokens)),  # unique preserve order
        })

    return fields


def parse_field_list(text_content: str) -> List[Dict[str, Any]]:
    """
    Parses comma-separated, semicolon-separated, or newline-separated field names.
    """
    # Replace commas, semicolons, brackets with newlines
    normalized = re.sub(r"[,;\n\r]+", "\n", text_content)
    raw_lines = [line.strip().strip("'\"[]") for line in normalized.split("\n")]
    field_names = [f for f in raw_lines if f and f.lower() not in {"submit", "reset"}]

    fields: List[Dict[str, Any]] = []
    for raw_name in field_names:
        tokens = normalize_tokens(raw_name)
        # Infer basic type from name if possible
        inferred_type = "text"
        lower_name = raw_name.lower()
        if any(k in lower_name for k in ["pass", "pwd"]):
            inferred_type = "password"
        elif any(k in lower_name for k in ["mail"]):
            inferred_type = "email"
        elif any(k in lower_name for k in ["phone", "mob", "tel"]):
            inferred_type = "tel"
        elif any(k in lower_name for k in ["dob", "date", "birth"]):
            inferred_type = "date"

        fields.append({
            "name": raw_name,
            "label": raw_name.replace("_", " ").title(),
            "type": inferred_type,
            "autocomplete": "",
            "placeholder": "",
            "tokens": tokens,
        })

    return fields


def parse_form_input(form_input: str, explicit_mode: Optional[InputMode] = None) -> Tuple[InputMode, List[Dict[str, Any]]]:
    """Top-level parser resolving input mode and extracted field definitions."""
    mode = detect_mode(form_input, explicit_mode)
    if mode == InputMode.HTML:
        fields = parse_html_form(form_input)
        # Fallback to field_list parser if HTML parser found no inputs
        if not fields:
            fields = parse_field_list(form_input)
            mode = InputMode.FIELD_LIST
    else:
        fields = parse_field_list(form_input)

    return mode, fields
