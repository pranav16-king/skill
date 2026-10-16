import type { AuditResult, NoticeLanguage } from '../types/dpdp';

export interface NoticeContent {
  headline: string;
  collectTitle: string;
  collectItems: string[];
  purposeTitle: string;
  purposeText: string;
  withdrawTitle: string;
  withdrawText: string;
  retentionTitle: string;
  retentionText: string;
  grievanceTitle: string;
  grievanceText: string;
  childrenNotice?: string;
  excludedNote: string;
  draftDisclaimer: string;
}

export function generateConsentNotice(result: AuditResult, lang: NoticeLanguage): NoticeContent {
  const neededFields = result.fields.filter((f) => f.verdict === 'needed');
  const hasChildren = result.hasChildrenData;

  // Plain names mapping
  const fieldLabel = (name: string, type: string) => {
    const n = name.toLowerCase();
    if (n.includes('mail')) return 'Email address';
    if (n.includes('mob') || n.includes('phone') || type === 'tel') return 'Mobile telephone number';
    if (n.includes('name') || n.includes('nm')) return 'Full name';
    if (n.includes('addr')) return 'Street address';
    if (n.includes('pin') || n.includes('zip')) return 'Postal PIN code';
    if (n.includes('dob') || n.includes('birth')) return 'Date of birth';
    if (n.includes('msg') || n.includes('message')) return 'Message inquiry content';
    if (n.includes('rating')) return 'Rating score';
    return name;
  };

  const englishItems = neededFields.length > 0
    ? neededFields.map((f) => fieldLabel(f.name, f.type))
    : ['Email address (contact identifier)'];

  if (lang === 'hi') {
    const hindiFieldLabel = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('mail')) return 'ईमेल पता (Email address)';
      if (n.includes('mob') || n.includes('phone')) return 'मोबाइल फोन नंबर (Mobile number)';
      if (n.includes('name') || n.includes('nm')) return 'पूरा नाम (Full name)';
      if (n.includes('addr')) return 'पत्राचार का पता (Address)';
      if (n.includes('pin') || n.includes('zip')) return 'पिन कोड (PIN code)';
      if (n.includes('dob') || n.includes('birth')) return 'जन्म तिथि (Date of birth)';
      if (n.includes('msg') || n.includes('message')) return 'संदेश / पूछताछ (Message inquiry)';
      if (n.includes('rating')) return 'प्रतिक्रिया रेटिंग (Rating)';
      return name;
    };

    const hiItems = neededFields.length > 0
      ? neededFields.map((f) => hindiFieldLabel(f.name))
      : ['ईमेल पता'];

    return {
      headline: 'डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) सहमति सूचना का प्रारूप',
      collectTitle: '१. हम क्या एकत्र करते हैं',
      collectItems: hiItems,
      purposeTitle: '२. हम इसे क्यों एकत्र करते हैं',
      purposeText: `हम आपकी यह व्यक्तिगत जानकारी केवल "${result.purpose}" के उद्देश्य को पूरा करने के लिए एकत्र करते हैं। इसका उपयोग किसी अन्य असंबंधित कार्य के लिए नहीं किया जाएगा।`,
      withdrawTitle: '३. अपनी सहमति कैसे वापस लें',
      withdrawText: 'आप किसी भी समय बिना किसी पूर्व शर्त के अपनी सहमति वापस ले सकते हैं। सहमति वापस लेने से पूर्व में की गई वैध प्रक्रिया पर कोई प्रतिकूल प्रभाव नहीं पड़ेगा। सहमति वापस लेने के लिए कृपया हमें [your contact email] पर ईमेल करें या संदेशों में दिए गए सदस्यता समाप्ति (Unsubscribe) लिंक का उपयोग करें।',
      retentionTitle: '४. डेटा प्रतिधारण अवधि',
      retentionText: 'हम आपकी व्यक्तिगत जानकारी को केवल [retention period] तक अथवा इस उद्देश्य के पूरा होने तक ही सुरक्षित रखते हैं, जिसके पश्चात इसे सुरक्षित रूप से हटा दिया जाता है।',
      grievanceTitle: '५. शिकायत निवारण अधिकारी',
      grievanceText: 'यदि आपको अपने डेटा प्रसंस्करण से संबंधित कोई शिकायत या प्रश्न है, तो आप हमारे शिकायत निवारण अधिकारी से [grievance officer email] पर संपर्क कर सकते हैं।',
      childrenNotice: hasChildren
        ? 'सूचना: चूंकि इस फॉर्म में 18 वर्ष से कम आयु के बच्चों का डेटा शामिल हो सकता है, डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम के अनुसार माता-पिता या कानूनी अभिभावक की स्पष्ट सत्यापन योग्य सहमति अनिवार्य रूप से ली जाती है।'
        : undefined,
      excludedNote: 'अतिरिक्त और अनावश्यक फ़ील्ड्स को इस सहमति सूचना से बाहर रखा गया है। उन्हें अपने फॉर्म से हटा दें या उपयोग से पहले वैध कारण दर्ज करें।',
      draftDisclaimer: 'प्रारूप सूचना केवल मार्गदर्शन हेतु है। यह कानूनी सलाह नहीं है। कृपया प्रकाशन से पूर्व किसी योग्य कानूनी विशेषज्ञ से समीक्षा करवाएं।'
    };
  }

  if (lang === 'mr') {
    const marathiFieldLabel = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('mail')) return 'ईमेल पत्ता (Email address)';
      if (n.includes('mob') || n.includes('phone')) return 'मोबाईल नंबर (Mobile number)';
      if (n.includes('name') || n.includes('nm')) return 'पूर्ण नाव (Full name)';
      if (n.includes('addr')) return 'पत्ता (Address)';
      if (n.includes('pin') || n.includes('zip')) return 'पिन कोड (PIN code)';
      if (n.includes('dob') || n.includes('birth')) return 'जन्मतारीख (Date of birth)';
      if (n.includes('msg') || n.includes('message')) return 'संदेश / चौकशी मजकूर (Message inquiry)';
      if (n.includes('rating')) return 'अभिप्राय रेटिंग (Rating)';
      return name;
    };

    const mrItems = neededFields.length > 0
      ? neededFields.map((f) => marathiFieldLabel(f.name))
      : ['ईमेल पत्ता'];

    return {
      headline: 'डिजिटल वैयक्तिक डेटा संरक्षण (DPDP) संमती सूचनेचा मसुदा',
      collectTitle: '१. आम्ही काय गोळा करतो',
      collectItems: mrItems,
      purposeTitle: '२. आम्ही ही माहिती का गोळा करतो',
      purposeText: `आम्ही ही वैयक्तिक माहिती केवळ "${result.purpose}" या उद्देशाची पूर्तता करण्यासाठी गोळा करतो. याचा वापर इतर कोणत्याही असंबंधित कारणासाठी केला जाणार नाही.`,
      withdrawTitle: '३. संमती कशी मागे घ्यावी',
      withdrawText: 'तुम्ही तुमची संमती कोणत्याही वेळी मागे घेऊ शकता. संमती मागे घेतल्याने पूर्वी केलेल्या कायदेशीर प्रक्रियेवर कोणताही परिणाम होणार नाही. संमती मागे घेण्यासाठी कृपया आम्हाला [your contact email] वर ईमेल करा किंवा आमच्या संदेशांमधील अनसब्सक्राइब लिंकचा वापर करा.',
      retentionTitle: '४. डेटा साठवणूक कालावधी',
      retentionText: 'आम्ही तुमची माहिती केवळ [retention period] कालावधीसाठी किंवा नमूद हेतू पूर्ण होईपर्यंतच साठवून ठेवतो, त्यानंतर ती नष्ट केली जाते.',
      grievanceTitle: '५. तक्रार निवारण अधिकारी',
      grievanceText: 'आपल्या वैयक्तिक डेटा प्रक्रियेबाबत काही तक्रार असल्यास आपण आमच्या तक्रार निवारण अधिकाऱ्याशी [grievance officer email] वर संपर्क साधू शकता.',
      childrenNotice: hasChildren
        ? 'टीप: या अर्जात १८ वर्षांखालील बालकांच्या माहितीचा समावेश असू शकत असल्याने, डीपीडीपी कायद्यानुसार पालक अथवा कायदेशीर पालकांची पडताळणीयोग्य संमती आवश्यक आहे.'
        : undefined,
      excludedNote: 'अतिरिक्त आणि अनावश्यक फील्ड्स या संमती पत्रकातून वगळण्यात आल्या आहेत. त्या आपल्या अर्जातून काढून टाका किंवा योग्य औचित्य जोडा.',
      draftDisclaimer: 'हा मसुदा केवळ मार्गदर्शनासाठी आहे. हा कायदेशीर सल्ला नाही. कृपया अधिकृत प्रकाशनापूर्वी कायदेतज्ज्ञांकडून तपासून घ्यावे.'
    };
  }

  // Default: English
  return {
    headline: 'Draft DPDP Consent Notice',
    collectTitle: '1. What we collect',
    collectItems: englishItems,
    purposeTitle: '2. Why we collect it',
    purposeText: `We collect this personal data solely to fulfill "${result.purpose}". We do not process or share it for any secondary or incompatible purposes without your explicit consent.`,
    withdrawTitle: '3. How to withdraw consent',
    withdrawText: 'You can withdraw your consent at any time without penalty or affecting lawful processing conducted prior to withdrawal. To withdraw, email us at [your contact email] or use the unsubscribe option provided in our communications.',
    retentionTitle: '4. Data retention period',
    retentionText: 'We retain your personal data only for [retention period] or until the stated purpose is accomplished, after which it is securely erased in accordance with DPDP rules.',
    grievanceTitle: '5. Grievance Redressal',
    grievanceText: 'If you have questions or grievances regarding your personal data, you may contact our designated Grievance Officer at [grievance officer email].',
    childrenNotice: hasChildren
      ? "Notice: Since this form may process data of children under 18 years of age, verifiable consent of a parent or legal guardian is strictly required under Section 9 of the DPDP Act."
      : undefined,
    excludedNote: 'Excess fields are left out. Remove them from your form, or add a clear lawful justification before listing them.',
    draftDisclaimer: 'Draft notice for guidance only. This is not legal advice. Review with a qualified professional before publishing.'
  };
}

export function generatePlainTextReport(result: AuditResult, lang: NoticeLanguage): string {
  const notice = generateConsentNotice(result, lang);
  const now = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    '======================================================================',
    '                   DPDP FORM COMPLIANCE AUDIT REPORT                  ',
    '           In-Browser Rule Engine · Privacy First · Local Only         ',
    '======================================================================',
    `Date: ${now}`,
    `Purpose Stated: ${result.purpose}`,
    `Compliance Score: ${result.score}/100 (${result.scoreBand})`,
    `Verdict: ${result.scoreStatusSentence}`,
    '',
    '----------------------------------------------------------------------',
    'SUMMARY COUNTS',
    '----------------------------------------------------------------------',
    `Total Fields: ${result.totalFields}`,
    `Personal Data Fields: ${result.personalDataCount}`,
    `Non-personal Fields: ${result.nonPersonalCount}`,
    `Necessary Fields: ${result.necessaryCount}`,
    `Excess Fields: ${result.unnecessaryCount}`,
    `Review / Borderline: ${result.reviewCount}`,
    '',
    '----------------------------------------------------------------------',
    'ITEMIZED FIELD ANALYSIS',
    '----------------------------------------------------------------------'
  ];

  for (const f of result.fields) {
    const sensitiveTag = f.sensitive ? ' [SENSITIVE]' : '';
    const personalTag = f.isPersonalData ? 'Personal' : 'Non-Personal';
    lines.push(`• Field: ${f.name} (type: ${f.type})`);
    lines.push(`  Category: ${f.categoryLabel}${sensitiveTag} | Classification: ${personalTag}`);
    lines.push(`  Verdict: [${f.verdict.toUpperCase()}]`);
    lines.push(`  Reason: ${f.reason}`);
    lines.push(`  Matched By: ${f.matchedBy.join(', ')}`);
    lines.push('');
  }

  lines.push('----------------------------------------------------------------------');
  lines.push('SCORE EXPLANATION & DEDUCTIONS');
  lines.push('----------------------------------------------------------------------');
  for (const d of result.scoreDeductions) {
    const sign = d.delta > 0 ? `+${d.delta}` : `${d.delta}`;
    lines.push(`  ${sign.padEnd(5)} ${d.reason}`);
  }
  lines.push('');

  lines.push('----------------------------------------------------------------------');
  lines.push('RECOMMENDED IMPROVEMENTS');
  lines.push('----------------------------------------------------------------------');
  result.topImprovements.forEach((imp, i) => {
    lines.push(`  ${i + 1}. ${imp}`);
  });
  lines.push('');

  lines.push('======================================================================');
  lines.push(`DRAFT CONSENT NOTICE (${lang.toUpperCase()})`);
  lines.push('======================================================================');
  lines.push(`[${notice.draftDisclaimer}]`);
  lines.push('');
  lines.push(notice.collectTitle);
  notice.collectItems.forEach((item) => lines.push(`  - ${item}`));
  lines.push('');
  lines.push(notice.purposeTitle);
  lines.push(`  ${notice.purposeText}`);
  lines.push('');
  lines.push(notice.withdrawTitle);
  lines.push(`  ${notice.withdrawText}`);
  lines.push('');
  lines.push(notice.retentionTitle);
  lines.push(`  ${notice.retentionText}`);
  lines.push('');
  lines.push(notice.grievanceTitle);
  lines.push(`  ${notice.grievanceText}`);
  if (notice.childrenNotice) {
    lines.push('');
    lines.push(`  ${notice.childrenNotice}`);
  }
  lines.push('');
  lines.push('======================================================================');
  lines.push('LEGAL DISCLAIMER:');
  lines.push('Draft output for guidance only. This is not legal advice. Generated locally');
  lines.push('via rule-based heuristics under the Digital Personal Data Protection Act, 2023.');
  lines.push('======================================================================');

  return lines.join('\n');
}
