/**
 * TypeScript Type Definitions for DPDP Rules and Knowledge Engine
 * Shared across frontend and serverless edge functions.
 */

export type CategoryId =
  | "identity"
  | "contact"
  | "government_id"
  | "financial"
  | "health"
  | "biometric"
  | "children_data"
  | "demographic"
  | "credentials"
  | "location"
  | "employment_education"
  | "behavioral_preference"
  | "technical"
  | "not_personal";

export type Verdict = "needed" | "excess" | "review" | "not_personal";

export type RiskTier = "high" | "standard" | "low" | "none";

export type ScoreBand = "strong" | "fair" | "weak" | "poor";

export type NoticeLanguage = "en" | "hi" | "mr";

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  glyph: string;
  sensitive: boolean;
  risk_tier: RiskTier;
  color: string;
  bg_color: string;
  description: string;
}

export interface QualifierGuard {
  tokens: string[];
  override_category: CategoryId;
  sensitive: boolean;
  reason: string;
}

export interface RegexPatternDefinition {
  pattern: string;
  description: string;
  category: CategoryId;
  sensitive: boolean;
}

export interface CategoryKeywords {
  tokens: string[];
  hinglish: string[];
  types: string[];
  autocomplete: string[];
}

export interface PurposeProfile {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  needed_fields: string[];
  review_fields: string[];
  typically_excess: string[];
}

export interface NoticeHeadings {
  what_we_collect: string;
  why_we_collect: string;
  how_to_withdraw: string;
  grievance_redressal: string;
  retention_period: string;
  children_notice: string;
}

export interface NoticeBody {
  what_we_collect: string;
  why_we_collect: string;
  how_to_withdraw: string;
  grievance_redressal: string;
  retention_period: string;
  children_notice: string;
  disclaimer: string;
}

export interface NoticeTemplate {
  lang: NoticeLanguage;
  language_name: string;
  draft_banner: string;
  headings: NoticeHeadings;
  body: NoticeBody;
}

export interface ScoreBandRange {
  min: number;
  max: number;
  label: string;
}

export interface ScoringRules {
  base_score: number;
  penalties: {
    excess_standard: number;
    excess_sensitive: number;
    review: number;
    unverified_children_data: number;
    disproportionate_gov_id: number;
  };
  bonus: {
    purpose_clearly_stated: number;
    strict_minimisation_adhered: number;
  };
  bands: Record<ScoreBand, ScoreBandRange>;
}

export interface RulesDictionary {
  version: string;
  metadata: {
    title: string;
    description: string;
    act_reference: string;
  };
  categories: CategoryDefinition[];
  qualifier_guards: QualifierGuard[];
  regex_patterns: Record<string, RegexPatternDefinition>;
  category_keywords: Record<CategoryId, CategoryKeywords>;
  purposes: PurposeProfile[];
  notice_templates: Record<NoticeLanguage, NoticeTemplate>;
  scoring_rules: ScoringRules;
}

export interface FieldInfo {
  name: string;
  label?: string;
  type?: string;
  autocomplete?: string;
  placeholder?: string;
  tokens?: string[];
}

export interface FieldClassification {
  category: CategoryId;
  sensitive: boolean;
  matched_by: string[];
  guard_reason?: string;
}

export interface FieldEvaluationResult {
  name: string;
  label: string;
  type: string;
  autocomplete?: string;
  category: CategoryId;
  sensitive: boolean;
  verdict: Verdict;
  reason: string;
  matchedBy: string[];
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  reasons: string[];
  improvements: string[];
}

export interface FormattedNoticeResult {
  lang: NoticeLanguage;
  language_name: string;
  draft_banner: string;
  formatted_text: string;
  sections: {
    what_we_collect: string;
    why_we_collect: string;
    how_to_withdraw: string;
    grievance_redressal: string;
    retention_period: string;
    children_notice?: string | null;
    disclaimer: string;
  };
}
