import React from 'react';
import type { AuditResult, NoticeLanguage } from '../types/dpdp';
import { generateConsentNotice } from '../engine/noticeGenerator';
import { FileText, AlertTriangle, ShieldAlert } from 'lucide-react';

interface PanelNoticeProps {
  result: AuditResult | null;
  language: NoticeLanguage;
  onLanguageChange: (lang: NoticeLanguage) => void;
  onCopyNotice?: () => void;
  copyToast?: boolean;
}

export const PanelNotice: React.FC<PanelNoticeProps> = ({
  result,
  language,
  onLanguageChange
}) => {
  const languageNames: Record<NoticeLanguage, string> = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी'
  };

  if (!result) {
    return (
      <div
        id="panel-notice"
        className="bg-white rounded-[14px] border border-[var(--border)] p-6 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <FileText className="w-8 h-8 text-[var(--text-3)] mb-2" />
        <h3 className="text-sm font-bold text-[var(--text)]">Draft consent notice</h3>
        <p className="text-xs text-[var(--text-2)] mt-1">
          A compliant Section 6 notice will be drafted here automatically after analysis.
        </p>
      </div>
    );
  }

  const notice = generateConsentNotice(result, language);

  // Helper to render text with pale amber highlighted placeholders
  const renderHighlighted = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded font-mono text-xs font-semibold"
            style={{
              backgroundColor: '#FFF4DB',
              color: '#9A6200',
              border: '1px dashed #E5C37A'
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
      className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
      lang={language}
    >
      {/* Title row with step badge 5 & language tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[var(--blue-600)] text-white text-sm font-bold flex items-center justify-center shrink-0">
            5
          </div>
          <h2 className="text-lg font-bold text-[var(--text)]">
            Draft consent notice ({languageNames[language]})
          </h2>
        </div>

        {/* Language Tabs (segmented, 36px high, active = blue fill with white text) */}
        <div
          className="flex items-center h-9 p-1 bg-[var(--surface-alt)] rounded-lg border border-[var(--border)] text-xs font-semibold self-start sm:self-auto"
          role="tablist"
        >
          <button
            role="tab"
            aria-selected={language === 'en'}
            onClick={() => onLanguageChange('en')}
            className={`h-7 px-3 rounded-md transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-[var(--blue-600)] text-white shadow-xs font-bold'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            English
          </button>
          <button
            role="tab"
            aria-selected={language === 'hi'}
            onClick={() => onLanguageChange('hi')}
            className={`h-7 px-3 rounded-md transition-all cursor-pointer ${
              language === 'hi'
                ? 'bg-[var(--blue-600)] text-white shadow-xs font-bold'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            हिंदी
          </button>
          <button
            role="tab"
            aria-selected={language === 'mr'}
            onClick={() => onLanguageChange('mr')}
            className={`h-7 px-3 rounded-md transition-all cursor-pointer ${
              language === 'mr'
                ? 'bg-[var(--blue-600)] text-white shadow-xs font-bold'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* Amber Draft Banner (Full width, 40px, alert icon, #FFF4DB bg, #9A6200 text) */}
      <div
        className="h-10 px-3.5 rounded-lg flex items-center gap-2 text-xs font-medium shrink-0"
        style={{
          backgroundColor: '#FFF4DB',
          color: '#9A6200',
          border: '1px solid #F8E0B0'
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Draft notice for guidance. Not legal advice. Review before publishing.</span>
      </div>

      {/* Notice Card (White, 1px border, 24px padding, text 16/26, max-width 68ch, max-height 360px scrollable) */}
      <div className="rounded-xl border border-[var(--border)] p-6 bg-white overflow-y-auto max-h-[360px] shadow-2xs">
        <div className="max-w-[68ch] space-y-4 text-[15px] sm:text-[16px] leading-[26px] text-[var(--text)]">
          <h3 className="text-lg font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
            {notice.headline}
          </h3>

          {/* Paragraph 1: Collected data in bold + purpose + explicit non-collection */}
          <p>
            {notice.paragraph1.prefix}
            <strong className="font-bold text-[var(--text)]">
              {notice.paragraph1.collectedData}
            </strong>
            {notice.paragraph1.mid}
            {notice.paragraph1.purposePhrase}
            {notice.paragraph1.suffix}
          </p>

          {/* Paragraph 2: How to withdraw consent */}
          <p>{renderHighlighted(notice.paragraph2)}</p>

          {/* Children's notice if present */}
          {notice.childrenNotice && (
            <div className="p-3 rounded-lg bg-[var(--personal-bg)] border border-[var(--personal-bd)] text-xs text-[var(--personal-tx)] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice.childrenNotice}</span>
            </div>
          )}

          {/* Footer Line */}
          <p className="text-xs text-[var(--text-3)] pt-2 border-t border-[var(--border)] italic">
            This is a <strong className="font-semibold text-[var(--text-2)]">draft notice</strong> for guidance and not legal advice. Please review and customize it for your organization.
          </p>
        </div>
      </div>
    </div>
  );
};
