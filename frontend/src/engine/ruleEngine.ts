import type { AuditedField, AuditResult, FieldCategory, ScoreItem } from '../types/dpdp';

interface RawFieldInput {
  name: string;
  label?: string;
  type?: string;
  autocomplete?: string;
  placeholder?: string;
}

interface MatchClassification {
  category: FieldCategory;
  categoryLabel: string;
  isPersonalData: boolean;
  sensitive: boolean;
  matchedBy: string[];
  normalizedConcept: string;
}

// Tokenize and clean names
function tokenize(str: string): string[] {
  if (!str) return [];
  const cleaned = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-.\s]+/g, ' ')
    .toLowerCase();

  const rawTokens = cleaned.split(' ').map((t) => t.trim()).filter(Boolean);
  const filteredTokens: string[] = [];

  for (const token of rawTokens) {
    let t = token.replace(/^(usr|user|txt|inp|input|fld|form|sel|opt|val)\b/g, '');
    t = t.replace(/\d+$/, '');
    if (t.length > 0) {
      filteredTokens.push(t);
    }
  }

  return filteredTokens.length > 0 ? filteredTokens : rawTokens;
}

// Classify field into the 7 statutory categories
function classifyField(raw: RawFieldInput): MatchClassification {
  const name = (raw.name || '').toLowerCase();
  const label = (raw.label || '').toLowerCase();
  const type = (raw.type || 'text').toLowerCase();
  const autocomplete = (raw.autocomplete || '').toLowerCase();
  const placeholder = (raw.placeholder || '').toLowerCase();

  const nameTokens = tokenize(raw.name || '');
  const labelTokens = tokenize(raw.label || '');
  const allTokens = new Set([...nameTokens, ...labelTokens]);

  const matchedBy: string[] = [];

  // 1. Non-personal data (Technical / CSRF / tokens / buttons / honeypots)
  const technicalKeywords = [
    'csrf', 'token', '_token', 'authenticity', 'session', 'recaptcha',
    'turnstile', 'hcaptcha', 'nonce', 'timestamp', 'honeypot', 'bot'
  ];
  if (technicalKeywords.some((k) => name.includes(k) || (type === 'hidden' && name.includes('token')))) {
    const match = technicalKeywords.find((k) => name.includes(k)) || 'token';
    matchedBy.push(`name pattern: ${match}`);
    return {
      category: 'non_personal',
      categoryLabel: 'Non-personal',
      isPersonalData: false,
      sensitive: false,
      matchedBy,
      normalizedConcept: 'csrf_token'
    };
  }

  // Checkbox consent agreement (non-personal or legal consent flag)
  if (type === 'checkbox' && (name.includes('consent') || name.includes('agree') || name.includes('terms') || label.includes('agree'))) {
    matchedBy.push('input type: checkbox, label: consent');
    return {
      category: 'identity',
      categoryLabel: 'Identity',
      isPersonalData: true,
      sensitive: false,
      matchedBy,
      normalizedConcept: 'consent'
    };
  }

  // 2. Autocomplete hints
  if (autocomplete) {
    if (autocomplete.includes('email')) {
      matchedBy.push(`autocomplete: ${autocomplete}`);
      return {
        category: 'contact',
        categoryLabel: 'Contact',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: 'email'
      };
    }
    if (autocomplete.includes('tel') || autocomplete.includes('phone')) {
      matchedBy.push(`autocomplete: ${autocomplete}`);
      return {
        category: 'contact',
        categoryLabel: 'Contact',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: 'phone'
      };
    }
    if (autocomplete.includes('address') || autocomplete.includes('postal') || autocomplete.includes('zip')) {
      matchedBy.push(`autocomplete: ${autocomplete}`);
      return {
        category: 'location',
        categoryLabel: 'Location',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: 'address'
      };
    }
  }

  // 3. Type hints
  if (type === 'email') {
    matchedBy.push('input type: email');
    if (name) matchedBy.push(`name pattern: ${name}`);
    return {
      category: 'contact',
      categoryLabel: 'Contact',
      isPersonalData: true,
      sensitive: false,
      matchedBy,
      normalizedConcept: 'email'
    };
  }
  if (type === 'tel') {
    matchedBy.push('input type: tel');
    if (name) matchedBy.push(`name pattern: ${name}`);
    return {
      category: 'contact',
      categoryLabel: 'Contact',
      isPersonalData: true,
      sensitive: false,
      matchedBy,
      normalizedConcept: 'phone'
    };
  }

  // 4. Financial (Sensitive)
  const finKeywords = ['card', 'cvv', 'expiry', 'bank', 'account', 'acc_no', 'upi', 'salary', 'income', 'ctc', 'billing'];
  for (const kw of finKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      return {
        category: 'financial',
        categoryLabel: 'Financial',
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: kw.includes('income') || kw.includes('salary') ? 'income' : 'financial'
      };
    }
  }

  // 5. Health (Sensitive)
  const healthKeywords = ['health', 'medical', 'disability', 'blood', 'allergy', 'dietary', 'condition', 'disease', 'vaccine', 'prescription'];
  for (const kw of healthKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      return {
        category: 'health',
        categoryLabel: 'Health',
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: 'health'
      };
    }
  }

  // 6. Children's Data (Sensitive)
  const childKeywords = ['child', 'minor', 'student', 'kid', 'guardian', 'parent', 'school', 'grade', 'class', 'under18'];
  for (const kw of childKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      return {
        category: 'children',
        categoryLabel: "Children's data",
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: 'children_data'
      };
    }
  }

  // 7. Identity (Government IDs - Sensitive)
  const govKeywords = ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'licence', 'license', 'ssn', 'uidai', 'vid'];
  for (const kw of govKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      return {
        category: 'identity',
        categoryLabel: 'Identity',
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: kw.includes('pan') ? 'pan' : kw.includes('aadhaar') || kw.includes('aadhar') ? 'aadhaar' : 'gov_id'
      };
    }
  }

  // 8. Location
  const locKeywords = ['address', 'addr', 'city', 'state', 'zip', 'pincode', 'pin', 'postal', 'street', 'country'];
  for (const kw of locKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      return {
        category: 'location',
        categoryLabel: 'Location',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: kw.includes('pin') || kw.includes('postal') || kw.includes('zip') ? 'pincode' : 'address'
      };
    }
  }

  // 9. Contact (Email, Mobile, Phone, Tel)
  const contactKeywords = ['email', 'mail', 'phone', 'mob', 'mobile', 'tel', 'cell', 'whatsapp'];
  for (const kw of contactKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      return {
        category: 'contact',
        categoryLabel: 'Contact',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: kw.includes('mail') ? 'email' : 'phone'
      };
    }
  }

  // 10. Identity (Name, DOB, Gender, Demographic)
  const identityKeywords = ['name', 'nm', 'first', 'last', 'fname', 'lname', 'full', 'dob', 'birth', 'bday', 'age', 'gender', 'sex'];
  for (const kw of identityKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`name pattern: ${kw}`);
      let concept = 'name';
      if (kw.includes('dob') || kw.includes('birth') || kw.includes('age')) concept = 'dob';
      else if (kw.includes('gender') || kw.includes('sex')) concept = 'gender';
      return {
        category: 'identity',
        categoryLabel: 'Identity',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: concept
      };
    }
  }

  // Fallback placeholder checks
  if (placeholder.includes('email')) {
    matchedBy.push('placeholder: email');
    return { category: 'contact', categoryLabel: 'Contact', isPersonalData: true, sensitive: false, matchedBy, normalizedConcept: 'email' };
  }
  if (placeholder.includes('phone') || placeholder.includes('mobile')) {
    matchedBy.push('placeholder: phone');
    return { category: 'contact', categoryLabel: 'Contact', isPersonalData: true, sensitive: false, matchedBy, normalizedConcept: 'phone' };
  }

  matchedBy.push(`name pattern: ${name || 'field'}`);
  return {
    category: 'identity',
    categoryLabel: 'Identity',
    isPersonalData: true,
    sensitive: false,
    matchedBy,
    normalizedConcept: 'name'
  };
}

// Evaluate necessity according to DPDP principles and stated purpose
function evaluateNecessity(
  classification: MatchClassification,
  purpose: string
): { needed: boolean; reason: string } {
  const p = purpose.toLowerCase();
  const concept = classification.normalizedConcept;

  // Non-personal data
  if (!classification.isPersonalData) {
    return {
      needed: true,
      reason: 'Technical security token with no link to an identifiable individual.'
    };
  }

  // PURPOSE 1: Newsletter Signup
  if (p.includes('newsletter') || p.includes('subscribe') || p.includes('bulletin') || p.includes('mailing')) {
    if (concept === 'email') {
      return {
        needed: true,
        reason: 'Required to send newsletters.'
      };
    }
    if (concept === 'name') {
      return {
        needed: true,
        reason: 'Used to personalize the newsletter.'
      };
    }
    if (concept === 'consent') {
      return {
        needed: true,
        reason: 'Required to record user consent.'
      };
    }
    if (concept === 'phone') {
      return {
        needed: false,
        reason: 'Not required for newsletter distribution.'
      };
    }
    if (concept === 'dob') {
      return {
        needed: false,
        reason: 'Not required for newsletter.'
      };
    }
    if (classification.sensitive) {
      return {
        needed: false,
        reason: 'Highly sensitive, not required for newsletter.'
      };
    }
    return {
      needed: false,
      reason: 'Not required for newsletter.'
    };
  }

  // PURPOSE 2: Contact Us / Support
  if (p.includes('contact') || p.includes('inquiry') || p.includes('support')) {
    if (concept === 'name' || concept === 'email' || concept === 'consent') {
      return {
        needed: true,
        reason: 'Required to respond to customer inquiries.'
      };
    }
    if (concept === 'phone') {
      return {
        needed: true,
        reason: 'Used for callback support when requested.'
      };
    }
    if (classification.sensitive) {
      return {
        needed: false,
        reason: 'Highly sensitive, not required for general inquiries.'
      };
    }
    return {
      needed: false,
      reason: 'Not required for inquiry response.'
    };
  }

  // PURPOSE 3: Job Application
  if (p.includes('job') || p.includes('career') || p.includes('employment') || p.includes('hiring')) {
    if (concept === 'name' || concept === 'email' || concept === 'phone' || concept === 'address' || concept === 'consent') {
      return {
        needed: true,
        reason: 'Required to evaluate candidate and schedule interviews.'
      };
    }
    if (classification.category === 'identity' && classification.sensitive) {
      return {
        needed: false,
        reason: 'Government ID is excess prior to employment offer.'
      };
    }
    if (concept === 'dob' || concept === 'gender') {
      return {
        needed: false,
        reason: 'Demographic attributes should not be collected at initial screening.'
      };
    }
    return {
      needed: false,
      reason: 'Not required at initial job application stage.'
    };
  }

  // PURPOSE 4: Online Checkout
  if (p.includes('checkout') || p.includes('order') || p.includes('purchase') || p.includes('e-commerce') || p.includes('ecommerce')) {
    if (concept === 'name' || concept === 'email' || concept === 'phone' || concept === 'address' || concept === 'pincode' || concept === 'financial' || concept === 'consent') {
      return {
        needed: true,
        reason: 'Required for parcel delivery and order billing.'
      };
    }
    if (concept === 'gender' || concept === 'income') {
      return {
        needed: false,
        reason: 'Demographic and income data are not required for order delivery.'
      };
    }
    if (classification.sensitive) {
      return {
        needed: false,
        reason: 'Government ID is not required for physical goods delivery.'
      };
    }
    return {
      needed: false,
      reason: 'Not required for order fulfillment.'
    };
  }

  // Default: General Minimal Rules
  if (concept === 'email' || concept === 'name' || concept === 'consent') {
    return {
      needed: true,
      reason: 'Essential identifier for service provision.'
    };
  }
  if (classification.sensitive) {
    return {
      needed: false,
      reason: 'Sensitive data requires strict statutory justification.'
    };
  }
  return {
    needed: false,
    reason: 'Not necessary for general processing purposes.'
  };
}

// Parse HTML or field list
export function parseFormInput(rawInput: string, mode: 'html' | 'list'): RawFieldInput[] {
  if (!rawInput.trim()) return [];

  const results: RawFieldInput[] = [];

  if (mode === 'html') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawInput, 'text/html');
      const elements = doc.querySelectorAll('input, select, textarea');

      elements.forEach((el, index) => {
        const type = (el.getAttribute('type') || (el.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text')).toLowerCase();
        if (type === 'submit' || type === 'reset' || type === 'image') return;

        const name = el.getAttribute('name') || el.getAttribute('id') || `field_${index + 1}`;
        const autocomplete = el.getAttribute('autocomplete') || undefined;
        const placeholder = el.getAttribute('placeholder') || undefined;

        let labelText: string | undefined = undefined;
        const id = el.getAttribute('id');
        if (id) {
          const labelEl = doc.querySelector(`label[for="${id}"]`);
          if (labelEl && labelEl.textContent) labelText = labelEl.textContent.trim();
        }
        if (!labelText && el.closest('label')) {
          labelText = el.closest('label')?.textContent?.trim();
        }

        results.push({
          name,
          label: labelText,
          type,
          autocomplete,
          placeholder
        });
      });

      if (results.length === 0) {
        return parseListMode(rawInput);
      }
    } catch {
      return parseListMode(rawInput);
    }
  } else {
    return parseListMode(rawInput);
  }

  return results;
}

function parseListMode(text: string): RawFieldInput[] {
  const lines = text.split(/[\n,;]+/);
  const fields: RawFieldInput[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cleaned = trimmed.replace(/^[-*•\d.)\]\s]+/, '').trim();
    if (!cleaned) continue;

    let name = cleaned;
    let type = 'text';
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      name = parts[0].trim();
      type = parts[1].trim() || 'text';
    }

    fields.push({ name, type });
  }

  return fields;
}

// Map friendly label
function getFriendlyLabel(name: string, type: string, rawLabel?: string): string {
  if (rawLabel && rawLabel !== name && rawLabel.length <= 32) return rawLabel;
  const n = name.toLowerCase();
  if (n.includes('usr_nm') || n.includes('full_name') || n.includes('fname')) return 'Full name';
  if (n.includes('mob') || n.includes('phone') || type === 'tel') return 'Mobile number';
  if (n.includes('mail') || type === 'email') return 'Email address';
  if (n.includes('dob') || n.includes('birth')) return 'Date of birth';
  if (n.includes('aadhar') || n.includes('aadhaar')) return 'Aadhaar number';
  if (n.includes('pan')) return 'PAN Card number';
  if (n.includes('addr')) return 'Street address';
  if (n.includes('pin') || n.includes('zip')) return 'Postal PIN code';
  if (n.includes('gender')) return 'Gender';
  if (n.includes('income')) return 'Annual income';
  if (n.includes('csrf') || n.includes('token')) return 'Security token';
  if (n.includes('agree') || n.includes('consent')) return 'Consent agreement';
  return name;
}

// Master audit function
export function auditForm(rawInput: string, purpose: string, mode: 'html' | 'list'): AuditResult {
  const rawFields = parseFormInput(rawInput, mode);
  const p = purpose.trim() || 'newsletter signup';

  const auditedFields: AuditedField[] = [];
  const categoryCounts: Record<string, number> = {
    identity: 0,
    contact: 0,
    location: 0,
    financial: 0,
    health: 0,
    children: 0,
    non_personal: 0
  };

  const categoryFieldLabels: Record<string, string[]> = {
    identity: [],
    contact: [],
    location: [],
    financial: [],
    health: [],
    children: [],
    non_personal: []
  };

  let hasConsentCheckbox = false;
  let hasChildrenData = false;

  for (let i = 0; i < rawFields.length; i++) {
    const raw = rawFields[i];
    const classification = classifyField(raw);
    const { needed, reason } = evaluateNecessity(classification, p);
    const friendlyLabel = getFriendlyLabel(raw.name, raw.type || 'text', raw.label);

    categoryCounts[classification.category]++;
    categoryFieldLabels[classification.category].push(friendlyLabel);

    if (raw.type === 'checkbox' && (raw.name.includes('consent') || raw.name.includes('agree') || (raw.label && raw.label.includes('agree')))) {
      hasConsentCheckbox = true;
    }
    if (classification.category === 'children') {
      hasChildrenData = true;
    }

    auditedFields.push({
      id: `field_${i}_${raw.name}`,
      name: raw.name,
      label: friendlyLabel,
      type: raw.type || 'text',
      autocomplete: raw.autocomplete,
      category: classification.category,
      categoryLabel: classification.categoryLabel,
      isPersonalData: classification.isPersonalData,
      sensitive: classification.sensitive,
      needed,
      reason,
      matchedBy: classification.matchedBy
    });
  }

  // Count tallies - Guaranteed mathematically consistent per ui.md Section 11:
  // personal + nonPersonal = totalFields
  // necessary + unnecessary = totalFields
  const totalFields = auditedFields.length;
  const personalDataCount = auditedFields.filter((f) => f.isPersonalData).length;
  const nonPersonalCount = auditedFields.filter((f) => !f.isPersonalData).length;
  const necessaryCount = auditedFields.filter((f) => f.needed).length;
  const unnecessaryCount = auditedFields.filter((f) => !f.needed).length;

  const personalPercent = totalFields > 0 ? Math.round((personalDataCount / totalFields) * 100) : 0;
  const nonPersonalPercent = totalFields > 0 ? Math.round((nonPersonalCount / totalFields) * 100) : 0;

  // Exact scoring model from ui.md Section 5:
  // Start at 100.
  // −10 for each unnecessary field (non-sensitive).
  // −20 for each unnecessary sensitive field (Aadhaar, PAN, health, etc.).
  // −10 if no consent checkbox is found (or 0 with green tick if consent checkbox found).
  // −15 if children's data is collected and no age/guardian mention.
  // Clamp 0-100.
  let score = 100;
  const scoreItems: ScoreItem[] = [];

  const unnecessaryNonSensitive = auditedFields.filter((f) => !f.needed && !f.sensitive);
  const unnecessarySensitive = auditedFields.filter((f) => !f.needed && f.sensitive);

  unnecessaryNonSensitive.forEach((f) => {
    score -= 10;
    scoreItems.push({
      iconType: 'cross',
      delta: -10,
      description: `Unnecessary field: ${f.label} (${f.name})`
    });
  });

  unnecessarySensitive.forEach((f) => {
    score -= 20;
    scoreItems.push({
      iconType: 'cross',
      delta: -20,
      description: `Unnecessary sensitive field: ${f.label} (${f.name})`
    });
  });

  if (hasConsentCheckbox) {
    scoreItems.push({
      iconType: 'tick',
      delta: 0,
      description: 'Consent checkbox found'
    });
  } else {
    score -= 10;
    scoreItems.push({
      iconType: 'warning',
      delta: -10,
      description: 'No explicit consent checkbox found in form'
    });
  }

  if (hasChildrenData) {
    score -= 15;
    scoreItems.push({
      iconType: 'warning',
      delta: -15,
      description: "Children's data collected without guardian consent mention"
    });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine Band per ui.md
  let scoreBand: 'Good' | 'Fair' | 'Needs improvement' | 'Poor' = 'Good';
  let scoreColor = 'var(--score-good)';

  if (score >= 80) {
    scoreBand = 'Good';
    scoreColor = 'var(--score-good)';
  } else if (score >= 60) {
    scoreBand = 'Fair';
    scoreColor = 'var(--score-fair)';
  } else if (score >= 40) {
    scoreBand = 'Needs improvement';
    scoreColor = 'var(--score-needs)';
  } else {
    scoreBand = 'Poor';
    scoreColor = 'var(--score-poor)';
  }

  // Status sentence matching mockup:
  const sensitiveCount = unnecessarySensitive.length;
  const statusSentence =
    unnecessaryCount > 0
      ? `Collects ${unnecessaryCount} unnecessary personal data fields${
          sensitiveCount > 0 ? ` and includes ${sensitiveCount} sensitive field (${unnecessarySensitive[0]?.label || 'Aadhaar'}).` : '.'
        }`
      : 'Form strictly adheres to data minimisation principles.';

  return {
    purpose: p,
    fields: auditedFields,
    totalFields,
    personalDataCount,
    nonPersonalCount,
    personalPercent,
    nonPersonalPercent,
    necessaryCount,
    unnecessaryCount,
    score,
    scoreBand,
    scoreColor,
    scoreStatusSentence: statusSentence,
    scoreItems,
    hasConsentCheckbox,
    hasChildrenData,
    categoryCounts,
    categoryFieldLabels
  };
}

// Sample messy form code matching Section 11 & 12 of ui.md
export const SAMPLE_MESSY_FORM_HTML = `<form action="/subscribe" method="POST">
  <input name="usr_nm" type="text" placeholder="Full name" />
  <input name="mob_no" type="tel" placeholder="Mobile number" />
  <input name="e_mail" type="email" placeholder="Email" required />
  <input name="dob_dd" type="date" />
  <input name="aadhar_no" type="text" placeholder="Aadhaar" />
  <input name="pan" type="text" placeholder="PAN Card" />
  <input name="addr_line1" type="text" placeholder="Address" />
  <input name="pincode" type="text" placeholder="PIN" />
  <select name="gender_sel"><option>Gender</option></select>
  <select name="income_range"><option>Income</option></select>
  <input type="hidden" name="csrf_token" value="d9a8f4c2" />
  <label><input type="checkbox" name="agree_terms" /> I agree to the privacy policy</label>
  <button type="submit">Subscribe</button>
</form>`;

export const SAMPLE_MESSY_PURPOSE = 'Newsletter signup';
