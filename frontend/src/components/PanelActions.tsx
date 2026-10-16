import React from 'react';
import type { AuditResult } from '../types/dpdp';
import { Printer, Download, Copy, Check, Lock } from 'lucide-react';

interface PanelActionsProps {
  result: AuditResult | null;
  onPrintPdf: () => void;
  onDownloadTxt: () => void;
  onCopyNotice: () => void;
  copyToast: boolean;
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
      className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col justify-between gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Title Row with step badge 6 */}
      <div className="flex items-center gap-2.5 pb-1">
        <div className="w-7 h-7 rounded-full bg-[var(--blue-600)] text-white text-sm font-bold flex items-center justify-center shrink-0">
          6
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">Export</h2>
      </div>

      {/* Stack of three large buttons (64px tall, radius 10px, 12px gap) */}
      <div className="flex flex-col gap-3">
        {/* Button 1: Download report (PDF) - Filled purple #5B3FE0, white text */}
        <button
          type="button"
          onClick={onPrintPdf}
          disabled={!isEnabled}
          title={!isEnabled ? 'Analyze a form first' : 'Open print / save as PDF'}
          className="h-16 px-4 rounded-[10px] bg-[var(--purple-600)] hover:bg-[var(--purple-700)] text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3.5 text-left transition-all cursor-pointer shadow-xs group"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 text-white">
            <Printer className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-[15px] font-bold text-white block leading-tight">
              Download report (PDF)
            </span>
            <span className="text-xs text-white/80 block mt-0.5 truncate">
              Complete analysis with tables and notice
            </span>
          </div>
        </button>

        {/* Button 2: Download text file - White, 1.5px purple border, purple text */}
        <button
          type="button"
          onClick={onDownloadTxt}
          disabled={!isEnabled}
          title={!isEnabled ? 'Analyze a form first' : 'Download report as plain text file'}
          className="h-16 px-4 rounded-[10px] bg-white hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3.5 text-left transition-all cursor-pointer shadow-xs border-[1.5px] border-[var(--purple-600)] text-[var(--purple-600)]"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EEE9FD] flex items-center justify-center shrink-0 text-[var(--purple-600)]">
            <Download className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-[15px] font-bold block leading-tight">
              Download text file
            </span>
            <span className="text-xs text-[var(--text-3)] block mt-0.5 truncate">
              Summary and draft notice
            </span>
          </div>
        </button>

        {/* Button 3: Copy consent notice - Outline style, subtitle changes to "Copied" */}
        <button
          type="button"
          onClick={onCopyNotice}
          disabled={!isEnabled}
          title={!isEnabled ? 'Analyze a form first' : 'Copy notice text to clipboard'}
          className="h-16 px-4 rounded-[10px] bg-white hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3.5 text-left transition-all cursor-pointer shadow-xs border-[1.5px] border-[var(--purple-600)] text-[var(--purple-600)]"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EEE9FD] flex items-center justify-center shrink-0 text-[var(--purple-600)]">
            {copyToast ? <Check className="w-5 h-5 text-[#0F7A4F]" /> : <Copy className="w-5 h-5" />}
          </div>
          <div className="truncate" aria-live="polite">
            <span className="text-[15px] font-bold block leading-tight">
              Copy consent notice
            </span>
            <span
              className={`text-xs block mt-0.5 truncate ${
                copyToast ? 'text-[#0F7A4F] font-semibold' : 'text-[var(--text-3)]'
              }`}
            >
              {copyToast ? 'Copied' : 'Copy to clipboard'}
            </span>
          </div>
        </button>
      </div>

      {/* Green Privacy Card (#E7F6EE bg, #B7E2CA border) */}
      <div className="p-3.5 rounded-xl border border-[var(--nonpers-bd)] bg-[var(--nonpers-bg)] text-xs text-[var(--text-2)] flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white border border-[var(--nonpers-bd)] flex items-center justify-center shrink-0 text-[var(--nonpers-tx)]">
          <Lock className="w-4 h-4" />
        </div>
        <div className="leading-snug">
          <span className="font-bold text-[var(--text)] block text-xs">
            100% private & secure
          </span>
          <span className="text-[11px] text-[var(--text-3)] mt-0.5 block">
            All analysis is rule-based and runs entirely in your browser. No data is sent to any server.
          </span>
        </div>
      </div>
    </div>
  );
};
