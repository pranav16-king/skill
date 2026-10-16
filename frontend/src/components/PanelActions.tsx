import React from 'react';
import type { AuditResult, NoticeLanguage } from '../types/dpdp';
import { Printer, Download, Copy, Check, ShieldCheck } from 'lucide-react';

interface PanelActionsProps {
  result: AuditResult | null;
  onPrintPdf: () => void;
  onDownloadTxt: () => void;
  onCopyNotice: () => void;
  copyToast: boolean;
  language: NoticeLanguage;
}

export const PanelActions: React.FC<PanelActionsProps> = ({
  result,
  onPrintPdf,
  onDownloadTxt,
  onCopyNotice,
  copyToast
}) => {
  const isEnabled = result !== null && result.fields.length > 0;

  return (
    <div
      id="panel-actions"
      className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col justify-between gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Panel Header */}
      <div className="pb-2 border-b border-[var(--line)]">
        <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
          6. Export & Actions
        </h2>
        <p className="text-xs text-[var(--ink-3)] mt-0.5">
          Download compliance artifacts or print report
        </p>
      </div>

      {/* 3 Large 64px Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Action 1: Print / PDF (64px) */}
        <button
          type="button"
          onClick={onPrintPdf}
          disabled={!isEnabled}
          className="h-16 px-4 rounded-xl border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3.5 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--primary-tint)] flex items-center justify-center shrink-0 text-[var(--primary)] group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-sm font-semibold text-[var(--ink)] block group-hover:text-[var(--primary)] transition-colors">
              Download report (PDF)
            </span>
            <span className="text-xs text-[var(--ink-3)] block truncate">
              Print-optimized statutory audit report
            </span>
          </div>
        </button>

        {/* Action 2: Download Text File (64px) */}
        <button
          type="button"
          onClick={onDownloadTxt}
          disabled={!isEnabled}
          className="h-16 px-4 rounded-xl border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3.5 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[#E0F2F8] flex items-center justify-center shrink-0 text-[#0B5F7A] group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-sm font-semibold text-[var(--ink)] block group-hover:text-[#0B5F7A] transition-colors">
              Download text file
            </span>
            <span className="text-xs text-[var(--ink-3)] block truncate">
              .txt report with classifications & notice
            </span>
          </div>
        </button>

        {/* Action 3: Copy Consent Notice (64px) */}
        <button
          type="button"
          onClick={onCopyNotice}
          disabled={!isEnabled}
          className="h-16 px-4 rounded-xl border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3.5 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--needed-bg)] flex items-center justify-center shrink-0 text-[var(--needed)] group-hover:scale-105 transition-transform">
            {copyToast ? <Check className="w-5 h-5 text-[var(--needed)]" /> : <Copy className="w-5 h-5" />}
          </div>
          <div className="truncate">
            <span className="text-sm font-semibold text-[var(--ink)] block group-hover:text-[var(--needed)] transition-colors">
              {copyToast ? 'Notice copied!' : 'Copy consent notice'}
            </span>
            <span className="text-xs text-[var(--ink-3)] block truncate">
              {copyToast ? 'Ready to paste in your privacy policy' : 'Copy statutory draft to clipboard'}
            </span>
          </div>
        </button>
      </div>

      {/* Bottom Privacy Card */}
      <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] text-xs text-[var(--ink-2)] flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-md bg-white border border-[var(--line)] flex items-center justify-center shrink-0 text-[var(--needed)]">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="leading-snug">
          <span className="font-semibold text-[var(--ink)] block">
            Guaranteed in-browser execution
          </span>
          <span className="text-[11px] text-[var(--ink-3)]">
            Runs entirely in your browser. No form data or personal credentials are ever uploaded or saved.
          </span>
        </div>
      </div>
    </div>
  );
};
