import React from 'react';
import type { InputMode } from '../types/dpdp';
import { Code2, ListOrdered, Sparkles, Play, RotateCcw, AlertTriangle } from 'lucide-react';

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
  const htmlPlaceholder = `<form action="/subscribe" method="POST">
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
  <button type="submit">Submit</button>
</form>`;

  const listPlaceholder = `usr_nm
mob_no
e_mail
dob_dd
aadhar_no
pan
addr_line1
pincode
gender_sel
income_range
csrf_token`;

  return (
    <div
      id="panel-input"
      className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            1. Provide input
          </h2>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Paste HTML or enter a list of field identifiers
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div
        className="grid grid-cols-2 p-1 bg-[var(--surface-alt)] rounded-lg border border-[var(--line)] text-xs font-medium"
        role="tablist"
        aria-label="Input format switch"
      >
        <button
          role="tab"
          aria-selected={mode === 'html'}
          onClick={() => onModeChange('html')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
            mode === 'html'
              ? 'bg-white text-[var(--primary)] shadow-xs font-semibold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Paste HTML</span>
        </button>
        <button
          role="tab"
          aria-selected={mode === 'list'}
          onClick={() => onModeChange('list')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
            mode === 'list'
              ? 'bg-white text-[var(--primary)] shadow-xs font-semibold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Enter field list</span>
        </button>
      </div>

      {/* Purpose Input Section */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="form-purpose" className="text-xs font-semibold text-[var(--ink)]">
          What is this form for? <span className="text-[var(--excess)]">*</span>
        </label>
        <input
          id="form-purpose"
          type="text"
          value={purpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          placeholder="e.g. newsletter signup, contact us, job application"
          className="h-10 px-3 text-sm rounded-lg border border-[var(--line-strong)] bg-white text-[var(--ink)] placeholder-[var(--ink-3)]/60 focus:border-[var(--primary)] transition-colors"
        />
        {purposeError && (
          <p role="alert" className="text-xs text-[var(--excess)] flex items-center gap-1 mt-0.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
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
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-[var(--primary-tint)] border-[var(--primary)] text-[var(--primary)] font-medium'
                    : 'bg-white border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code / Field Textarea */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="form-content" className="text-xs font-semibold text-[var(--ink)]">
            {mode === 'html' ? 'Form HTML snippet' : 'Field identifiers (one per line)'}{' '}
            <span className="text-[var(--excess)]">*</span>
          </label>
          <span className="text-[11px] text-[var(--ink-3)] font-mono">
            {rawInput.length > 0 ? `${rawInput.length} chars` : 'Empty'}
          </span>
        </div>
        <textarea
          id="form-content"
          value={rawInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={mode === 'html' ? htmlPlaceholder : listPlaceholder}
          rows={9}
          className="w-full p-3 font-mono text-xs rounded-lg border border-[var(--line-strong)] bg-[var(--surface-alt)] text-[var(--ink)] placeholder-[var(--ink-3)]/50 focus:bg-white focus:border-[var(--primary)] transition-all resize-y leading-relaxed"
          spellCheck={false}
        />
        {inputError && (
          <p role="alert" className="text-xs text-[var(--excess)] flex items-center gap-1 mt-0.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {inputError}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="h-11 w-full rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          {isAnalyzing ? 'Analyzing form…' : 'Analyze form'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="h-9 px-3 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-alt)] text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load sample</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="h-9 px-3 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-alt)] text-xs font-medium text-[var(--ink-3)] hover:text-[var(--excess)] flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
