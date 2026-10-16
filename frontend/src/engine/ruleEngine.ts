import type { AuditedField, AuditResult, FieldCategory, FieldVerdict, ScoreDeduction } from '../types/dpdp';

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

// Tokenize and clean raw names like "mob_no", "usr_dob", "aadhaar_num", "txtEmail"
function tokenize(str: string): string[] {
  if (!str) return [];
  // Split camelCase and separators (_ - . space)
  const cleaned = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-.\s]+/g, ' ')
    .toLowerCase();

  const rawTokens = cleaned.split(' ').map((t) => t.trim()).filter(Boolean);
  const filteredTokens: string[] = [];

  for (const token of rawTokens) {
    // Strip common variable prefixes
    let t = token.replace(/^(usr|user|txt|inp|input|fld|form|sel|opt|val)\b/g, '');
    // Strip numbers at end (e.g., line1, addr2)
    t = t.replace(/\d+$/, '');
    if (t.length > 0) {
      filteredTokens.push(t);
    }
  }

  return filteredTokens.length > 0 ? filteredTokens : rawTokens;
}

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

  // 1. Technical / Not Personal Data
  const technicalKeywords = [
    'csrf', 'token', '_token', 'authenticity', 'session', 'recaptcha',
    'turnstile', 'hcaptcha', 'nonce', 'timestamp', 'honeypot', 'bot'
  ];
  if (technicalKeywords.some(k => name.includes(k) || type === 'hidden' && name.includes('token'))) {
    const match = technicalKeywords.find(k => name.includes(k)) || 'token';
    matchedBy.push(`name:${match}`);
    return {
      category: 'not_personal',
      categoryLabel: 'Non-personal data',
      isPersonalData: false,
      sensitive: false,
      matchedBy,
      normalizedConcept: 'csrf_token'
    };
  }

  // 2. Autocomplete hints (highest fidelity)
  if (autocomplete) {
    if (autocomplete.includes('email')) {
      matchedBy.push(`autocomplete:${autocomplete}`);
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
      matchedBy.push(`autocomplete:${autocomplete}`);
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
      matchedBy.push(`autocomplete:${autocomplete}`);
      return {
        category: 'location',
        categoryLabel: 'Location',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: 'address'
      };
    }
    if (autocomplete.includes('name')) {
      matchedBy.push(`autocomplete:${autocomplete}`);
      return {
        category: 'identity',
        categoryLabel: 'Identity',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: 'name'
      };
    }
    if (autocomplete.includes('bday') || autocomplete.includes('dob')) {
      matchedBy.push(`autocomplete:${autocomplete}`);
      return {
        category: 'identity',
        categoryLabel: 'Identity',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: 'dob'
      };
    }
  }

  // 3. Type hints
  if (type === 'email') {
    matchedBy.push('type:email');
    if (name) matchedBy.push(`name:${name}`);
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
    matchedBy.push('type:tel');
    if (name) matchedBy.push(`name:${name}`);
    return {
      category: 'contact',
      categoryLabel: 'Contact',
      isPersonalData: true,
      sensitive: false,
      matchedBy,
      normalizedConcept: 'phone'
    };
  }
  if (type === 'password') {
    matchedBy.push('type:password');
    return {
      category: 'credentials',
      categoryLabel: 'Credentials',
      isPersonalData: true,
      sensitive: true,
      matchedBy,
      normalizedConcept: 'password'
    };
  }

  // 4. Government ID (Sensitive)
  const govKeywords = ['aadhaar', 'aadhar', 'pan', 'passport', 'voter', 'driving', 'licence', 'license', 'ssn', 'uidai', 'vid'];
  for (const kw of govKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`id-pattern:${kw}`);
      return {
        category: 'gov_id',
        categoryLabel: 'Government ID',
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: kw.includes('pan') ? 'pan' : kw.includes('aadhaar') || kw.includes('aadhar') ? 'aadhaar' : 'gov_id'
      };
    }
  }

  // 5. Financial Data (Sensitive)
  const finKeywords = ['card', 'cvv', 'expiry', 'bank', 'account', 'acc_no', 'upi', 'salary', 'income', 'ctc', 'billing'];
  for (const kw of finKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`financial:${kw}`);
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

  // 6. Health Data (Sensitive)
  const healthKeywords = ['health', 'medical', 'disability', 'blood', 'allergy', 'dietary', 'condition', 'disease', 'vaccine', 'prescription'];
  for (const kw of healthKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`health:${kw}`);
      return {
        category: 'health',
        categoryLabel: 'Health',
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: kw.includes('dietary') ? 'dietary' : 'health'
      };
    }
  }

  // 7. Children's Data (Sensitive)
  const childKeywords = ['child', 'minor', 'student', 'kid', 'guardian', 'parent', 'school', 'grade', 'class', 'under18', 'minor_age'];
  for (const kw of childKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`child-trigger:${kw}`);
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

  // 8. Demographic / Personal traits (Sensitive)
  const demoKeywords = ['gender', 'sex', 'caste', 'religion', 'marital', 'race', 'ethnicity', 'community'];
  for (const kw of demoKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`demographic:${kw}`);
      return {
        category: 'demographic',
        categoryLabel: 'Demographic',
        isPersonalData: true,
        sensitive: true,
        matchedBy,
        normalizedConcept: kw.includes('gender') || kw.includes('sex') ? 'gender' : 'demographic'
      };
    }
  }

  // 9. Location
  const locKeywords = ['address', 'addr', 'city', 'state', 'zip', 'pincode', 'pin', 'postal', 'street', 'country', 'residence', 'landmark'];
  for (const kw of locKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`location:${kw}`);
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

  // 10. Contact (Email, Mobile, Phone, Fax, Whatsapp)
  const contactKeywords = ['email', 'mail', 'phone', 'mob', 'mobile', 'tel', 'whatsapp', 'cell', 'contact'];
  for (const kw of contactKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`contact:${kw}`);
      const concept = kw.includes('mail') ? 'email' : 'phone';
      return {
        category: 'contact',
        categoryLabel: 'Contact',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: concept
      };
    }
  }

  // 11. Identity (Name, Full Name, DOB, Age, Photo)
  const identityKeywords = ['name', 'nm', 'first', 'last', 'fname', 'lname', 'full', 'dob', 'birth', 'bday', 'age', 'photo', 'avatar', 'profile'];
  for (const kw of identityKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`identity:${kw}`);
      const isDob = kw.includes('dob') || kw.includes('birth') || kw.includes('age');
      return {
        category: 'identity',
        categoryLabel: 'Identity',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: isDob ? 'dob' : 'name'
      };
    }
  }

  // 12. Message / Comment / Rating (Often found in forms)
  const messageKeywords = ['message', 'msg', 'comment', 'feedback', 'notes', 'rating', 'stars', 'review'];
  for (const kw of messageKeywords) {
    if (name.includes(kw) || label.includes(kw) || allTokens.has(kw)) {
      matchedBy.push(`content:${kw}`);
      return {
        category: 'identity',
        categoryLabel: 'Identity',
        isPersonalData: true,
        sensitive: false,
        matchedBy,
        normalizedConcept: kw.includes('rating') ? 'rating' : 'message'
      };
    }
  }

  // Fallback: Check placeholder
  if (placeholder) {
    if (placeholder.includes('email')) {
      matchedBy.push('placeholder:email');
      return { category: 'contact', categoryLabel: 'Contact', isPersonalData: true, sensitive: false, matchedBy, normalizedConcept: 'email' };
    }
    if (placeholder.includes('phone') || placeholder.includes('mobile')) {
      matchedBy.push('placeholder:phone');
      return { category: 'contact', categoryLabel: 'Contact', isPersonalData: true, sensitive: false, matchedBy, normalizedConcept: 'phone' };
    }
  }

  // Unclassified default
  matchedBy.push(`unrecognized:${name || 'input'}`);
  return {
    category: 'identity',
    categoryLabel: 'Identity',
    isPersonalData: true,
    sensitive: false,
    matchedBy,
    normalizedConcept: 'generic'
  };
}

// Evaluate necessity according to DPDP principles and stated purpose
function evaluateNecessity(
  classification: MatchClassification,
  raw: RawFieldInput,
  purpose: string
): { verdict: FieldVerdict; reason: string } {
  const p = purpose.toLowerCase();
  const concept = classification.normalizedConcept;

  // Non-personal data
  if (!classification.isPersonalData) {
    return {
      verdict: 'not-personal',
      reason: 'A technical field with no link to an identifiable person (e.g. security token or state).'
    };
  }

  // PURPOSE 1: Newsletter / Subscription
  if (p.includes('newsletter') || p.includes('subscribe') || p.includes('bulletin') || p.includes('mailing')) {
    if (concept === 'email') {
      return {
        verdict: 'needed',
        reason: 'Needed to deliver newsletter updates to the subscriber.'
      };
    }
    if (concept === 'name') {
      return {
        verdict: 'review',
        reason: 'Optional. Helpful for greeting personalisation, but an email address alone is sufficient.'
      };
    }
    if (concept === 'phone') {
      return {
        verdict: 'excess',
        reason: 'A newsletter only requires an email address. Collecting a telephone or mobile number is excess.'
      };
    }
    if (concept === 'dob') {
      return {
        verdict: 'excess',
        reason: 'A newsletter only needs an email address. Collecting date of birth is not necessary for this purpose.'
      };
    }
    if (concept === 'address' || concept === 'pincode') {
      return {
        verdict: 'excess',
        reason: 'Physical delivery address is not needed for electronic newsletter mailings.'
      };
    }
    if (classification.category === 'gov_id') {
      return {
        verdict: 'excess',
        reason: 'Government identification numbers must never be collected for basic newsletter distribution.'
      };
    }
    if (classification.category === 'financial' || concept === 'income') {
      return {
        verdict: 'excess',
        reason: 'Financial details and income ranges are entirely unrelated to subscribing to a newsletter.'
      };
    }
    if (concept === 'gender') {
      return {
        verdict: 'excess',
        reason: 'Gender classification is unnecessary for distributing newsletters.'
      };
    }
    return {
      verdict: 'excess',
      reason: `Collecting ${raw.name || 'this field'} is not necessary for a newsletter subscription.`
    };
  }

  // PURPOSE 2: Contact Us / Inquiry / Support
  if (p.includes('contact') || p.includes('inquiry') || p.includes('enquiry') || p.includes('support')) {
    if (concept === 'name' || concept === 'email' || concept === 'message') {
      return {
        verdict: 'needed',
        reason: `Needed to acknowledge and reply to the enquiry submitted by the user.`
      };
    }
    if (concept === 'phone') {
      return {
        verdict: 'review',
        reason: 'Optional at best. Collect only if telephone callback is explicitly offered, and say so in the notice.'
      };
    }
    if (concept === 'dob' || concept === 'address' || concept === 'pincode' || concept === 'gender') {
      return {
        verdict: 'excess',
        reason: 'General contact forms do not require personal history or physical residence data.'
      };
    }
    if (classification.sensitive) {
      return {
        verdict: 'excess',
        reason: 'Sensitive data such as government ID or financial details is excess for general customer enquiries.'
      };
    }
    return {
      verdict: 'excess',
      reason: 'Not required to respond to general queries or contact requests.'
    };
  }

  // PURPOSE 3: Job Application / Hiring / Careers
  if (p.includes('job') || p.includes('career') || p.includes('application') || p.includes('hiring') || p.includes('employment')) {
    if (concept === 'name' || concept === 'email' || concept === 'phone' || concept === 'message') {
      return {
        verdict: 'needed',
        reason: 'Necessary to contact and evaluate the candidate for employment opportunities.'
      };
    }
    if (concept === 'address' || concept === 'pincode') {
      return {
        verdict: 'needed',
        reason: 'Required to ascertain geographic eligibility and work location commute.'
      };
    }
    if (concept === 'dob') {
      return {
        verdict: 'review',
        reason: 'Collecting exact date of birth is reviewable; age verification is typically required only at offer stage.'
      };
    }
    if (concept === 'gender') {
      return {
        verdict: 'review',
        reason: 'Only justified if collected strictly for statutory diversity and equality monitoring.'
      };
    }
    if (classification.category === 'gov_id') {
      return {
        verdict: 'excess',
        reason: 'Collecting PAN or Aadhaar at the initial application stage prior to an official job offer is disproportionate.'
      };
    }
    if (classification.category === 'financial') {
      return {
        verdict: 'excess',
        reason: 'Bank account and payment details are not needed before employment contract issuance.'
      };
    }
    return {
      verdict: 'review',
      reason: 'Review whether this field is essential for pre-employment screening.'
    };
  }

  // PURPOSE 4: Online Checkout / E-commerce / Order
  if (p.includes('checkout') || p.includes('e-commerce') || p.includes('ecommerce') || p.includes('order') || p.includes('purchase')) {
    if (concept === 'name' || concept === 'email' || concept === 'phone' || concept === 'address' || concept === 'pincode') {
      return {
        verdict: 'needed',
        reason: 'Essential for order confirmation, shipment delivery, and dispatch notifications.'
      };
    }
    if (classification.category === 'financial') {
      return {
        verdict: 'needed',
        reason: 'Payment details are required to complete financial transaction via secure payment gateway.'
      };
    }
    if (concept === 'dob') {
      return {
        verdict: 'review',
        reason: 'Only necessary if purchasing age-restricted products; otherwise excess for checkout.'
      };
    }
    if (concept === 'gender' || concept === 'income') {
      return {
        verdict: 'excess',
        reason: 'Gender and income are marketing attributes unnecessary for fulfilling an order.'
      };
    }
    if (classification.category === 'gov_id') {
      return {
        verdict: 'excess',
        reason: 'Government identification is excess for standard commercial goods delivery.'
      };
    }
    return {
      verdict: 'excess',
      reason: 'Not strictly necessary for billing and physical parcel delivery.'
    };
  }

  // PURPOSE 5: Account Registration / User Sign-up
  if (p.includes('account') || p.includes('registration') || p.includes('signup') || p.includes('sign up') || p.includes('register')) {
    if (concept === 'name' || concept === 'email' || concept === 'password') {
      return {
        verdict: 'needed',
        reason: 'Required for account creation, credentials authentication, and service identity.'
      };
    }
    if (concept === 'phone') {
      return {
        verdict: 'review',
        reason: 'Necessary if phone is used for 2-factor authentication or recovery, otherwise optional.'
      };
    }
    if (concept === 'dob') {
      return {
        verdict: 'review',
        reason: 'Permissible only for age-gating to prevent processing of minors without parental consent.'
      };
    }
    if (classification.category === 'gov_id' || concept === 'income' || concept === 'address') {
      return {
        verdict: 'excess',
        reason: 'Disproportionate for initial user registration unless regulatory KYC is specifically mandated.'
      };
    }
    return {
      verdict: 'excess',
      reason: 'Consider removing this field to adhere to the DPDP data minimisation requirement.'
    };
  }

  // PURPOSE 6: Event Registration / Webinar / Ticket
  if (p.includes('event') || p.includes('webinar') || p.includes('conference') || p.includes('ticket')) {
    if (concept === 'name' || concept === 'email' || concept === 'phone') {
      return {
        verdict: 'needed',
        reason: 'Required to issue attendee passes, send reminders, and manage event admissions.'
      };
    }
    if (concept === 'dietary') {
      return {
        verdict: 'review',
        reason: 'Health-adjacent. Permissible only for catered in-person gatherings with voluntary consent.'
      };
    }
    if (concept === 'dob' || concept === 'address' || classification.category === 'gov_id') {
      return {
        verdict: 'excess',
        reason: 'Detailed demographic and identity records are excess for event attendee management.'
      };
    }
    return {
      verdict: 'excess',
      reason: 'Excess data collection for event attendance.'
    };
  }

  // PURPOSE 7: Feedback Survey / Review
  if (p.includes('feedback') || p.includes('survey') || p.includes('rating')) {
    if (concept === 'rating' || concept === 'message') {
      return {
        verdict: 'needed',
        reason: 'Required to capture feedback and evaluation responses.'
      };
    }
    if (concept === 'email') {
      return {
        verdict: 'review',
        reason: 'Collect only if the respondent voluntarily asks for a reply or updates.'
      };
    }
    if (concept === 'name' || concept === 'phone' || concept === 'address' || concept === 'dob') {
      return {
        verdict: 'excess',
        reason: 'Surveys should preserve respondent anonymity where feasible; personal data is excess.'
      };
    }
    return {
      verdict: 'excess',
      reason: 'Survey questionnaires should minimize collection of identifying data.'
    };
  }

  // Fallback / Custom Purpose
  if (classification.sensitive) {
    return {
      verdict: 'excess',
      reason: 'Sensitive personal data detected without explicit legislative justification.'
    };
  }
  if (concept === 'email' || concept === 'name') {
    return {
      verdict: 'needed',
      reason: 'Essential identifier to fulfill basic communication for this purpose.'
    };
  }

  return {
    verdict: 'review',
    reason: 'We did not recognise this exact purpose, so we flagged this field for manual verification.'
  };
}

// Parse input HTML or list of field names
export function parseFormInput(rawInput: string, mode: 'html' | 'list'): RawFieldInput[] {
  if (!rawInput.trim()) return [];

  const results: RawFieldInput[] = [];

  if (mode === 'html') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawInput, 'text/html');

      // Select form controls
      const elements = doc.querySelectorAll('input, select, textarea');

      elements.forEach((el, index) => {
        const type = (el.getAttribute('type') || (el.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text')).toLowerCase();
        
        // Skip purely visual or submit buttons unless they store form data
        if (type === 'submit' || type === 'reset' || type === 'image') {
          return;
        }

        const name = el.getAttribute('name') || el.getAttribute('id') || `field_${index + 1}`;
        const autocomplete = el.getAttribute('autocomplete') || undefined;
        const placeholder = el.getAttribute('placeholder') || undefined;

        // Try to locate linked label
        let labelText: string | undefined = undefined;
        const id = el.getAttribute('id');
        if (id) {
          const labelEl = doc.querySelector(`label[for="${id}"]`);
          if (labelEl && labelEl.textContent) {
            labelText = labelEl.textContent.trim();
          }
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

      // If no input tag found, fallback to regex extraction in case of partial markup
      if (results.length === 0) {
        const inputMatches = rawInput.matchAll(/<(?:input|select|textarea)[^>]*name=["']([^"']+)["'][^>]*>/gi);
        for (const m of inputMatches) {
          const rawTag = m[0];
          const name = m[1];
          const typeMatch = rawTag.match(/type=["']([^"']+)["']/i);
          const type = typeMatch ? typeMatch[1] : 'text';
          if (type !== 'submit' && type !== 'button') {
            results.push({ name, type });
          }
        }
      }
    } catch {
      // If DOMParser fails, treat as plain text list
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
    // Strip bullet points or numbers
    const cleaned = trimmed.replace(/^[-*•\d.)\]\s]+/, '').trim();
    if (!cleaned) continue;

    // Check if format like "mob_no (phone)" or "email: text"
    let name = cleaned;
    let type = 'text';
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      name = parts[0].trim();
      type = parts[1].trim() || 'text';
    } else if (cleaned.includes('(') && cleaned.includes(')')) {
      const match = cleaned.match(/^([^(]+)\(([^)]+)\)/);
      if (match) {
        name = match[1].trim();
        type = match[2].trim();
      }
    }

    fields.push({
      name,
      type
    });
  }

  return fields;
}

// Full audit engine function
export function auditForm(rawInput: string, purpose: string, mode: 'html' | 'list'): AuditResult {
  const rawFields = parseFormInput(rawInput, mode);
  const p = purpose.trim() || 'general enquiry';

  const auditedFields: AuditedField[] = [];
  const categoryCounts: Record<FieldCategory, number> = {
    identity: 0,
    contact: 0,
    gov_id: 0,
    financial: 0,
    health: 0,
    location: 0,
    children: 0,
    demographic: 0,
    credentials: 0,
    technical: 0,
    not_personal: 0
  };

  let hasChildrenData = false;

  for (let i = 0; i < rawFields.length; i++) {
    const raw = rawFields[i];
    const classification = classifyField(raw);
    const { verdict, reason } = evaluateNecessity(classification, raw, p);

    categoryCounts[classification.category]++;
    if (classification.category === 'children') {
      hasChildrenData = true;
    }

    auditedFields.push({
      id: `field_${i}_${raw.name}`,
      name: raw.name,
      label: raw.label || raw.name,
      type: raw.type || 'text',
      autocomplete: raw.autocomplete,
      category: classification.category,
      categoryLabel: classification.categoryLabel,
      isPersonalData: classification.isPersonalData,
      sensitive: classification.sensitive,
      verdict,
      reason,
      matchedBy: classification.matchedBy
    });
  }

  // Count tallies
  const totalFields = auditedFields.length;
  const personalDataCount = auditedFields.filter(f => f.isPersonalData).length;
  const nonPersonalCount = auditedFields.filter(f => !f.isPersonalData).length;
  const necessaryCount = auditedFields.filter(f => f.verdict === 'needed').length;
  const unnecessaryCount = auditedFields.filter(f => f.verdict === 'excess').length;
  const reviewCount = auditedFields.filter(f => f.verdict === 'review').length;

  // Calculate Compliance Score (0-100) per section 7.6
  // Start: 100
  // Deductions:
  // -12 per excess field (-20 if sensitive)
  // -5 per review field
  // -15 if children's data without parental consent clause
  // -10 if Government ID collected without necessity
  // +10 if purpose clearly stated
  let score = 100;
  const deductions: ScoreDeduction[] = [];

  if (p && p.length >= 3 && p !== 'general enquiry') {
    deductions.push({
      delta: +10,
      reason: 'Purpose is explicitly declared before data collection',
      type: 'positive'
    });
  } else {
    score -= 15;
    deductions.push({
      delta: -15,
      reason: 'Purpose is ambiguous or generic; DPDP mandates specific purpose',
      type: 'negative'
    });
  }

  for (const field of auditedFields) {
    if (field.verdict === 'excess') {
      if (field.sensitive) {
        score -= 20;
        deductions.push({
          delta: -20,
          reason: `Excess sensitive data collected (${field.name} in ${field.categoryLabel})`,
          type: 'negative'
        });
      } else {
        score -= 12;
        deductions.push({
          delta: -12,
          reason: `Excess data field (${field.name}) not required for stated purpose`,
          type: 'negative'
        });
      }
    } else if (field.verdict === 'review') {
      score -= 5;
      deductions.push({
        delta: -5,
        reason: `Borderline field (${field.name}) requires explicit notice disclosure`,
        type: 'negative'
      });
    }
  }

  if (hasChildrenData) {
    score -= 15;
    deductions.push({
      delta: -15,
      reason: "Children's data detected; requires verifiable parental consent mechanism",
      type: 'negative'
    });
  }

  // Clamp score 0 to 100
  score = Math.max(0, Math.min(100, score));

  // Determine Band
  let scoreBand: 'Strong' | 'Fair' | 'Weak' | 'Poor' = 'Strong';
  let scoreColor = 'var(--score-strong)';
  let scoreStatusSentence = 'Strong compliance — form adheres tightly to data minimisation principles.';

  if (score >= 85) {
    scoreBand = 'Strong';
    scoreColor = 'var(--score-strong)';
    scoreStatusSentence = 'High compliance. Form collects strictly necessary information.';
  } else if (score >= 65) {
    scoreBand = 'Fair';
    scoreColor = 'var(--score-fair)';
    scoreStatusSentence = 'Fair compliance. A few excess or borderline fields should be reviewed.';
  } else if (score >= 40) {
    scoreBand = 'Weak';
    scoreColor = 'var(--score-weak)';
    scoreStatusSentence = 'Weak compliance. Several excess fields violate data minimisation.';
  } else {
    scoreBand = 'Poor';
    scoreColor = 'var(--score-poor)';
    scoreStatusSentence = 'Poor compliance. Substantial surplus and sensitive data collected unnecessarily.';
  }

  // Top 3 actionable recommendations
  const topImprovements: string[] = [];
  const excessFieldNames = auditedFields.filter(f => f.verdict === 'excess').map(f => f.name);
  if (excessFieldNames.length > 0) {
    topImprovements.push(`Remove excess fields (${excessFieldNames.slice(0, 3).join(', ')}${excessFieldNames.length > 3 ? '...' : ''}) from your form.`);
  }
  if (reviewCount > 0) {
    topImprovements.push('Mark optional fields clearly in your UI or justify them in the notice.');
  }
  if (hasChildrenData) {
    topImprovements.push("Incorporate a verifiable parental consent mechanism before processing minors' data.");
  }
  if (topImprovements.length < 3) {
    topImprovements.push('Specify a dedicated Grievance Redressal officer contact in your consent notice.');
  }
  if (topImprovements.length < 3) {
    topImprovements.push('Define a clear data retention duration so personal data is not held indefinitely.');
  }

  return {
    purpose: p,
    fields: auditedFields,
    totalFields,
    personalDataCount,
    nonPersonalCount,
    necessaryCount,
    unnecessaryCount,
    reviewCount,
    score,
    scoreBand,
    scoreColor,
    scoreStatusSentence,
    scoreDeductions: deductions.slice(0, 8),
    topImprovements: topImprovements.slice(0, 3),
    hasChildrenData,
    categoryCounts
  };
}

// Sample messy form code
export const SAMPLE_MESSY_FORM_HTML = `<form action="/subscribe" method="POST">
  <!-- Basic Contact Details -->
  <label for="usr_nm">Full Name</label>
  <input type="text" id="usr_nm" name="usr_nm" placeholder="e.g. Rahul Sharma" />

  <label for="mob_no">Mobile Phone</label>
  <input type="tel" id="mob_no" name="mob_no" placeholder="+91 98765 43210" />

  <label for="e_mail">Email Address</label>
  <input type="email" id="e_mail" name="e_mail" placeholder="user@example.com" required />

  <label for="dob_dd">Date of Birth</label>
  <input type="date" id="dob_dd" name="dob_dd" />

  <!-- Identification & Demographics -->
  <label for="aadhar_no">Aadhaar Card Number</label>
  <input type="text" id="aadhar_no" name="aadhar_no" placeholder="12-digit number" />

  <label for="pan">PAN Card Number</label>
  <input type="text" id="pan" name="pan" placeholder="ABCDE1234F" />

  <label for="addr_line1">Street Address</label>
  <input type="text" id="addr_line1" name="addr_line1" placeholder="Flat, building, road" />

  <label for="pincode">Postal PIN Code</label>
  <input type="text" id="pincode" name="pincode" placeholder="400001" />

  <label for="gender_sel">Gender</label>
  <select id="gender_sel" name="gender_sel">
    <option value="">Select Gender</option>
    <option value="female">Female</option>
    <option value="male">Male</option>
    <option value="other">Other</option>
  </select>

  <label for="income_range">Annual Household Income</label>
  <select id="income_range" name="income_range">
    <option value="">Select Range</option>
    <option value="1">Under 5 Lakhs</option>
    <option value="2">5-10 Lakhs</option>
    <option value="3">Above 10 Lakhs</option>
  </select>

  <!-- Security & Action -->
  <input type="hidden" name="csrf_token" value="d9a8f4c2e6b108" />
  <button type="submit" name="submit_btn">Subscribe to Weekly Newsletter</button>
</form>`;

export const SAMPLE_MESSY_PURPOSE = "newsletter signup";
