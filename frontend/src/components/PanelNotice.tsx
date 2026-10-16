import React from 'react';
import type { AuditResult, NoticeLanguage } from '../types/dpdp';
import { generateConsentNotice } from '../engine/noticeGenerator';
import {
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Info,
  ShieldAlert
} from 'lucide-react';

interface PanelNoticeProps {
  result: AuditResult | null;
  language: NoticeLanguage;
  onLanguageChange: (lang: NoticeLanguage) => void;
  onCopyNotice: () => void;
  copyToast: boolean;
}

export const PanelNotice: React.FC<PanelNoticeProps> = ({
  result,
  language,
  onLanguageChange,
  onCopyNotice,
  copyToast
}) => {
  if (!result) {
    return (
      <div
        id="panel-notice"
        className="bg-white rounded-xl border border-[var(--line)] p-6 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <FileText className="w-8 h-8 text-[var(--ink-3)]/60 mb-2" />
        <h3 className="text-sm font-semibold text-[var(--ink)]">Draft consent notice</h3>
        <p className="text-xs text-[var(--ink-3)] mt-1">
          A compliant Section 6 notice will be generated automatically based on your form fields.
        </p>
      </div>
    );
  }

  const notice = generateConsentNotice(result, language);

  // Helper to render text with highlighted [bracketed] placeholders
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded font-mono text-xs font-semibold"
            style={{
              backgroundColor: 'var(--review-bg)',
              color: 'var(--review)',
              border: '1px dashed var(--review)'
            }}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div
      id="panel-notice"
      className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
      lang={language}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            5. Draft consent notice
          </h2>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Statutory notice drafted under Section 6 of DPDP Act 2023
          </p>
        </div>

        {/* Language Tabs & Copy Button */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center p-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface-alt)]"
            role="tablist"
            aria-label="Notice language switch"
          >
            <button
              role="tab"
              aria-selected={language === 'en'}
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-white text-[var(--primary)] font-semibold shadow-xs'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              English
            </button>
            <button
              role="tab"
              aria-selected={language === 'hi'}
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'hi'
                  ? 'bg-white text-[var(--primary)] font-semibold shadow-xs'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              हिन्दी
            </button>
            <button
              role="tab"
              aria-selected={language === 'mr'}
              onClick={() => onLanguageChange('mr')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'mr'
                  ? 'bg-white text-[var(--primary)] font-semibold shadow-xs'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              मराठी
            </button>
          </div>

          <button
            type="button"
            onClick={onCopyNotice}
            className="h-8 px-3 rounded-lg border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-alt)] text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
            aria-label="Copy consent notice to clipboard"
          >
            {copyToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--needed)]" />
                <span className="text-[var(--needed)] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Permanent Amber Draft Banner */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-lg text-xs leading-relaxed"
        style={{
          backgroundColor: 'var(--review-bg)',
          color: 'var(--review)',
          border: '1px solid rgba(138, 83, 0, 0.25)'
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="font-medium">
          Draft notice. Review with a qualified legal professional before publishing. Placeholders in dashed boxes must be customized.
        </span>
      </div>

      {/* Excluded excess fields note */}
      {result.unnecessaryCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-alt)] text-xs text-[var(--ink-2)] border border-[var(--line)]">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{notice.excludedNote}</span>
        </div>
      )}

      {/* Structured Notice Document Container */}
      <div
        className="rounded-xl border border-[var(--line)] p-5 space-y-4 max-w-[68ch] bg-white shadow-2xs leading-relaxed"
        style={{ color: 'var(--ink)' }}
      >
        <h3 className="text-base font-bold text-[var(--ink)] pb-2 border-b border-[var(--line)]">
          {notice.headline}
        </h3>

        {/* Section 1: What we collect */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--ink)] mb-1.5">
            {notice.collectTitle}
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-[var(--ink-2)] pl-1">
            {notice.collectItems.map((item, idx) => (
              <li key={idx} className="leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 2: Why we collect it */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--ink)] mb-1">
            {notice.purposeTitle}
          </h4>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            {notice.purposeText}
          </p>
        </div>

        {/* Section 3: How to withdraw consent */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--ink)] mb-1">
            {notice.withdrawTitle}
          </h4>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            {renderHighlightedText(notice.withdrawText)}
          </p>
        </div>

        {/* Section 4: Data Retention */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--ink)] mb-1">
            {notice.retentionTitle}
          </h4>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            {renderHighlightedText(notice.retentionText)}
          </p>
        </div>

        {/* Section 5: Grievance Redressal */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--ink)] mb-1">
            {notice.grievanceTitle}
          </h4>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            {renderHighlightedText(notice.grievanceText)}
          </p>
        </div>

        {/* Section 6: Children's data notice if flagged */}
        {notice.childrenNotice && (
          <div
            className="p-3 rounded-lg border text-xs"
            style={{
              backgroundColor: 'var(--review-bg)',
              borderColor: 'var(--review)',
              color: 'var(--review)'
            }}
          >
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                {notice.childrenNotice}
              </p>
            </div>
          </div>
        )}

        {/* Notice Disclaimer Footer */}
        <p className="text-[10px] text-[var(--ink-3)] pt-2 border-t border-[var(--line)] italic">
          {notice.draftDisclaimer}
        </p>
      </div>
    </div>
  );
};
