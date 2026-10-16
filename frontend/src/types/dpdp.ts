export type FieldCategory =
  | 'identity'
  | 'contact'
  | 'gov_id'
  | 'financial'
  | 'health'
  | 'location'
  | 'children'
  | 'demographic'
  | 'credentials'
  | 'technical'
  | 'not_personal'
  | 'non_personal';

export type FieldVerdict = 'needed' | 'excess' | 'review' | 'not-personal';

export interface AuditedField {
  id: string;
  name: string;
  label: string;
  type: string;
  autocomplete?: string;
  category: FieldCategory;
  categoryLabel: string;
  isPersonalData: boolean;
  sensitive: boolean;
  verdict?: FieldVerdict;
  needed?: boolean;
  reason: string;
  matchedBy: string[];
}

export type InputMode = 'html' | 'list';

export type NoticeLanguage = 'en' | 'hi' | 'mr';

export interface ScoreItem {
  iconType: 'tick' | 'cross' | 'warning';
  delta: number;
  description: string;
}

export interface ScoreDeduction {
  delta: number;
  reason: string;
  type: 'positive' | 'negative';
}

export interface AuditResult {
  purpose: string;
  fields: AuditedField[];
  totalFields: number;
  personalDataCount: number;
  nonPersonalCount: number;
  personalPercent: number;
  nonPersonalPercent: number;
  necessaryCount: number;
  unnecessaryCount: number;
  reviewCount?: number;
  score: number;
  scoreBand: 'Good' | 'Fair' | 'Needs improvement' | 'Poor' | 'Strong' | 'Weak';
  scoreColor: string;
  scoreStatusSentence: string;
  scoreItems?: ScoreItem[];
  scoreDeductions?: ScoreDeduction[];
  topImprovements?: string[];
  hasConsentCheckbox: boolean;
  hasChildrenData: boolean;
  categoryCounts: Record<string, number>;
  categoryFieldLabels: Record<string, string[]>;
}
