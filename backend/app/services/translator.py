"""
Google Translator Service for DPDP Form Auditor.
Provides high-fidelity translation between English, Hindi ('hi'), and Marathi ('mr')
for custom form purposes, field names, compliance reasons, and Section 6 DPDP consent notices.

Features:
- Integrated with `deep-translator` (GoogleTranslator backend).
- In-memory caching for zero latency on duplicate queries.
- High-fidelity DPDP terminology harmonization (e.g. consent -> सहमति/संमती).
- Resilient offline fallback engine ensuring 100% uptime even if Google blocks or rate-limits requests.
"""

from __future__ import annotations
import logging
import re
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger("dpdp_translator")

# Try importing GoogleTranslator from deep_translator
try:
    from deep_translator import GoogleTranslator
    HAS_DEEP_TRANSLATOR = True
except ImportError:
    HAS_DEEP_TRANSLATOR = False
    logger.warning("deep-translator not installed. Operating in offline fallback mode.")

# Golden standard DPDP Act 2023 terminology
DPDP_TERMS: Dict[str, Dict[str, str]] = {
    "consent": {
        "hi": "सहमति",
        "mr": "संमती",
    },
    "personal data": {
        "hi": "व्यक्तिगत डेटा",
        "mr": "वैयक्तिक माहिती",
    },
    "withdraw": {
        "hi": "सहमति वापस लेना",
        "mr": "संमती मागे घेणे",
    },
    "withdraw consent": {
        "hi": "सहमति वापस लेना",
        "mr": "संमती मागे घेणे",
    },
    "withdrawal of consent": {
        "hi": "सहमति की वापसी",
        "mr": "संमती मागे घेणे",
    },
    "withdrawal rights": {
        "hi": "सहमति वापस लेने का अधिकार",
        "mr": "संमती मागे घेण्याचा अधिकार",
    },
    "data fiduciary": {
        "hi": "डेटा प्रत्ययी (Data Fiduciary)",
        "mr": "डेटा फिड्युशियरी (Data Fiduciary)",
    },
    "data principal": {
        "hi": "डेटा स्वामी (Data Principal)",
        "mr": "डेटा प्रिन्सिपल (Data Principal)",
    },
    "grievance redressal": {
        "hi": "शिकायत निवारण",
        "mr": "तक्रार निवारण",
    },
    "grievance officer": {
        "hi": "शिकायत निवारण अधिकारी",
        "mr": "तक्रार निवारण अधिकारी",
    },
    "data protection board of india": {
        "hi": "भारतीय डेटा संरक्षण बोर्ड",
        "mr": "भारतीय डेटा संरक्षण मंडळ",
    },
    "purpose": {
        "hi": "उद्देश्य",
        "mr": "उद्देश",
    },
    "data retention": {
        "hi": "डेटा प्रतिधारण",
        "mr": "डेटा साठवण",
    },
    "children's data": {
        "hi": "बच्चों का व्यक्तिगत डेटा",
        "mr": "लहान मुलांचा वैयक्तिक डेटा",
    },
    "verifiable parental consent": {
        "hi": "सत्यापन योग्य अभिभावक/माता-पिता की सहमति",
        "mr": "पालकांची पडताळणीयोग्य संमती",
    },
    "minimum personal data": {
        "hi": "न्यूनतम आवश्यक व्यक्तिगत डेटा",
        "mr": "किमान आवश्यक वैयक्तिक माहिती",
    },
    "excess": {
        "hi": "अत्यधिक / अनावश्यक",
        "mr": "अनावश्यक / अतिरिक्त",
    },
    "needed": {
        "hi": "आवश्यक",
        "mr": "आवश्यक",
    },
    "review": {
        "hi": "पुनरावलोकन आवश्यक",
        "mr": "पुनरावलोकन आवश्यक",
    },
    "not personal": {
        "hi": "गैर-व्यक्तिगत डेटा",
        "mr": "अ-वैयक्तिक माहिती",
    },
}

# Common form field terminology
FIELD_TERMS: Dict[str, Dict[str, str]] = {
    "email": {"hi": "ईमेल पता", "mr": "ईमेल पत्ता"},
    "name": {"hi": "पूर्ण नाम", "mr": "पूर्ण नाव"},
    "full name": {"hi": "पूर्ण नाम", "mr": "पूर्ण नाव"},
    "first name": {"hi": "पहला नाम", "mr": "पहिले नाव"},
    "last name": {"hi": "अंतिम नाम", "mr": "आडनाव"},
    "phone": {"hi": "फ़ोन नंबर", "mr": "फोन नंबर"},
    "mobile": {"hi": "मोबाइल नंबर", "mr": "मोबाईल नंबर"},
    "phone number": {"hi": "फ़ोन नंबर", "mr": "फोन नंबर"},
    "mobile number": {"hi": "मोबाइल नंबर", "mr": "मोबाईल नंबर"},
    "address": {"hi": "डाक पता", "mr": "टपाल पत्ता"},
    "city": {"hi": "शहर", "mr": "शहर"},
    "state": {"hi": "राज्य", "mr": "राज्य"},
    "pincode": {"hi": "पिन कोड", "mr": "पिन कोड"},
    "pin code": {"hi": "पिन कोड", "mr": "पिन कोड"},
    "zipcode": {"hi": "पिन कोड", "mr": "पिन कोड"},
    "zip code": {"hi": "पिन कोड", "mr": "पिन कोड"},
    "date of birth": {"hi": "जन्म तिथि", "mr": "जन्मतारीख"},
    "dob": {"hi": "जन्म तिथि", "mr": "जन्मतारीख"},
    "age": {"hi": "आयु", "mr": "वय"},
    "gender": {"hi": "लिंग", "mr": "लिंग"},
    "password": {"hi": "खाता पासवर्ड", "mr": "खाते पासवर्ड"},
    "resume": {"hi": "बायोडाटा / बायो-डेटा (Resume)", "mr": "रेझ्युमे (बायोडाटा)"},
    "cv": {"hi": "बायोडाटा (CV)", "mr": "रेझ्युमे (CV)"},
    "message": {"hi": "संदेश सामग्री", "mr": "संदेश तपशील"},
    "rating": {"hi": "प्रतिक्रिया रेटिंग", "mr": "अभिप्राय रेटिंग"},
    "aadhaar": {"hi": "आधार संख्या (अति-संवेदनशील)", "mr": "आधार क्रमांक (अति-संवेदनशील)"},
    "pan": {"hi": "पैन कार्ड विवरण", "mr": "पॅन कार्ड तपशील"},
    "credit card": {"hi": "क्रेडिट कार्ड विवरण", "mr": "क्रेडिट कार्ड तपशील"},
    "bank account": {"hi": "बैंक खाता विवरण", "mr": "बँक खाते तपशील"},
    "salary": {"hi": "वेतन विवरण", "mr": "पगार तपशील"},
    "religion": {"hi": "धर्म (अति-संवेदनशील)", "mr": "धर्म (अति-संवेदनशील माहिती)"},
    "caste": {"hi": "जाति (अति-संवेदनशील)", "mr": "जात (अति-संवेदनशील माहिती)"},
}

# Purpose phrase templates for fallback
PURPOSE_TEMPLATES: Dict[str, Dict[str, str]] = {
    "newsletter signup": {
        "hi": "न्यूज़लेटर सदस्यता और नियमित अपडेट भेजने हेतु",
        "mr": "वृत्तपत्र सदस्यता आणि नियमित अपडेट्स पाठवण्यासाठी",
    },
    "newsletter": {
        "hi": "न्यूज़लेटर सदस्यता और अपडेट",
        "mr": "वृत्तपत्र सदस्यता आणि अपडेट्स",
    },
    "contact us": {
        "hi": "ग्राहक संपर्क, सहायता एवं पूछताछ निवारण",
        "mr": "ग्राहक संपर्क, मदत आणि चौकशी निवारण",
    },
    "contact": {
        "hi": "ग्राहक संपर्क एवं पूछताछ",
        "mr": "ग्राहक संपर्क आणि चौकशी",
    },
    "job application": {
        "hi": "नौकरी का आवेदन एवं भर्ती मूल्यांकन प्रक्रिया",
        "mr": "नोकरीचा अर्ज आणि भरती मूल्यमापन प्रक्रिया",
    },
    "job": {
        "hi": "नौकरी का आवेदन",
        "mr": "नोकरीचा अर्ज",
    },
    "user registration": {
        "hi": "उपयोगकर्ता पंजीकरण और सुरक्षित खाता निर्माण",
        "mr": "वापरकर्ता नोंदणी आणि सुरक्षित खाते निर्मिती",
    },
    "registration": {
        "hi": "उपयोगकर्ता पंजीकरण",
        "mr": "वापरकर्ता नोंदणी",
    },
    "online checkout": {
        "hi": "ई-कॉमर्स ऑर्डर प्रसंस्करण, भुगतान सत्यापन एवं उत्पाद वितरण",
        "mr": "ई-कॉमर्स ऑर्डर प्रक्रिया, देयक पडताळणी आणि वस्तू वितरण",
    },
    "e-commerce checkout": {
        "hi": "ई-कॉमर्स ऑर्डर प्रसंस्करण एवं वितरण",
        "mr": "ई-कॉमर्स ऑर्डर प्रक्रिया आणि वितरण",
    },
    "feedback form": {
        "hi": "उपयोगकर्ता प्रतिक्रिया, रेटिंग एवं सेवा सुधार",
        "mr": "वापरकर्ता अभिप्राय, रेटिंग आणि सेवा सुधारणा",
    },
    "feedback": {
        "hi": "प्रतिक्रिया एवं सुझाव",
        "mr": "अभिप्राय आणि सूचना",
    },
    "customer support": {
        "hi": "ग्राहक सेवा, टिकट प्रबंधन एवं तकनीकी सहायता",
        "mr": "ग्राहक सेवा, तिकीट व्यवस्थापन आणि तांत्रिक मदत",
    },
    "event registration": {
        "hi": "कार्यक्रम पंजीकरण, पास जारी करना एवं उपस्थिति प्रबंधन",
        "mr": "इव्हेंट नोंदणी, पास जारी करणे आणि उपस्थिती व्यवस्थापन",
    },
}

# General word-level dictionary for fallback translations
OFFLINE_WORD_DICT: Dict[str, Dict[str, str]] = {
    "and": {"hi": "और", "mr": "आणि"},
    "for": {"hi": "के लिए", "mr": "साठी"},
    "the": {"hi": "", "mr": ""},
    "of": {"hi": "का / की", "mr": "चे / ची"},
    "in": {"hi": "में", "mr": "मध्ये"},
    "to": {"hi": "को", "mr": "स"},
    "service": {"hi": "सेवा", "mr": "सेवा"},
    "account": {"hi": "खाता", "mr": "खाते"},
    "support": {"hi": "सहायता", "mr": "मदत"},
    "portal": {"hi": "पोर्टल", "mr": "पोर्टल"},
    "customer": {"hi": "ग्राहक", "mr": "ग्राहक"},
    "authentication": {"hi": "प्रमाणीकरण", "mr": "प्रमाणीकरण"},
    "login": {"hi": "लॉगिन", "mr": "लॉगिन"},
    "signup": {"hi": "पंजीकरण", "mr": "नोंदणी"},
    "order": {"hi": "ऑर्डर", "mr": "ऑर्डर"},
    "delivery": {"hi": "वितरण", "mr": "वितरण"},
    "payment": {"hi": "भुगतान", "mr": "देयक / पेमेंट"},
    "inquiry": {"hi": "पूछताछ", "mr": "चौकशी"},
    "processing": {"hi": "प्रसंस्करण", "mr": "प्रक्रिया"},
    "information": {"hi": "जानकारी", "mr": "माहिती"},
    "management": {"hi": "प्रबंधन", "mr": "व्यवस्थापन"},
}


class GoogleTranslatorService:
    """
    Multilingual translation service utilizing GoogleTranslator with robust
    caching, DPDP legal term harmonization, and offline fallback resilience.
    """

    def __init__(self):
        self._cache: Dict[Tuple[str, str, str], str] = {}
        self._prepopulate_cache()

    def _prepopulate_cache(self) -> None:
        """Seeds the in-memory cache with standard DPDP and form terms."""
        for term, langs in DPDP_TERMS.items():
            for lang, trans in langs.items():
                self._cache[("auto", lang, term)] = trans
                self._cache[("en", lang, term)] = trans
                # Reverse mapping to English
                self._cache[(lang, "en", trans)] = term

        for term, langs in FIELD_TERMS.items():
            for lang, trans in langs.items():
                self._cache[("auto", lang, term)] = trans
                self._cache[("en", lang, term)] = trans

        for term, langs in PURPOSE_TEMPLATES.items():
            for lang, trans in langs.items():
                self._cache[("auto", lang, term)] = trans
                self._cache[("en", lang, term)] = trans

    def _harmonize_dpdp_terms(self, text: str, target_lang: str) -> str:
        """
        Ensures DPDP statutory terms maintain accurate legal phrasing
        in target language translations.
        """
        if target_lang not in ("hi", "mr"):
            return text

        harmonized = text
        for term, langs in DPDP_TERMS.items():
            replacement = langs.get(target_lang)
            if not replacement:
                continue
            # If the English term was left untranslated or translated awkwardly,
            # enforce DPDP compliant terminology
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
            harmonized = pattern.sub(replacement, harmonized)

        return harmonized

    def _offline_fallback_translate(
        self, text: str, target_lang: str, source_lang: str = "en"
    ) -> str:
        """
        Zero-failure fallback translation engine using dictionary matching,
        phrase substitution, and semantic templates.
        """
        clean_text = text.strip()
        lower_text = clean_text.lower()

        # 1. Exact match in DPDP terms
        if lower_text in DPDP_TERMS and target_lang in DPDP_TERMS[lower_text]:
            return DPDP_TERMS[lower_text][target_lang]

        # 2. Exact match in field terms
        if lower_text in FIELD_TERMS and target_lang in FIELD_TERMS[lower_text]:
            return FIELD_TERMS[lower_text][target_lang]

        # 3. Exact match in purpose templates
        if lower_text in PURPOSE_TEMPLATES and target_lang in PURPOSE_TEMPLATES[lower_text]:
            return PURPOSE_TEMPLATES[lower_text][target_lang]

        # 4. Partial/substring purpose match
        for key, tmpl in PURPOSE_TEMPLATES.items():
            if key in lower_text and target_lang in tmpl:
                return tmpl[target_lang]

        # 5. Tokenized / phrase replacement translation
        tokens = re.findall(r"\w+|[^\w\s]", clean_text, re.UNICODE)
        translated_tokens = []
        for token in tokens:
            t_lower = token.lower()
            if t_lower in DPDP_TERMS and target_lang in DPDP_TERMS[t_lower]:
                translated_tokens.append(DPDP_TERMS[t_lower][target_lang])
            elif t_lower in FIELD_TERMS and target_lang in FIELD_TERMS[t_lower]:
                translated_tokens.append(FIELD_TERMS[t_lower][target_lang])
            elif t_lower in OFFLINE_WORD_DICT and target_lang in OFFLINE_WORD_DICT[t_lower]:
                val = OFFLINE_WORD_DICT[t_lower][target_lang]
                if val:
                    translated_tokens.append(val)
            else:
                translated_tokens.append(token)

        result = " ".join(translated_tokens)
        # Fix spacing around punctuation
        result = re.sub(r"\s+([,.:;?!])", r"\1", result)
        result = self._harmonize_dpdp_terms(result, target_lang)

        # Fallback suffix if needed to guarantee natural Marathi/Hindi context
        return result if result.strip() else clean_text

    def translate(
        self,
        text: str,
        target_lang: str = "hi",
        source_lang: str = "auto",
    ) -> Dict[str, Any]:
        """
        Translates text between English, Hindi ('hi'), and Marathi ('mr').
        Attempts online GoogleTranslator with automatic fallback to offline dictionary.

        Returns:
            Dict containing translated_text, source_lang, target_lang, engine.
        """
        if not text or not text.strip():
            return {
                "translated_text": text,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "engine": "identity",
            }

        text_clean = text.strip()
        target_lang = target_lang.lower().strip()
        source_lang = source_lang.lower().strip() if source_lang else "auto"

        # Check if identical language
        if source_lang == target_lang and source_lang != "auto":
            return {
                "translated_text": text_clean,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "engine": "identity",
            }

        # Check cache
        cache_key = (source_lang, target_lang, text_clean.lower())
        if cache_key in self._cache:
            return {
                "translated_text": self._cache[cache_key],
                "source_lang": source_lang,
                "target_lang": target_lang,
                "engine": "cached",
            }

        # Attempt GoogleTranslator via deep-translator
        if HAS_DEEP_TRANSLATOR:
            try:
                translator = GoogleTranslator(
                    source=source_lang, target=target_lang
                )
                online_result = translator.translate(text_clean)
                if online_result and online_result.strip():
                    harmonized = self._harmonize_dpdp_terms(
                        online_result.strip(), target_lang
                    )
                    self._cache[cache_key] = harmonized
                    return {
                        "translated_text": harmonized,
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                        "engine": "google_translator",
                    }
            except Exception as e:
                logger.info(
                    f"GoogleTranslator network request failed ({e}). Switching to offline fallback."
                )

        # Resilient offline fallback
        fallback_result = self._offline_fallback_translate(
            text_clean, target_lang, source_lang
        )
        self._cache[cache_key] = fallback_result
        return {
            "translated_text": fallback_result,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "engine": "offline_fallback",
        }

    def translate_field_name(self, name: str, target_lang: str) -> str:
        """Translates a field identifier or label into Hindi or Marathi."""
        clean = name.replace("_", " ").replace("-", " ").strip().lower()
        if target_lang == "en":
            return clean.title()

        if clean in FIELD_TERMS and target_lang in FIELD_TERMS[clean]:
            return FIELD_TERMS[clean][target_lang]

        # Partial matching for field names
        for k, v in FIELD_TERMS.items():
            if k in clean and target_lang in v:
                return v[target_lang]

        # Translate via standard translation
        res = self.translate(clean, target_lang=target_lang, source_lang="en")
        return res["translated_text"]

    def generate_translated_notice(
        self,
        purpose: str,
        fields: List[Union[str, Dict[str, Any]]],
        company_name: Optional[str] = None,
        dpo_email: Optional[str] = None,
        retention_period: Optional[str] = None,
        has_children_data: bool = False,
    ) -> Dict[str, Any]:
        """
        Generates legally structured DPDP Act 2023 Section 6 Consent Notices
        dynamically translated into English, Hindi, and Marathi.
        """
        raw_purpose = purpose.strip() if purpose else "Service delivery"
        company = company_name.strip() if company_name else "[Company / Data Fiduciary Name]"
        contact = dpo_email.strip() if dpo_email else "grievance@[yourcompany.com]"
        retention = retention_period.strip() if retention_period else "6 months after fulfillment of purpose"

        # Extract field names
        field_names: List[str] = []
        for f in fields:
            if isinstance(f, str):
                field_names.append(f)
            elif isinstance(f, dict) and "name" in f:
                field_names.append(str(f["name"]))

        # 1. English Elements
        en_fields_formatted = [f.replace("_", " ").title() for f in field_names]
        en_items = (
            "\n".join(f"  • {fn}" for fn in en_fields_formatted)
            if en_fields_formatted
            else "  • Minimum necessary personal data"
        )
        en_children = (
            "\n4. Protection of Children's Personal Data:\n"
            "As this service may involve personal data of minors, verifiable parental consent "
            "must be obtained before processing under Section 9 of the DPDP Act, 2023.\n"
            if has_children_data
            else ""
        )

        en_notice = f"""--- DRAFT CONSENT NOTICE (DPDP ACT, 2023) ---
[Draft for guidance only. Review with a qualified legal professional before publishing.]

1. What We Collect:
{company} collects only the minimum personal data strictly necessary to fulfill this purpose:
{en_items}

2. Why We Collect It:
We collect and process your personal data solely for the purpose of: {raw_purpose}.
Your personal data will not be processed for any incompatible secondary purpose without your separate, explicit consent.

3. How to Withdraw Consent:
You have the right to withdraw your consent at any time without negative consequences for prior lawful processing:
  • Contact our Grievance Officer: {contact}
  • Or use our automated preference center / unsubscribe mechanism at: [link to preferences/unsubscribe]
Upon receiving your request to withdraw consent, processing will cease within statutory timelines.
{en_children}
5. Data Retention & Grievance Redressal:
  • Retention Period: {retention}
  • Grievance Redressal Officer: {contact}
  • If your grievance remains unresolved, you have the right to register a complaint with the Data Protection Board of India.
"""

        # 2. Hindi Dynamic Translation
        hi_purpose_res = self.translate(raw_purpose, target_lang="hi", source_lang="auto")
        hi_purpose = hi_purpose_res["translated_text"]
        hi_fields = [self.translate_field_name(fn, "hi") for fn in field_names]
        hi_items = (
            "\n".join(f"  • {fn}" for fn in hi_fields)
            if hi_fields
            else "  • किसी व्यक्तिगत डेटा की आवश्यकता नहीं है"
        )
        hi_children = (
            "\n४. बच्चों के व्यक्तिगत डेटा का संरक्षण:\n"
            "यदि इस प्रक्रिया में नाबालिगों का व्यक्तिगत डेटा शामिल है, "
            "तो नियमानुसार सत्यापन योग्य अभिभावक/माता-पिता की सहमति प्राप्त की जाएगी।\n"
            if has_children_data
            else ""
        )

        hi_notice = f"""--- सहमति सूचना प्रारूप (डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023) ---
[यह केवल मार्गदर्शन हेतु एक प्रारूप है। प्रकाशित करने से पूर्व किसी योग्य कानूनी विशेषज्ञ से समीक्षा कराएं।]

१. हम क्या एकत्र करते हैं:
{company} केवल वही न्यूनतम आवश्यक व्यक्तिगत डेटा एकत्र करता है जो इस उद्देश्य के लिए आवश्यक है:
{hi_items}

२. हम इसे क्यों एकत्र करते हैं:
हम आपकी व्यक्तिगत जानकारी केवल निम्नलिखित उद्देश्य के लिए एकत्र और संसाधित करते हैं: {hi_purpose}।
आपकी स्पष्ट सहमति के बिना आपके डेटा का उपयोग किसी अन्य असंगत उद्देश्य के लिए नहीं किया जाएगा।

३. सहमति कैसे वापस लें:
आपको किसी भी समय अपनी सहमति बिना किसी पूर्व शर्त के वापस लेने का पूर्ण अधिकार है:
  • शिकायत निवारण अधिकारी को ईमेल करें: {contact}
  • या अनसब्सक्राइब / प्राथमिकता प्रबंधन लिंक का उपयोग करें: [अंशदान समाप्ति लिंक]
सहमति वापस लेने के अनुरोध पर वैधानिक समय-सीमा के भीतर डेटा प्रसंस्करण बंद कर दिया जाएगा।
{hi_children}
५. डेटा प्रतिधारण और शिकायत निवारण:
  • डेटा प्रतिधारण अवधि: {retention}
  • शिकायत निवारण अधिकारी: {contact}
  • समाधान न होने पर आपको भारतीय डेटा संरक्षण बोर्ड में शिकायत दर्ज करने का अधिकार है।
"""

        # 3. Marathi Dynamic Translation
        mr_purpose_res = self.translate(raw_purpose, target_lang="mr", source_lang="auto")
        mr_purpose = mr_purpose_res["translated_text"]
        mr_fields = [self.translate_field_name(fn, "mr") for fn in field_names]
        mr_items = (
            "\n".join(f"  • {fn}" for fn in mr_fields)
            if mr_fields
            else "  • कोणत्याही वैयक्तिक डेटाची आवश्यकता नाही"
        )
        mr_children = (
            "\n४. लहान मुलांच्या वैयक्तिक डेटाचे संरक्षण:\n"
            "या प्रक्रियेत अल्पवयीन मुलांचा डेटा समाविष्ट असल्यास, "
            "कायद्यानुसार पालकांची पडताळणीयोग्य संमती घेणे बंधनकारक राहील.\n"
            if has_children_data
            else ""
        )

        mr_notice = f"""--- संमती सूचना मसुदा (डिजिटल वैयक्तिक डेटा संरक्षण कायदा, २०२३) ---
[हा केवळ मार्गदर्शनासाठी तयार केलेला मसुदा आहे. प्रसिद्ध करण्यापूर्वी कायदेशीर तज्ञांकडून तपासून घ्यावा.]

१. आम्ही काय गोळा करतो:
{company} केवळ या उद्देशासाठी आवश्यक असणारी किमान आवश्यक वैयक्तिक माहिती गोळा करते:
{mr_items}

२. आम्ही ते का गोळा करतो:
आम्ही आपली माहिती केवळ खालील उद्देशासाठी गोळा आणि प्रक्रिया करतो: {mr_purpose}।
आपल्या स्वतंत्र संमतीशिवाय इतर कोणत्याही कारणासाठी ही माहिती वापरली जाणार नाही.

३. संमती कशी मागे घ्यावी:
आपण कोणत्याही वेळी आपली संमती मागे घेऊ शकता:
  • तक्रार निवारण अधिकाऱ्याशी संपर्क साधा: {contact}
  • किंवा अनसब्सक्राइब पर्यायाचा वापर करा: [अनसब्सक्राइब लिंक]
संमती मागे घेतल्याचे समजल्यानंतर विहित मुदतीत वैयक्तिक डेटा प्रक्रिया थांबवली जाईल.
{mr_children}
५. डेटा ठेवण्याचा कालावधी आणि तक्रार निवारण:
  • डेटा साठवण कालावधी: {retention}
  • तक्रार निवारण अधिकारी: {contact}
  • समाधान न झाल्यास आपल्याला भारतीय डेटा संरक्षण मंडळाकडे तक्रार करण्याचा अधिकार आहे.
"""

        engine_used = (
            "google_translator"
            if (hi_purpose_res.get("engine") == "google_translator" or mr_purpose_res.get("engine") == "google_translator")
            else hi_purpose_res.get("engine", "offline_fallback")
        )

        return {
            "en": en_notice.strip(),
            "hi": hi_notice.strip(),
            "mr": mr_notice.strip(),
            "purpose": raw_purpose,
            "purpose_translations": {
                "en": raw_purpose,
                "hi": hi_purpose,
                "mr": mr_purpose,
            },
            "collected_fields": en_fields_formatted,
            "field_translations": {
                "en": en_fields_formatted,
                "hi": hi_fields,
                "mr": mr_fields,
            },
            "engine": engine_used,
            "disclaimer": "Draft notice for guidance only. Review with a qualified legal professional before publishing.",
        }


# Global translator singleton
translator_service = GoogleTranslatorService()
