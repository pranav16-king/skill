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
  | 'not_personal';

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
  verdict: FieldVerdict;
  reason: string;
  matchedBy: string[];
}

export type InputMode = 'html' | 'list';

export type NoticeLanguage = 'en' | 'hi' | 'mr';

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
  necessaryCount: number;
  unnecessaryCount: number;
  reviewCount: number;
  score: number;
  scoreBand: 'Strong' | 'Fair' | 'Weak' | 'Poor';
  scoreColor: string;
  scoreStatusSentence: string;
  scoreDeductions: ScoreDeduction[];
  topImprovements: string[];
  hasChildrenData: boolean;
  categoryCounts: Record<FieldCategory, number>;
}
