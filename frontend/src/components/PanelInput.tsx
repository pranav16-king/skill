import React from 'react';
import type { InputMode } from '../types/dpdp';
import { AlertCircle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

interface PanelInputProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  rawInput: string;
  onInputChange: (val: string) => void;
  purpose: string;
  onPurposeChange: (val: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadSample: () => void;
  isAnalyzing: boolean;
  inputError?: string;
  purposeError?: string;
}

const PURPOSE_CHIPS = [
  'Newsletter signup',
  'Contact us',
  'Job application',
  'Account registration',
  'Online checkout',
  'Event registration',
  'Feedback survey'
];

export const PanelInput: React.FC<PanelInputProps> = ({
  mode,
  onModeChange,
  rawInput,
  onInputChange,
  purpose,
  onPurposeChange,
  onAnalyze,
  onClear,
  onLoadSample,
  isAnalyzing,
  inputError,
  purposeError
}) => {
  return (
    <div
      id="panel-input"
      className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Title Row with 28px blue step badge */}
      <div className="flex items-center gap-2.5 pb-1">
        <div className="w-7 h-7 rounded-full bg-[var(--blue-600)] text-white text-sm font-bold flex items-center justify-center shrink-0">
          1
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">Provide input</h2>
      </div>

      {/* Segmented Toggle (height 40px) */}
      <div
        className="grid grid-cols-2 h-10 p-1 bg-[var(--surface-alt)] rounded-lg border border-[var(--border)] text-xs font-semibold"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={mode === 'html'}
          onClick={() => onModeChange('html')}
          className={`rounded-md transition-all cursor-pointer ${
            mode === 'html'
              ? 'bg-white text-[var(--blue-600)] border border-[var(--blue-600)] shadow-2xs font-bold'
              : 'text-[var(--text-2)] hover:text-[var(--text)]'
          }`}
        >
          Paste HTML
        </button>
        <button
          role="tab"
          aria-selected={mode === 'list'}
          onClick={() => onModeChange('list')}
          className={`rounded-md transition-all cursor-pointer ${
            mode === 'list'
              ? 'bg-white text-[var(--blue-600)] border border-[var(--blue-600)] shadow-2xs font-bold'
              : 'text-[var(--text-2)] hover:text-[var(--text)]'
          }`}
        >
          Enter field list
        </button>
      </div>

      {/* Helper Line */}
      <p className="text-sm text-[var(--text-2)] leading-relaxed">
        Paste the HTML of your form below or enter field names. Add a one-line purpose for data collection.
      </p>

      {/* Purpose Input Section */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="form-purpose" className="text-sm font-semibold text-[var(--text)]">
          Form purpose <span className="text-[var(--personal-tx)]">*</span>
        </label>
        <input
          id="form-purpose"
          type="text"
          value={purpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          placeholder="e.g. Newsletter signup"
          className="h-11 px-3.5 text-sm rounded-lg border border-[var(--border-strong)] bg-white text-[var(--text)] placeholder-[var(--text-3)]/60 focus:border-[var(--blue-600)] transition-colors"
        />
        <span className="text-xs text-[var(--text-3)]">
          Example: newsletter signup, job application, event registration
        </span>
        {purposeError && (
          <p role="alert" className="text-xs text-[var(--personal-tx)] flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {purposeError}
          </p>
        )}

        {/* Quick-pick purpose chips */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {PURPOSE_CHIPS.map((chip) => {
            const isSelected = purpose.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onPurposeChange(chip)}
                className={`text-[12px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--necessary-bg)] border-[var(--blue-600)] text-[var(--blue-600)] font-semibold'
                    : 'bg-white border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea Section */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="form-code" className="text-sm font-semibold text-[var(--text)]">
          {mode === 'html' ? 'HTML code' : 'Field names'}{' '}
          <span className="text-[var(--personal-tx)]">*</span>
        </label>
        <textarea
          id="form-code"
          value={rawInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={
            mode === 'html'
              ? '<form action="/submit">\n  <input name="email" type="email" />\n  ...\n</form>'
              : 'One per line or comma separated: full_name, mob_no, dob'
          }
          rows={9}
          className="w-full p-3 font-mono text-[13px] rounded-lg border border-[var(--border-strong)] bg-[var(--surface-alt)] text-[var(--text)] placeholder-[var(--text-3)]/50 focus:bg-white focus:border-[var(--blue-600)] transition-all resize-y leading-relaxed min-h-[260px]"
          spellCheck={false}
        />
        {inputError && (
          <p role="alert" className="text-xs text-[var(--personal-tx)] flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {inputError}
          </p>
        )}
      </div>

      {/* Action Buttons: Clear (44px secondary) left; Analyze form -> (44px primary) right */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onClear}
          className="h-11 px-4 rounded-lg border border-[var(--border-strong)] bg-white hover:bg-[var(--surface-alt)] text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="h-11 flex-1 min-w-[140px] rounded-lg bg-[var(--blue-600)] hover:bg-[var(--blue-700)] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <span>{isAnalyzing ? 'Analyzing…' : 'Analyze form'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Small sample link under buttons */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onLoadSample}
          className="text-xs text-[var(--blue-600)] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Load sample form</span>
        </button>
      </div>
    </div>
  );
};
