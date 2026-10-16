"""
Rules and classification service bridge.
Delegates to the standardized shared/rules_engine.py while exposing models
compatible with FastAPI schemas and backend services.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Ensure shared package is importable
SHARED_DIR = Path(__file__).resolve().parent.parent.parent.parent / "shared"
if str(SHARED_DIR) not in sys.path:
    sys.path.insert(0, str(SHARED_DIR))

from rules_engine import RulesEngine
from app.models.audit import Category, Verdict
from app.models.purpose import CategoryMetadata, PurposeRule

# Initialize singleton RulesEngine with shared dictionary
_ENGINE = RulesEngine()

# Populate CATEGORIES_METADATA with all 14 categories from the shared dictionary
CATEGORIES_METADATA: List[CategoryMetadata] = []
for c in _ENGINE.categories:
    cat_id = c["id"]
    # map to Category enum
    try:
        cat_enum_val = Category(cat_id).value
    except ValueError:
        cat_enum_val = cat_id

    CATEGORIES_METADATA.append(
        CategoryMetadata(
            id=cat_enum_val,
            name=c["name"],
            glyph=c["glyph"],
            sensitive=c["sensitive"],
            color=c["color"],
            bg_color=c["bg_color"],
            description=c["description"],
        )
    )

# Populate PURPOSE_RULES with all 14 purpose profiles from the shared dictionary
PURPOSE_RULES: Dict[str, PurposeRule] = {}
for p in _ENGINE.purposes:
    PURPOSE_RULES[p["id"]] = PurposeRule(
        id=p["id"],
        name=p["name"],
        description=p["description"],
        needed_fields=p.get("needed_fields", []),
        review_fields=p.get("review_fields", []),
        typically_excess=p.get("typically_excess", []),
    )


def normalize_purpose_slug(raw_purpose: str) -> Tuple[str, Optional[PurposeRule]]:
    """Map natural language purpose string to known purpose rule or fallback."""
    slug, purpose_dict = _ENGINE.match_purpose_profile(raw_purpose)
    if purpose_dict:
        rule = PURPOSE_RULES.get(slug)
        return slug, rule
    return "general_form", None


def classify_field(field_info: Dict[str, Any]) -> Tuple[Category, bool, List[str]]:
    """
    Classifies a field into a DPDP Category using heuristic hierarchy:
    qualifier guards > autocomplete > input type > exact & Hinglish tokens > category pattern > fallback.
    Returns (Category, sensitive_bool, matchedBy_list).
    """
    res = _ENGINE.classify_field(field_info)
    cat_str = res["category"]
    try:
        category = Category(cat_str)
    except ValueError:
        category = Category.NOT_PERSONAL

    return category, res["sensitive"], res["matched_by"]


def evaluate_field_verdict(
    field_info: Dict[str, Any],
    category: Category,
    sensitive: bool,
    matched_by: List[str],
    purpose_slug: str,
    purpose_rule: Optional[PurposeRule],
    raw_purpose: str,
) -> Tuple[Verdict, str]:
    """
    Determines compliance verdict (needed, excess, review, not_personal)
    and returns a one-sentence plain-language rationale.
    """
    cat_str = category.value if isinstance(category, Category) else str(category)
    verdict_str, reason = _ENGINE.evaluate_necessity(
        field_info=field_info,
        category=cat_str,
        sensitive=sensitive,
        purpose_slug=purpose_slug,
        raw_purpose=raw_purpose,
    )

    verdict_map = {
        "needed": Verdict.NEEDED,
        "excess": Verdict.EXCESS,
        "review": Verdict.REVIEW,
        "not_personal": Verdict.NOT_PERSONAL,
    }
    verdict = verdict_map.get(verdict_str, Verdict.REVIEW)
    return verdict, reason


def get_engine() -> RulesEngine:
    """Return the shared RulesEngine singleton."""
    return _ENGINE
