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
  draftDisclaimer: string;
  excludedNote: string;
  childrenNotice?: string;
  paragraph1: {
    prefix: string;
    collectedData: string;
    mid: string;
    purposePhrase: string;
    suffix: string;
    excessData?: string;
  };
  paragraph2: string;
  footerNote: string;
  disclaimer: string;
}

// Purpose phrase mapping for natural grammar
function getPurposePhrase(purpose: string, lang: NoticeLanguage): string {
  const p = purpose.toLowerCase();
  if (p.includes('newsletter') || p.includes('subscribe')) {
    if (lang === 'hi') return 'आपको हमारे उत्पादों, आयोजनों और ऑफ़र के अपडेट के साथ न्यूज़लेटर भेजने';
    if (lang === 'mr') return 'आमची उत्पादने, कार्यक्रम आणि ऑफर्सच्या अपडेटसह न्यूजलेटर पाठवण्या';
    return 'send you our newsletter with updates about our products, events and offers';
  }
  if (p.includes('contact') || p.includes('inquiry') || p.includes('support')) {
    if (lang === 'hi') return 'आपकी पूछताछ और संपर्क अनुरोध का जवाब देने';
    if (lang === 'mr') return 'आपल्या चौकशी आणि संपर्क विनंतीस उत्तर देण्या';
    return 'respond to your inquiries and support requests';
  }
  if (p.includes('job') || p.includes('career') || p.includes('application')) {
    if (lang === 'hi') return 'रोजगार के अवसरों के लिए आपकी उम्मीदवारी का मूल्यांकन करने';
    if (lang === 'mr') return 'रोजगाराच्या संधींसाठी आपल्या उमेदवारीचे मूल्यांकन करण्या';
    return 'evaluate your candidacy for employment opportunities';
  }
  if (p.includes('checkout') || p.includes('order') || p.includes('purchase')) {
    if (lang === 'hi') return 'आपके ऑर्डर को संसाधित करने और उत्पादों की डिलीवरी करने';
    if (lang === 'mr') return 'आपल्या ऑर्डरवर प्रक्रिया करण्यासाठी आणि उत्पादने वितरित करण्या';
    return 'process your order and deliver products to your address';
  }

  // Fallback
  if (lang === 'hi') return `"${purpose}" के उद्देश्य को पूरा करने`;
  if (lang === 'mr') return `"${purpose}" या उद्देशाची पूर्तता करण्या`;
  return `fulfill the stated purpose of ${purpose}`;
}

export function generateConsentNotice(result: AuditResult, lang: NoticeLanguage): NoticeContent {
  const neededFields = result.fields.filter((f) => (f.verdict === 'needed' || f.needed) && f.isPersonalData);
  const excessFields = result.fields.filter((f) => (f.verdict === 'excess' || !f.needed) && f.isPersonalData);

  const collectedList = neededFields.map((f) => f.label || f.name);
  const excessList = excessFields.map((f) => f.label || f.name);

  const collectedText = collectedList.length > 0 ? collectedList.join(', ') : 'no personal data';
  const excessText = excessList.length > 0 ? excessList.join(', ') : '';

  const purposePhrase = getPurposePhrase(result.purpose, lang);

  if (lang === 'hi') {
    return {
      headline: 'सहमति सूचना का मसौदा (धारा 6, DPDP अधिनियम 2023)',
      collectTitle: '1. व्यक्तिगत डेटा जो हम एकत्र करते हैं',
      collectItems: collectedList.length > 0 ? collectedList : ['कोई आवश्यक व्यक्तिगत डेटा नहीं'],
      purposeTitle: '2. डेटा एकत्र करने का उद्देश्य',
      purposeText: `यह डेटा केवल ${purposePhrase} के लिए एकत्र किया जाता है।`,
      withdrawTitle: '3. सहमति कैसे वापस लें (अधिकार)',
      withdrawText: 'आप किसी भी समय [support@example.com] पर ईमेल भेजकर अपनी सहमति वापस ले सकते हैं। सहमति वापस लेने के बाद हम आपका डेटा हटा देंगे।',
      retentionTitle: '4. डेटा भंडारण अवधि',
      retentionText: 'डेटा केवल तब तक संग्रहीत किया जाएगा जब तक निर्दिष्ट उद्देश्य पूरा करने के लिए आवश्यक हो (लगभग [12 महीने])।',
      grievanceTitle: '5. शिकायत निवारण अधिकारी',
      grievanceText: 'शिकायतों या प्रश्नों के लिए हमारे शिकायत अधिकारी [grievance@example.com] से संपर्क करें।',
      draftDisclaimer: 'मसौदा सूचना केवल तैयारी में सहायता हेतु है। यह कानूनी सलाह नहीं है।',
      excludedNote: excessList.length > 0 ? `अनावश्यक फ़ील्ड्स (${excessText}) को हटाकर सहमति सूचना को संक्षिप्त रखा गया है।` : 'सभी आवश्यक फ़ील्ड्स शामिल हैं।',
      paragraph1: {
        prefix: 'हम आपका ',
        collectedData: collectedText,
        mid: ' ',
        purposePhrase: purposePhrase,
        suffix: excessText ? `। इस उद्देश्य के लिए हम आपका ${excessText} एकत्र नहीं करते।` : '।'
      },
      paragraph2:
        'आप किसी भी समय हमारे ईमेल में “अनसब्सक्राइब” लिंक पर क्लिक करके या [support@example.com] पर संपर्क करके अपनी सहमति वापस ले सकते हैं।',
      footerNote:
        'यह मार्गदर्शन के लिए एक मसौदा सूचना है, कानूनी सलाह नहीं। कृपया इसे अपने संगठन के अनुसार जाँचें और बदलें।',
      childrenNotice: result.hasChildrenData
        ? 'सूचना: चूंकि इस फॉर्म में 18 वर्ष से कम आयु के बच्चों का डेटा शामिल हो सकता है, धारा 9 के तहत माता-पिता की सत्यापन योग्य सहमति अनिवार्य है।'
        : undefined,
      disclaimer: 'मसौदा सूचना केवल मार्गदर्शन हेतु है। यह औपचारिक कानूनी सलाह नहीं है।'
    };
  }

  if (lang === 'mr') {
    return {
      headline: 'संमती सूचनेचा मसुदा (कलम 6, DPDP कायदा 2023)',
      collectTitle: '1. आम्ही गोळा करत असलेली वैयक्तिक माहिती',
      collectItems: collectedList.length > 0 ? collectedList : ['कोणतीही वैयक्तिक माहिती आवश्यक नाही'],
      purposeTitle: '2. माहिती गोळा करण्याचा उद्देश',
      purposeText: `हा डेटा केवळ ${purposePhrase} या उद्देशासाठी गोळा केला जातो.`,
      withdrawTitle: '3. संमती कशी मागे घ्यावी (हक्क)',
      withdrawText: 'तुम्ही कोणत्याही वेळी [support@example.com] येथे संपर्क साधून तुमची संमती मागे घेऊ शकता.',
      retentionTitle: '4. माहिती साठवण कालावधी',
      retentionText: 'उद्देश पूर्ण होईपर्यंतच ही माहिती साठवली जाईल (अंदाजे [12 महिने]).',
      grievanceTitle: '5. तक्रार निवारण अधिकारी',
      grievanceText: 'कोणत्याही तक्रारीसाठी आमच्या तक्रार निवारण अधिकाऱ्याशी [grievance@example.com] येथे संपर्क साधावा.',
      draftDisclaimer: 'हा मसुदा केवळ मदतीसाठी आहे. हा कायदेशीर सल्ला नाही.',
      excludedNote: excessList.length > 0 ? `अनावश्यक बाबी (${excessText}) वगळून ही सूचना संक्षिप्त ठेवली आहे.` : 'सर्व आवश्यक बाबी समाविष्ट आहेत.',
      paragraph1: {
        prefix: 'आम्ही तुमचे ',
        collectedData: collectedText,
        mid: ' ',
        purposePhrase: purposePhrase,
        suffix: excessText ? `। या उद्देशासाठी आम्ही तुमचे ${excessText} गोळा करत नाही.` : '.'
      },
      paragraph2:
        'तुम्ही कोणत्याही वेळी आमच्या ईमेलमधील “अनसब्सक्राइब” लिंकवर क्लिक करून किंवा [support@example.com] येथे संपर्क साधून तुमची संमती मागे घेऊ शकता.',
      footerNote:
        'ही मार्गदर्शनासाठी मसुदा सूचना आहे, कायदेशीर सल्ला नाही. कृपया ती तुमच्या संस्थेनुसार तपासा आणि बदला.',
      childrenNotice: result.hasChildrenData
        ? 'टीप: या अर्जात १८ वर्षांखालील बालकांच्या माहितीचा समावेश असू शकत असल्याने, पालकांची पडताळणीयोग्य संमती आवश्यक आहे.'
        : undefined,
      disclaimer: 'हा मसुदा केवळ मार्गदर्शनासाठी आहे. हा कायदेशीर सल्ला नाही.'
    };
  }

  // English
  return {
    headline: 'Draft Consent Notice (Section 6, DPDP Act 2023)',
    collectTitle: '1. Personal data we collect',
    collectItems: collectedList.length > 0 ? collectedList : ['No personal data required'],
    purposeTitle: '2. Purpose of processing',
    purposeText: `We collect this data solely to ${purposePhrase}.`,
    withdrawTitle: '3. How to withdraw consent (Your Rights)',
    withdrawText: 'You may withdraw consent at any time with equal ease by contacting us at [support@example.com] or via the unsubscribe link. Upon withdrawal, processing ceases within a reasonable period.',
    retentionTitle: '4. Data Retention Period',
    retentionText: 'Data is retained only as long as necessary to fulfill the stated purpose ([e.g., 12 months]), after which it is deleted or anonymized.',
    grievanceTitle: '5. Grievance Redressal',
    grievanceText: 'For complaints or rights requests, contact our Grievance Officer at [grievance@example.com]. Under Section 6(2)(c), you also retain the right to approach the Data Protection Board of India.',
    draftDisclaimer: 'DRAFT NOTICE FOR GUIDANCE ONLY — NOT LEGAL ADVICE. Have a qualified professional review before publishing.',
    excludedNote: excessList.length > 0 ? `Excess fields (${excessText}) are excluded to preserve consent specificity.` : 'All required fields are documented.',
    paragraph1: {
      prefix: 'We collect your ',
      collectedData: collectedText,
      mid: ' to ',
      purposePhrase: purposePhrase,
      suffix: excessText ? `. We do not collect your ${excessText} for this purpose.` : '.'
    },
    paragraph2:
      'You can withdraw your consent at any time by clicking the “Unsubscribe” link in our emails or by contacting us at [support@example.com]. After withdrawal, we will stop using your data for this purpose and delete it within a reasonable time.',
    footerNote:
      'This is a draft notice for guidance and not legal advice. Please review and customize it for your organization.',
    childrenNotice: result.hasChildrenData
      ? 'Notice: Since this form may process data of children under 18 years of age, verifiable consent of a parent or legal guardian is strictly obtained in accordance with Section 9 of the DPDP Act.'
      : undefined,
    disclaimer: 'Draft notice for guidance only. Not legal advice. Review before publishing.'
  };
}

export function generatePlainTextReport(result: AuditResult, lang: NoticeLanguage): string {
  const notice = generateConsentNotice(result, lang);
  const now = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    '======================================================================',
    '                   DPDP FORM AUDITOR: COMPLIANCE REPORT                ',
    '           In-Browser Rule Engine · Privacy First · Local Only         ',
    '======================================================================',
    `Audit Date: ${now}`,
    `Purpose Stated: ${result.purpose}`,
    `Compliance Score: ${result.score} / 100 (${result.scoreBand})`,
    `Verdict: ${result.scoreStatusSentence}`,
    '',
    '----------------------------------------------------------------------',
    'SUMMARY COUNTS',
    '----------------------------------------------------------------------',
    `Total Fields: ${result.totalFields}`,
    `Personal Data Fields: ${result.personalDataCount} (${result.personalPercent}%)`,
    `Non-personal Fields: ${result.nonPersonalCount} (${result.nonPersonalPercent}%)`,
    `Necessary Fields: ${result.necessaryCount}`,
    `Unnecessary Fields: ${result.unnecessaryCount}`,
    '',
    '----------------------------------------------------------------------',
    'FIELDS AUDIT TABLE',
    '----------------------------------------------------------------------'
  ];

  for (const f of result.fields) {
    const sens = f.sensitive ? ' (Sensitive / Higher Risk)' : '';
    const verdict = f.verdict || (f.needed ? 'needed' : 'excess');
    lines.push(`• Field: ${f.name} [Label: ${f.label}]`);
    lines.push(`  Category: ${f.categoryLabel}${sens}`);
    lines.push(`  Verdict: ${verdict.toUpperCase()} | Reason: ${f.reason}`);
    lines.push(`  Matched by: ${f.matchedBy.join(', ')}`);
    lines.push('');
  }

  lines.push('----------------------------------------------------------------------');
  lines.push('SCORE CALCULATION');
  lines.push('----------------------------------------------------------------------');
  lines.push('Starting score: 100');
  if (result.scoreItems) {
    for (const item of result.scoreItems) {
      const sign = item.delta > 0 ? `+${item.delta}` : `${item.delta}`;
      lines.push(`  ${sign.padEnd(5)} ${item.description}`);
    }
  } else if (result.scoreDeductions) {
    for (const d of result.scoreDeductions) {
      lines.push(`  -${d.delta} ${d.reason}`);
    }
  }
  lines.push(`Total score: ${result.score} / 100`);
  lines.push('');

  lines.push('======================================================================');
  lines.push(`DRAFT CONSENT NOTICE (${lang.toUpperCase()})`);
  lines.push('======================================================================');
  lines.push(notice.headline);
  lines.push('');
  lines.push(`${notice.collectTitle}:`);
  for (const item of notice.collectItems) {
    lines.push(`  • ${item}`);
  }
  lines.push('');
  lines.push(`${notice.purposeTitle}:`);
  lines.push(`  ${notice.purposeText}`);
  lines.push('');
  lines.push(`${notice.withdrawTitle}:`);
  lines.push(`  ${notice.withdrawText}`);
  lines.push('');
  lines.push(`${notice.retentionTitle}:`);
  lines.push(`  ${notice.retentionText}`);
  lines.push('');
  lines.push(`${notice.grievanceTitle}:`);
  lines.push(`  ${notice.grievanceText}`);
  lines.push('');
  if (notice.childrenNotice) {
    lines.push(`CHILDREN DATA NOTICE:`);
    lines.push(`  ${notice.childrenNotice}`);
    lines.push('');
  }
  lines.push(`DISCLAIMER:`);
  lines.push(`  ${notice.draftDisclaimer}`);
  lines.push('======================================================================');

  return lines.join('\n');
}
