import React from 'react';
import type { AuditResult } from '../types/dpdp';
import { Award, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface PanelScoreProps {
  result: AuditResult | null;
}

export const PanelScore: React.FC<PanelScoreProps> = ({ result }) => {
  if (!result) {
    return (
      <div
        id="panel-score"
        className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <Award className="w-8 h-8 text-[var(--ink-3)]/60 mb-2" />
        <h3 className="text-sm font-semibold text-[var(--ink)]">Compliance score</h3>
        <p className="text-xs text-[var(--ink-3)] mt-1">
          Analyzes data necessity, sensitivity penalties, and consent notice requirements.
        </p>
      </div>
    );
  }

  const score = result.score;

  return (
    <div
      id="panel-score"
      className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Panel Header */}
      <div className="pb-2 border-b border-[var(--line)]">
        <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
          3. Compliance score
        </h2>
        <p className="text-xs text-[var(--ink-3)] mt-0.5">
          Based on Section 6 & 9 data minimisation rules
        </p>
      </div>

      {/* SVG Ring Gauge & Status Sentence */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="var(--surface-alt)"
              strokeWidth="10"
            />
            {/* Value Arc */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke={result.scoreColor}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 - (score / 100) * 2 * Math.PI * 44}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold tabular-nums text-[var(--ink)] tracking-tight">
              {score}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
              style={{
                color: result.scoreColor,
                backgroundColor: 'var(--surface-alt)'
              }}
            >
              {result.scoreBand}
            </span>
          </div>
        </div>

        <p className="text-xs font-medium text-[var(--ink)] text-center mt-3 max-w-[280px] leading-snug">
          {result.scoreStatusSentence}
        </p>
      </div>

      {/* How the score is calculated / Itemized deductions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--line)]">
        <span className="text-xs font-semibold text-[var(--ink)]">
          How the score is calculated:
        </span>
        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
          {result.scoreDeductions.map((deduction, idx) => {
            const isPos = deduction.delta > 0;
            return (
              <div
                key={idx}
                className="flex items-start gap-2 p-1.5 rounded-md text-xs bg-[var(--surface-alt)]/70 text-[var(--ink-2)]"
              >
                <div className="shrink-0 mt-0.5">
                  {isPos ? (
                    <span className="inline-flex items-center text-[var(--needed)] font-mono font-semibold">
                      <ArrowUpRight className="w-3 h-3 inline" />
                      +{deduction.delta}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[var(--excess)] font-mono font-semibold">
                      <ArrowDownRight className="w-3 h-3 inline" />
                      {deduction.delta}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight flex-1">
                  {deduction.reason}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 improvements */}
      {result.topImprovements.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--line)]">
          <span className="text-xs font-semibold text-[var(--ink)]">
            Top recommendations to improve:
          </span>
          <ul className="space-y-1 text-xs text-[var(--ink-2)]">
            {result.topImprovements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <Check className="w-3.5 h-3.5 text-[var(--needed)] shrink-0 mt-0.5" />
                <span className="text-[11px]">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legal Footnote */}
      <p className="text-[10px] text-[var(--ink-3)] leading-tight pt-2 border-t border-[var(--line)] flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        Draft rule-based score for this form. Not a formal legal assessment.
      </p>
    </div>
  );
};
