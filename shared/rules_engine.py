"""
DPDP Compliance Rules & Knowledge Engine
Handles field normalization, qualifier guards, category classification,
purpose-based data minimisation audits, compliance scoring, and multilingual notice generation.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Try to load Pydantic models if available, or fall back to clean TypedDict/dataclasses
try:
    from pydantic import BaseModel, Field
    PYDANTIC_AVAILABLE = True
except ImportError:
    PYDANTIC_AVAILABLE = False


def _find_dictionary_path() -> Path:
    """Locate rules_dictionary.json across common project structures."""
    candidates = [
        Path(__file__).parent / "rules_dictionary.json",
        Path(__file__).resolve().parent.parent / "shared" / "rules_dictionary.json",
        Path("p:/skill/shared/rules_dictionary.json"),
        Path("./shared/rules_dictionary.json"),
        Path("../shared/rules_dictionary.json"),
    ]
    for p in candidates:
        if p.exists():
            return p.resolve()
    raise FileNotFoundError("Could not locate shared/rules_dictionary.json")


class RulesEngine:
    """
    Core Rules Engine for DPDP Form Auditor.
    Reads rules_dictionary.json and provides full classification and evaluation.
    """

    def __init__(self, dictionary_path: Optional[str | Path] = None):
        if dictionary_path:
            self.dict_path = Path(dictionary_path)
        else:
            self.dict_path = _find_dictionary_path()

        with open(self.dict_path, "r", encoding="utf-8") as f:
            self.data: Dict[str, Any] = json.load(f)

        self.categories: List[Dict[str, Any]] = self.data.get("categories", [])
        self.categories_by_id: Dict[str, Dict[str, Any]] = {
            c["id"]: c for c in self.categories
        }
        self.qualifier_guards: List[Dict[str, Any]] = self.data.get("qualifier_guards", [])
        self.regex_patterns: Dict[str, Dict[str, Any]] = self.data.get("regex_patterns", {})
        self.category_keywords: Dict[str, Dict[str, Any]] = self.data.get("category_keywords", {})
        self.purposes: List[Dict[str, Any]] = self.data.get("purposes", [])
        self.purposes_by_id: Dict[str, Dict[str, Any]] = {
            p["id"]: p for p in self.purposes
        }
        self.notice_templates: Dict[str, Any] = self.data.get("notice_templates", {})
        self.scoring_rules: Dict[str, Any] = self.data.get("scoring_rules", {})

        # Compile regular expressions for speed
        self._compiled_regexes = {}
        for k, v in self.regex_patterns.items():
            pattern_str = v.get("pattern", "")
            if pattern_str:
                self._compiled_regexes[k] = re.compile(pattern_str, re.IGNORECASE)

    @staticmethod
    def normalize_tokens(text: str) -> List[str]:
        """
        Splits field names by underscores, hyphens, and camelCase.
        Strips common web prefixes like usr_, user_, txt_, input_, field_, fld_.
        """
        if not text:
            return []

        # Split camelCase: userPhone -> user Phone, dobDD -> dob DD
        s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
        # Replace symbols with spaces
        s2 = re.sub(r"[_\-\.\:\/]", " ", s1)
        # Remove non-alphanumeric except spaces
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", s2).lower()
        raw_tokens = [t.strip() for t in cleaned.split() if t.strip()]

        # Prefixes to strip
        ignored_prefixes = {"usr", "user", "txt", "input", "field", "form", "fld", "inp", "ctl", "lbl"}
        final_tokens = []
        for t in raw_tokens:
            if t in ignored_prefixes and len(raw_tokens) > 1:
                continue
            final_tokens.append(t)

        return final_tokens or raw_tokens

    def check_qualifier_guards(self, tokens: List[str], raw_name: str) -> Optional[Tuple[str, bool, str]]:
        """
        Guards fields such as company_name, product_name, coupon_name, ip_address
        from being wrongly classified as personal identity or location.
        Returns (override_category, sensitive_bool, reason) if triggered.
        """
        name_lower = raw_name.lower().replace("-", "_").strip()
        joined_tokens = "_".join(tokens)

        for guard in self.qualifier_guards:
            for g_token in guard.get("tokens", []):
                g_token_clean = g_token.lower()
                # Check exact match on raw_name, joined_tokens, or token presence
                if (
                    name_lower == g_token_clean
                    or joined_tokens == g_token_clean
                    or name_lower.endswith("_" + g_token_clean)
                    or name_lower.startswith(g_token_clean + "_")
                ):
                    return (
                        guard["override_category"],
                        guard["sensitive"],
                        guard["reason"]
                    )
        return None

    def match_regex_pattern(self, sample_value: str) -> Optional[Tuple[str, str, bool]]:
        """
        Validates sample input values against strict national ID patterns
        (Aadhaar 12-digit, PAN 10-alphanumeric, PIN 6-digit, Phone 10-digit).
        Returns (pattern_key, category, sensitive) if matched.
        """
        if not sample_value:
            return None
        clean_val = sample_value.strip()

        for key, regex in self._compiled_regexes.items():
            if regex.match(clean_val):
                meta = self.regex_patterns[key]
                return key, meta["category"], meta["sensitive"]
        return None

    def classify_field(self, field_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classifies a field into one of the 14 DPDP categories.
        Heuristic priority hierarchy:
        1. Qualifier guards (e.g. company_name, ip_address)
        2. Autocomplete attributes
        3. Input types (email, tel, password, file, date)
        4. Exact token and Hinglish matching
        5. Substring / regex category patterns
        6. Fallback
        """
        name = (field_info.get("name") or "").strip()
        label = (field_info.get("label") or "").strip()
        input_type = (field_info.get("type") or "text").lower().strip()
        autocomplete = (field_info.get("autocomplete") or "").lower().strip()
        placeholder = (field_info.get("placeholder") or "").strip()

        tokens = field_info.get("tokens")
        if tokens is None:
            tokens = self.normalize_tokens(name)

        matched_by: List[str] = []

        # 1. Check Qualifier Guards first (to prevent company_name -> identity, ip_address -> location)
        guard_result = self.check_qualifier_guards(tokens, name)
        if guard_result:
            cat_id, sensitive, reason = guard_result
            matched_by.append(f"qualifier_guard:{cat_id}")
            return {
                "category": cat_id,
                "sensitive": sensitive,
                "matched_by": matched_by,
                "guard_reason": reason
            }

        # 2. Check Autocomplete Attribute
        if autocomplete:
            for cat_id, kw in self.category_keywords.items():
                for auto in kw.get("autocomplete", []):
                    if auto == autocomplete or autocomplete.startswith(auto):
                        cat_meta = self.categories_by_id.get(cat_id, {})
                        matched_by.append(f"autocomplete:{autocomplete}")
                        return {
                            "category": cat_id,
                            "sensitive": cat_meta.get("sensitive", False),
                            "matched_by": matched_by
                        }

        # 3. Check Input Type
        if input_type in {"email"}:
            matched_by.append("type:email")
            return {"category": "contact", "sensitive": False, "matched_by": matched_by}
        if input_type in {"tel"}:
            matched_by.append("type:tel")
            return {"category": "contact", "sensitive": False, "matched_by": matched_by}
        if input_type in {"password"}:
            matched_by.append("type:password")
            return {"category": "credentials", "sensitive": True, "matched_by": matched_by}
        if input_type in {"submit", "reset", "button"}:
            matched_by.append(f"type:{input_type}")
            return {"category": "not_personal", "sensitive": False, "matched_by": matched_by}

        # 4. Check for Not Personal / CSRF tokens
        not_personal_tokens = set(self.category_keywords.get("not_personal", {}).get("tokens", []))
        for t in tokens:
            if t in not_personal_tokens:
                matched_by.append(f"token:{t}")
                return {"category": "not_personal", "sensitive": False, "matched_by": matched_by}

        # 5. Token & Pattern Search with Hinglish support
        # Search priorities: sensitive high-risk categories first, then contact, demographic, location, identity
        priority_categories = [
            "government_id",
            "financial",
            "health",
            "biometric",
            "children_data",
            "credentials",
            "contact",
            "demographic",
            "location",
            "employment_education",
            "behavioral_preference",
            "identity",
            "technical",
            "not_personal"
        ]

        name_lower = name.lower()
        label_lower = label.lower()
        ph_lower = placeholder.lower()
        all_text_candidates = [
            ("name", name_lower),
            ("tokens", " ".join(tokens)),
            ("label", label_lower),
            ("placeholder", ph_lower)
        ]

        # Exact and Hinglish token matching
        for cat_id in priority_categories:
            kw = self.category_keywords.get(cat_id, {})
            cat_tokens = set(kw.get("tokens", []))
            cat_hinglish = set(kw.get("hinglish", []))
            all_known = cat_tokens | cat_hinglish

            # Check exact matches in extracted tokens
            for t in tokens:
                if t in all_known:
                    cat_meta = self.categories_by_id.get(cat_id, {})
                    is_sensitive = cat_meta.get("sensitive", False)
                    # Special check: demographic religion/caste is always sensitive
                    if cat_id == "demographic" and t in {"religion", "caste", "jaati", "dharma"}:
                        is_sensitive = True
                    matched_by.append(f"token:{t}")
                    if input_type and input_type != "text":
                        matched_by.append(f"type:{input_type}")
                    return {
                        "category": cat_id,
                        "sensitive": is_sensitive,
                        "matched_by": matched_by
                    }

            # Check substring matches in name or label
            for candidate_src, text in all_text_candidates:
                if not text:
                    continue
                for item in all_known:
                    # check word boundary
                    if re.search(rf"\b{re.escape(item)}\b", text, re.IGNORECASE):
                        cat_meta = self.categories_by_id.get(cat_id, {})
                        is_sensitive = cat_meta.get("sensitive", False)
                        if cat_id == "demographic" and item in {"religion", "caste", "jaati", "dharma"}:
                            is_sensitive = True
                        matched_by.append(f"{candidate_src}:{item}")
                        return {
                            "category": cat_id,
                            "sensitive": is_sensitive,
                            "matched_by": matched_by
                        }

        # 6. Fallback matching
        if input_type in {"date"}:
            matched_by.append("type:date")
            return {"category": "demographic", "sensitive": False, "matched_by": matched_by}
        if input_type in {"file"}:
            matched_by.append("type:file")
            return {"category": "employment_education", "sensitive": False, "matched_by": matched_by}
        if input_type in {"text", "textarea"} and len(tokens) > 0:
            # Generic text input defaults to identity or review
            matched_by.append("fallback:text")
            return {"category": "identity", "sensitive": False, "matched_by": matched_by}

        matched_by.append("fallback:unknown")
        return {"category": "not_personal", "sensitive": False, "matched_by": matched_by}

    def match_purpose_profile(self, raw_purpose: str) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Maps natural language purpose string to one of the 14 standard profiles.
        """
        p_clean = raw_purpose.lower().strip()

        for purpose in self.purposes:
            p_id = purpose["id"]
            if p_id in p_clean:
                return p_id, purpose
            for alias in purpose.get("aliases", []):
                if alias in p_clean:
                    return p_id, purpose

        return "general_form", None

    def evaluate_necessity(
        self,
        field_info: Dict[str, Any],
        category: str,
        sensitive: bool,
        purpose_slug: str,
        raw_purpose: str
    ) -> Tuple[str, str]:
        """
        Determines compliance verdict (needed, excess, review, not_personal)
        and returns a clear, active-voice, single-sentence rationale.
        """
        tokens = field_info.get("tokens") or self.normalize_tokens(field_info.get("name", ""))
        name = field_info.get("name", "").lower()
        all_terms = set(tokens) | {name}

        if category == "not_personal":
            return (
                "not_personal",
                "A non-personal technical identifier or organizational data point that does not directly identify an individual."
            )

        # Retrieve purpose profile
        purpose = self.purposes_by_id.get(purpose_slug)

        # 1. Newsletter Signup
        if purpose_slug == "newsletter_signup":
            if category == "contact" and any(k in t for t in all_terms for k in ["email", "mail"]):
                return ("needed", "Essential to deliver the newsletter to this recipient.")
            if category == "identity":
                return ("review", "First name is optional; collect only if personalizing newsletter salutations.")
            if any(k in t for t in all_terms for k in ["consent", "agree", "terms"]):
                return ("needed", "Explicit consent confirmation record required under DPDP Act.")
            if category == "government_id":
                return ("excess", "Government identification numbers are disproportionate and strictly unnecessary for a newsletter.")
            if category == "financial":
                return ("excess", "Financial data is strictly unnecessary for receiving a free newsletter.")
            if category in {"demographic", "location"}:
                return ("excess", f"Collecting {name} is unnecessary for a newsletter signup. An email address is sufficient.")
            if category == "contact":
                return ("review", "Phone number is optional at best. Collect only if you send SMS updates, and state so clearly.")
            return ("excess", "Collecting this field exceeds the stated purpose of newsletter subscription.")

        # 2. Contact Us
        if purpose_slug == "contact_us":
            if category == "identity":
                return ("needed", "Required to address the person submitting the inquiry.")
            if category == "contact" and any(k in t for t in all_terms for k in ["email", "mail"]):
                return ("needed", "Required to send an email reply to the inquiry.")
            if any(k in t for t in all_terms for k in ["message", "subject", "inquiry", "query", "body"]):
                return ("needed", "Core message content needed to understand and resolve the inquiry.")
            if category == "contact" and any(k in t for t in all_terms for k in ["phone", "mob", "tel"]):
                return ("review", "Phone number is optional unless phone callback support is explicitly offered.")
            if category in {"government_id", "financial", "health", "biometric"}:
                return ("excess", "High-risk data is excessive for an initial contact or support message.")
            return ("excess", f"Collecting {name} is not necessary to answer a general contact inquiry.")

        # 3. Job Application
        if purpose_slug == "job_application":
            if category == "identity" or (category == "contact" and any(k in t for t in all_terms for k in ["email", "phone", "mob"])):
                return ("needed", "Required to identify and communicate with the job applicant.")
            if category == "employment_education" or any(k in t for t in all_terms for k in ["resume", "cv", "portfolio", "experience", "education", "skills"]):
                return ("needed", "Essential qualification material for reviewing job candidate suitability.")
            if category == "location":
                return ("needed", "Needed to confirm candidate location and work eligibility.")
            if category == "demographic":
                if any(k in t for t in all_terms for k in ["dob", "birth"]):
                    return ("review", "Date of birth should only be requested if a statutory age qualification applies.")
                if any(k in t for t in all_terms for k in ["gender"]):
                    return ("review", "Gender may only be collected if required for voluntary diversity monitoring.")
                return ("excess", "Caste, religion, or marital status must not be requested at the application stage.")
            if category == "government_id":
                return ("excess", "Government IDs (Aadhaar / PAN) should only be requested upon formal hiring, not during initial application.")
            if category == "financial":
                return ("excess", "Bank account and sensitive financial data are excessive prior to employment offer.")
            return ("review", f"Verify that {name} is directly relevant to job performance criteria.")

        # 4. Online Checkout / E-commerce
        if purpose_slug == "online_checkout":
            if category in {"identity", "contact", "location"}:
                return ("needed", "Required for order confirmation, shipping delivery, and receipt generation.")
            if any(k in t for t in all_terms for k in ["payment", "gateway", "method"]):
                return ("needed", "Required to initiate transaction processing with the payment provider.")
            if category == "demographic":
                return ("excess", "Demographic attributes such as gender, religion, or birthdate are not needed to fulfill an online order.")
            if category in {"government_id", "health", "biometric"}:
                return ("excess", "High-risk identifiers and health data are excessive for standard commercial retail purchases.")
            return ("review", f"Evaluate whether {name} is genuinely needed for order fulfillment.")

        # 5. Account Registration
        if purpose_slug == "account_registration":
            if category == "credentials" or (category == "contact" and any(k in t for t in all_terms for k in ["email", "phone"])):
                return ("needed", "Required to authenticate and establish secure user account access.")
            if category == "identity":
                return ("needed", "Required to establish profile ownership and display username.")
            if category == "demographic" and any(k in t for t in all_terms for k in ["dob", "birth", "age"]):
                return ("review", "Collect only minimum age confirmation if statutory age gating is required.")
            if category in {"government_id", "financial"}:
                return ("excess", "Identity documents and financial information are excessive for basic account creation.")
            if category == "location":
                return ("excess", "Full residential address is typically excessive at initial account registration.")
            return ("review", f"Review if {name} is strictly required before the user accesses services.")

        # 6. Event Registration
        if purpose_slug == "event_registration":
            if category in {"identity", "contact"}:
                return ("needed", "Required to issue attendee passes and send event logistics updates.")
            if any(k in t for t in all_terms for k in ["org", "company", "title", "role", "designation"]):
                return ("review", "Professional affiliation is optional unless required for specialized industry sessions.")
            if any(k in t for t in all_terms for k in ["diet", "food", "meal", "t_shirt", "size"]):
                return ("review", "Event logistics preferences are helpful; keep optional and do not link to medical records.")
            if category in {"government_id", "financial", "demographic"}:
                return ("excess", "Sensitive personal data and identity documents are excessive for event participation.")
            return ("excess", f"Field '{name}' is not necessary for event coordination.")

        # 7. Appointment Booking
        if purpose_slug == "appointment_booking":
            if category in {"identity", "contact"}:
                return ("needed", "Required to schedule appointment and send booking confirmations.")
            if any(k in t for t in all_terms for k in ["date", "time", "slot", "service", "doctor"]):
                return ("needed", "Appointment schedule and service selection are essential.")
            if any(k in t for t in all_terms for k in ["symptom", "reason", "notes", "visit"]):
                return ("review", "Brief consultation context is optional prior to actual clinical examination.")
            if category in {"government_id", "financial"}:
                return ("excess", "Financial documents and national IDs are excessive for reserving an appointment slot.")
            return ("excess", f"Field '{name}' is unnecessary for scheduling an appointment.")

        # 8. Loan / KYC Application
        if purpose_slug == "loan_kyc":
            if category in {"identity", "contact", "government_id", "financial", "location"}:
                return ("needed", "Statutory Know Your Customer (KYC) requirement under RBI Master Directions for credit assessment.")
            if category == "demographic" and any(k in t for t in all_terms for k in ["dob", "birth", "age"]):
                return ("needed", "Legal age verification (minimum 18 years) is mandatory for contractual loan agreements.")
            if category == "demographic" and any(k in t for t in all_terms for k in ["religion", "caste", "political"]):
                return ("excess", "Religious, caste, or political beliefs must never be requested for credit underwriting.")
            return ("review", f"Verify regulatory necessity of {name} under current lending guidelines.")

        # 9. Insurance Policy Quote
        if purpose_slug == "insurance_quote":
            if category in {"identity", "contact"}:
                return ("needed", "Required to provide personalized insurance quotations and follow up.")
            if category == "demographic" and any(k in t for t in all_terms for k in ["dob", "birth", "age", "gender"]):
                return ("needed", "Actuarial risk tables require age and gender to calculate insurance mortality premiums.")
            if category == "location" and any(k in t for t in all_terms for k in ["pin", "pincode", "city"]):
                return ("needed", "Geographic pin code determines hospital network tiers and pricing zones.")
            if any(k in t for t in all_terms for k in ["tobacco", "smoke", "sum_assured", "coverage"]):
                return ("needed", "Underwriting parameter strictly needed to calculate insurance premium.")
            if category == "government_id":
                return ("excess", "Aadhaar / PAN is excessive at the initial quote stage; collect only at final policy issuance.")
            if category in {"religion", "caste"}:
                return ("excess", "Belief or caste attributes are illegal considerations for insurance underwriting.")
            return ("review", f"Check if {name} is needed for actuarial calculation.")

        # 10. School / College Admission
        if purpose_slug == "school_admission":
            if category in {"identity", "contact", "location", "children_data"}:
                return ("needed", "Required for student enrollment, guardianship record, and academic correspondence.")
            if category == "demographic" and any(k in t for t in all_terms for k in ["dob", "birth", "age"]):
                return ("needed", "Date of birth is mandatory to determine school age eligibility.")
            if any(k in t for t in all_terms for k in ["caste", "category"]):
                return ("review", "Caste category is permissible solely for statutory RTE or affirmative action reservation quotas.")
            if any(k in t for t in all_terms for k in ["blood", "emergency"]):
                return ("review", "Emergency medical information is advisable for campus student safety.")
            if category in {"financial", "credentials"} and any(k in t for t in all_terms for k in ["card", "pin", "net_worth"]):
                return ("excess", "Detailed financial credentials of parents are excessive for student admission forms.")
            return ("review", f"Verify academic relevance of {name}.")

        # 11. Feedback Survey
        if purpose_slug == "feedback_survey":
            if category == "behavioral_preference" or any(k in t for t in all_terms for k in ["rate", "rating", "score", "feedback", "comment", "review"]):
                return ("needed", "Core response data to evaluate product or service experience.")
            if category == "contact" and any(k in t for t in all_terms for k in ["email", "mail"]):
                return ("review", "Email should remain voluntary, only if the user requests follow-up support.")
            if category in {"contact", "location", "demographic", "government_id", "financial"}:
                return ("excess", "Feedback surveys must respect anonymity; collecting personal identifiers is excessive.")
            return ("excess", f"Field '{name}' is unnecessary for a customer feedback survey.")

        # 12. Complaint / Grievance
        if purpose_slug == "complaint":
            if category in {"identity", "contact"}:
                return ("needed", "Required to identify the complainant and provide status updates on dispute resolution.")
            if any(k in t for t in all_terms for k in ["grievance", "complaint", "description", "incident", "ticket", "order"]):
                return ("needed", "Essential description of the grievance for internal investigation.")
            if category in {"government_id", "financial"}:
                return ("excess", "Government IDs and sensitive financial credentials are excessive for lodging an initial complaint.")
            return ("review", f"Check if {name} is relevant to the dispute.")

        # 13. Donation
        if purpose_slug == "donation":
            if category in {"identity", "contact", "location"}:
                return ("needed", "Required to generate donation receipts and maintain statutory audit records.")
            if any(k in t for t in all_terms for k in ["amount", "donation", "receipt"]):
                return ("needed", "Required transaction value for processing the donation.")
            if category == "government_id" and any(k in t for t in all_terms for k in ["pan"]):
                return ("needed", "Mandatory requirement under Section 80G of the Indian Income Tax Act for issuing tax-exemption receipts.")
            if category in {"demographic", "health", "biometric"}:
                return ("excess", "Personal traits, blood group, or biometric data are excessive for philanthropic donations.")
            return ("review", f"Check statutory requirement of {name} for donation compliance.")

        # 14. Coaching / Demo Registration
        if purpose_slug == "coaching":
            if category in {"identity", "contact", "children_data"}:
                return ("needed", "Required to coordinate demo class attendance and course enrollment communication.")
            if any(k in t for t in all_terms for k in ["exam", "course", "standard", "grade", "target"]):
                return ("needed", "Target curriculum and current grade are necessary to assign the appropriate study batch.")
            if category in {"government_id", "financial"}:
                return ("excess", "Aadhaar, PAN, and family financial records are excessive for attending an academic demo session.")
            return ("review", f"Review if {name} is required for demo class coordination.")

        # Fallback for unrecognised / general purpose
        if category in {"identity", "contact"}:
            return ("needed", f"Standard identification and communication data for '{raw_purpose}'.")
        if sensitive or category in {"government_id", "financial", "health", "biometric"}:
            return (
                "excess",
                f"High-risk data ({category.replace('_', ' ')}) appears disproportionate for '{raw_purpose}' without specific statutory justification."
            )
        return (
            "review",
            f"We did not recognize this specific purpose profile. Evaluate whether {name} is strictly required."
        )

    def calculate_score(self, field_results: List[Dict[str, Any]], has_children_data: bool = False) -> Dict[str, Any]:
        """
        Calculates compliance score (0-100) based on DPDP principles:
        Start 100:
        - 12 per standard excess field
        - 20 per sensitive excess field
        - 5 per review field
        - 15 if children's data without parental consent mechanism
        - 10 if government ID requested disproportionately
        Clamp [0, 100].
        """
        score = self.scoring_rules.get("base_score", 100)
        reasons: List[str] = []
        improvements: List[str] = []

        penalties = self.scoring_rules.get("penalties", {})
        excess_std_penalty = penalties.get("excess_standard", 12)
        excess_sens_penalty = penalties.get("excess_sensitive", 20)
        review_penalty = penalties.get("review", 5)

        excess_count = 0
        review_count = 0
        has_excess_gov_id = False

        for f in field_results:
            verdict = f.get("verdict")
            sensitive = f.get("sensitive", False)
            cat = f.get("category", "")
            name = f.get("name", "field")

            if verdict == "excess":
                excess_count += 1
                if sensitive:
                    score -= excess_sens_penalty
                    reasons.append(f"-{excess_sens_penalty} Excess sensitive data requested: '{name}' ({cat})")
                else:
                    score -= excess_std_penalty
                    reasons.append(f"-{excess_std_penalty} Unnecessary field for purpose: '{name}'")
                improvements.append(f"Remove '{name}' from the form or state a legal justification.")

                if cat == "government_id":
                    has_excess_gov_id = True

            elif verdict == "review":
                review_count += 1
                score -= review_penalty
                reasons.append(f"-{review_penalty} Optional or borderline field: '{name}'")
                improvements.append(f"Make '{name}' strictly optional and explain why it is requested in the notice.")

        if has_excess_gov_id:
            gov_penalty = penalties.get("disproportionate_gov_id", 10)
            score -= gov_penalty
            reasons.append(f"-{gov_penalty} Disproportionate collection of national Government ID without explicit statutory mandate.")
            improvements.append("Refrain from demanding Aadhaar or PAN at initial form submission.")

        if has_children_data:
            child_penalty = penalties.get("unverified_children_data", 15)
            score -= child_penalty
            reasons.append(f"-{child_penalty} Children's personal data detected without explicit parental consent mechanism.")
            improvements.append("Integrate verifiable parental consent under Section 9(1) of the DPDP Act.")

        # Bonus if strict minimisation achieved
        if excess_count == 0 and len(field_results) > 0:
            reasons.append("+10 Strict data minimisation observed across all fields.")

        # Clamp score
        final_score = max(0, min(100, score))

        # Determine band
        bands = self.scoring_rules.get("bands", {})
        band_name = "poor"
        for b_name, b_data in bands.items():
            if b_data.get("min", 0) <= final_score <= b_data.get("max", 100):
                band_name = b_name
                break

        return {
            "score": final_score,
            "band": band_name,
            "reasons": reasons[:6],  # top reasons
            "improvements": list(dict.fromkeys(improvements))[:3]  # top 3 unique improvements
        }

    def generate_notice(
        self,
        collected_fields: List[str],
        purpose_description: str,
        lang: str = "en",
        has_children_data: bool = False,
        contact_email: str = "privacy@example.com",
        retention_period: str = "12 months",
        grievance_officer: str = "Grievance Officer, privacy-officer@example.com"
    ) -> Dict[str, Any]:
        """
        Drafts a legally structured consent notice in English (en), Hindi (hi), or Marathi (mr).
        """
        lang_code = lang.lower() if lang in self.notice_templates else "en"
        tpl = self.notice_templates.get(lang_code, self.notice_templates["en"])

        body = tpl["body"]
        headings = tpl["headings"]
        collected_str = ", ".join(collected_fields) if collected_fields else "None"

        # Format sections
        s1 = body["what_we_collect"].format(collected_fields_list=collected_str)
        s2 = body["why_we_collect"].format(purpose_description=purpose_description)
        s3 = body["how_to_withdraw"].format(contact_email=contact_email)
        s4 = body["grievance_redressal"].format(grievance_officer_contact=grievance_officer)
        s5 = body["retention_period"].format(retention_period=retention_period)

        sections = [
            f"{headings['what_we_collect']}\n{s1}",
            f"{headings['why_we_collect']}\n{s2}",
            f"{headings['how_to_withdraw']}\n{s3}",
            f"{headings['grievance_redressal']}\n{s4}",
            f"{headings['retention_period']}\n{s5}",
        ]

        if has_children_data:
            s6 = body["children_notice"]
            sections.append(f"{headings['children_notice']}\n{s6}")

        full_notice = f"{tpl['draft_banner']}\n\n" + "\n\n".join(sections) + f"\n\n---\n{body['disclaimer']}"

        return {
            "lang": lang_code,
            "language_name": tpl.get("language_name", lang_code),
            "draft_banner": tpl["draft_banner"],
            "formatted_text": full_notice,
            "sections": {
                "what_we_collect": s1,
                "why_we_collect": s2,
                "how_to_withdraw": s3,
                "grievance_redressal": s4,
                "retention_period": s5,
                "children_notice": body["children_notice"] if has_children_data else None,
                "disclaimer": body["disclaimer"]
            }
        }
