from typing import List
from app.models.audit import Category, DraftNotice, FieldResult, Verdict

# Natural field term translations
FIELD_TRANSLATIONS = {
    "email": {"hi": "ईमेल पता", "mr": "ईमेल पत्ता"},
    "name": {"hi": "पूर्ण नाम", "mr": "पूर्ण नाव"},
    "first_name": {"hi": "पहला नाम", "mr": "पहिले नाव"},
    "phone": {"hi": "फ़ोन नंबर", "mr": "फोन नंबर"},
    "mobile": {"hi": "मोबाइल नंबर", "mr": "मोबाईल नंबर"},
    "address": {"hi": "डाक पता", "mr": "टपाल पत्ता"},
    "city": {"hi": "शहर", "mr": "शहर"},
    "state": {"hi": "राज्य", "mr": "राज्य"},
    "pincode": {"hi": "पिन कोड", "mr": "पिन कोड"},
    "resume": {"hi": "बायोडाटा / बायो-डेटा (Resume)", "mr": "रेझ्युमे (बायोडाटा)"},
    "message": {"hi": "संदेश सामग्री", "mr": "संदेश तपशील"},
    "password": {"hi": "खाता पासवर्ड", "mr": "खाते पासवर्ड"},
    "rating": {"hi": "प्रतिक्रिया रेटिंग", "mr": "अभिप्राय रेटिंग"},
}


def humanize_field_name(name: str) -> str:
    cleaned = name.replace("_", " ").replace("-", " ").strip()
    return cleaned.title() if cleaned else "Field"


def translate_field(name: str, lang: str) -> str:
    lower = name.lower()
    for key, trans in FIELD_TRANSLATIONS.items():
        if key in lower:
            return trans.get(lang, humanize_field_name(name))
    return humanize_field_name(name)


def generate_draft_notice(
    fields: List[FieldResult],
    raw_purpose: str,
) -> DraftNotice:
    """
    Generates a legally structured Draft Consent Notice in English, Hindi, and Marathi
    pursuant to Section 6 of the Digital Personal Data Protection (DPDP) Act, 2023.
    Only needed (and justified review) fields are included. Excess fields are excluded.
    """
    needed_fields = [f for f in fields if f.verdict in {Verdict.NEEDED, Verdict.REVIEW}]
    collected_names = [humanize_field_name(f.name) for f in needed_fields]

    has_children_data = any(f.category == Category.CHILDREN_DATA for f in needed_fields)

    # --- 1. English Draft Notice ---
    en_items = "\n".join(f"  • {name}" for name in collected_names) if collected_names else "  • No personal data fields required"

    en_children_clause = (
        "\n4. Protection of Children's Data:\n"
        "As this processing may involve personal data of minors, verifiable parental consent "
        "must be obtained before processing in accordance with DPDP requirements.\n"
        if has_children_data else ""
    )

    en_text = f"""--- DRAFT CONSENT NOTICE (DPDP ACT, 2023) ---
[Draft for guidance only. Review with a qualified legal professional before publishing.]

1. What We Collect:
We collect only the minimum personal data strictly necessary to fulfill this purpose:
{en_items}

2. Why We Collect It:
We collect and process your personal data solely for the purpose of: {raw_purpose}.
Your data will not be processed for any incompatible secondary purpose without your separate, explicit consent.

3. How to Withdraw Consent:
You have the right to withdraw your consent at any time without negative consequences for prior lawful processing.
To withdraw your consent:
  • Contact us by email at: [your contact email]
  • Or use our automated preference center / unsubscribe mechanism at: [link to preferences/unsubscribe]
Upon receiving your withdrawal request, we will cease processing your personal data within statutory timelines.
{en_children_clause}
5. Data Retention & Grievance Redressal:
  • Data will be retained only for: [retention period, e.g., 6 months after inquiry resolution]
  • Grievance Officer Contact: [Grievance Officer Name, Email: grievance@[yourdomain.com]]
  • You also have the right to lodge a complaint with the Data Protection Board of India if unresolved.
"""

    # --- 2. Hindi (हिन्दी) Draft Notice ---
    hi_items_list = [translate_field(f.name, "hi") for f in needed_fields]
    hi_items = "\n".join(f"  • {item}" for item in hi_items_list) if hi_items_list else "  • किसी व्यक्तिगत डेटा की आवश्यकता नहीं है"

    hi_children_clause = (
        "\n४. बच्चों के डेटा का संरक्षण:\n"
        "यदि इस प्रक्रिया में अवयस्कों (नाबालिगों) का व्यक्तिगत डेटा शामिल है, "
        "तो नियमानुसार सत्यापन योग्य अभिभावक/माता-पिता की सहमति प्राप्त की जाएगी।\n"
        if has_children_data else ""
    )

    hi_text = f"""--- सहमति सूचना प्रारूप (डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023) ---
[यह केवल मार्गदर्शन हेतु एक प्रारूप है। प्रकाशित करने से पूर्व किसी योग्य कानूनी विशेषज्ञ से समीक्षा कराएं।]

१. हम क्या एकत्र करते हैं:
हम केवल वही न्यूनतम व्यक्तिगत डेटा एकत्र करते हैं जो इस उद्देश्य के लिए नितांत आवश्यक है:
{hi_items}

२. हम इसे क्यों एकत्र करते हैं:
हम आपकी व्यक्तिगत जानकारी केवल निम्नलिखित उद्देश्य के लिए एकत्र और संसाधित करते हैं: {raw_purpose}।
आपकी सहमति के बिना आपके डेटा का उपयोग किसी अन्य असंगत उद्देश्य के लिए नहीं किया जाएगा।

३. सहमति कैसे वापस लें:
आपको किसी भी समय अपनी सहमति बिना किसी पूर्व शर्त के वापस लेने का पूर्ण अधिकार है:
  • हमें ईमेल करें: [your contact email]
  • या अनसब्सक्राइब / प्राथमिकता प्रबंधन लिंक का उपयोग करें: [अंशदान समाप्ति लिंक]
सहमति वापस लेने से पूर्व किए गए वैध प्रसंस्करण पर इसका कोई प्रतिकूल प्रभाव नहीं पड़ेगा।
{hi_children_clause}
५. डेटा प्रतिधारण और शिकायत निवारण:
  • डेटा प्रतिधारण अवधि: [डेटा रखने की समय-सीमा, उदा. उद्देश्य पूर्ण होने के 6 माह बाद तक]
  • शिकायत निवारण अधिकारी संपर्क: [अधिकारी का नाम, ईमेल: grievance@[yourdomain.com]]
  • समाधान न होने पर आपको भारतीय डेटा संरक्षण बोर्ड में शिकायत दर्ज करने का अधिकार है।
"""

    # --- 3. Marathi (मराठी) Draft Notice ---
    mr_items_list = [translate_field(f.name, "mr") for f in needed_fields]
    mr_items = "\n".join(f"  • {item}" for item in mr_items_list) if mr_items_list else "  • कोणत्याही वैयक्तिक डेटाची आवश्यकता नाही"

    mr_children_clause = (
        "\n४. लहान मुलांच्या डेटाचे संरक्षण:\n"
        "या प्रक्रियेत अल्पवयीन मुलांचा डेटा समाविष्ट असल्यास, "
        "कायद्यानुसार पालकांची पडताळणीयोग्य संमती घेणे बंधनकारक राहील.\n"
        if has_children_data else ""
    )

    mr_text = f"""--- संमती सूचना मसुदा (डिजिटल वैयक्तिक डेटा संरक्षण कायदा, २०२३) ---
[हा केवळ मार्गदर्शनासाठी तयार केलेला मसुदा आहे. प्रसिद्ध करण्यापूर्वी कायदेशीर तज्ञांकडून तपासून घ्यावा.]

१. आम्ही काय गोळा करतो:
आम्ही केवळ या उद्देशासाठी आवश्यक असणारी किमान वैयक्तिक माहिती गोळा करतो:
{mr_items}

२. आम्ही ते का गोळा करतो:
आम्ही आपली माहिती केवळ खालील उद्देशासाठी गोळा आणि प्रक्रिया करतो: {raw_purpose}.
आपल्या स्वतंत्र संमतीशिवाय इतर कोणत्याही कारणासाठी ही माहिती वापरली जाणार नाही.

३. संमती कशी मागे घ्यावी:
आपण कोणत्याही वेळी आपली संमती मागे घेऊ शकता:
  • आम्हाला येथे ईमेल पाठवा: [your contact email]
  • किंवा अनसब्सक्राइब पर्यायाचा वापर करा: [अनसब्सक्राइब लिंक]
संमती मागे घेतल्यामुळे पूर्वी केलेल्या कायदेशीर प्रक्रियेवर कोणताही परिणाम होणार नाही.
{mr_children_clause}
५. डेटा ठेवण्याचा कालावधी आणि तक्रार निवारण:
  • डेटा साठवण कालावधी: [कालावधी, उदा. सेवा पूर्ण झाल्यानंतर ६ महिने]
  • तक्रार निवारण अधिकारी: [नाव, ईमेल: grievance@[yourdomain.com]]
  • समाधान न झाल्यास आपल्याला भारतीय डेटा संरक्षण मंडळाकडे तक्रार करण्याचा अधिकार आहे.
"""

    return DraftNotice(
        en=en_text.strip(),
        hi=hi_text.strip(),
        mr=mr_text.strip(),
        collected_fields=collected_names,
        purpose=raw_purpose,
        disclaimer="Draft notice for guidance only. Review with a qualified legal professional before publishing.",
    )
