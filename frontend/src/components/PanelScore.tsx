import React from 'react';
import type { AuditResult } from '../types/dpdp';
import { Award, Check, X, AlertTriangle } from 'lucide-react';

interface PanelScoreProps {
  result: AuditResult | null;
}

export const PanelScore: React.FC<PanelScoreProps> = ({ result }) => {
  if (!result) {
    return (
      <div
        id="panel-score"
        className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <Award className="w-8 h-8 text-[var(--text-3)] mb-2" />
        <h3 className="text-sm font-bold text-[var(--text)]">Compliance score</h3>
        <p className="text-xs text-[var(--text-2)] mt-1">
          Paste a form to view your compliance score and itemized deductions.
        </p>
      </div>
    );
  }

  const score = result.score;
  const radius = 62;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      id="panel-score"
      className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Title Row with step badge 3 */}
      <div className="flex items-center gap-2.5 pb-1">
        <div className="w-7 h-7 rounded-full bg-[var(--blue-600)] text-white text-sm font-bold flex items-center justify-center shrink-0">
          3
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">Compliance score</h2>
      </div>

      {/* Ring Gauge (160px circle) */}
      <div className="flex flex-col items-center justify-center pt-1">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#E8ECF4"
              strokeWidth={strokeWidth}
            />
            {/* Value Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={result.scoreColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centre Text: score 48/800 and /100 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[44px] font-extrabold tabular-nums text-[var(--text)] leading-none tracking-tight">
              {score}
            </span>
            <span className="text-xs text-[var(--text-3)] font-semibold mt-1">
              / 100
            </span>
          </div>
        </div>
      </div>

      {/* Status Card (Coloured heading with icon + one sentence) */}
      <div
        className="p-3 rounded-xl border text-xs leading-relaxed"
        style={{
          backgroundColor:
            result.scoreBand === 'Good'
              ? 'var(--nonpers-bg)'
              : result.scoreBand === 'Fair'
              ? 'var(--necessary-bg)'
              : result.scoreBand === 'Needs improvement'
              ? 'var(--unnecessary-bg)'
              : 'var(--personal-bg)',
          borderColor:
            result.scoreBand === 'Good'
              ? 'var(--nonpers-bd)'
              : result.scoreBand === 'Fair'
              ? 'var(--necessary-bd)'
              : result.scoreBand === 'Needs improvement'
              ? 'var(--unnecessary-bd)'
              : 'var(--personal-bd)'
        }}
      >
        <div
          className="font-bold text-sm flex items-center gap-1.5 mb-1"
          style={{ color: result.scoreColor }}
        >
          {result.scoreBand === 'Good' ? (
            <Check className="w-4 h-4" />
          ) : result.scoreBand === 'Needs improvement' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>{result.scoreBand}</span>
        </div>
        <p className="text-[var(--text)] font-medium leading-normal">
          {result.scoreStatusSentence}
        </p>
      </div>

      {/* "How the score is calculated?" block (Light blue box) */}
      <div className="p-3.5 rounded-xl bg-[var(--necessary-bg)] border border-[var(--necessary-bd)] flex flex-col gap-2.5">
        <span className="text-xs font-bold text-[var(--text)]">
          How the score is calculated?
        </span>

        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 text-xs">
          <div className="flex items-center justify-between text-[var(--text-2)] font-medium pb-1 border-b border-[var(--necessary-bd)]">
            <span>Starting base score</span>
            <span className="font-mono font-bold text-[var(--text)]">100</span>
          </div>

          {(result.scoreItems || []).map((item, idx) => {
            const isZero = item.delta === 0;
            const isNegative = item.delta < 0;

            return (
              <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                <div className="flex items-start gap-1.5 flex-1">
                  {item.iconType === 'tick' ? (
                    <Check className="w-3.5 h-3.5 text-[#0F7A4F] shrink-0 mt-0.5" />
                  ) : item.iconType === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-[var(--personal-tx)] shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] text-[var(--text-2)] leading-tight">
                    {item.description}
                  </span>
                </div>
                <span
                  className={`font-mono font-bold text-[11px] shrink-0 ${
                    isZero
                      ? 'text-[#0F7A4F]'
                      : isNegative
                      ? 'text-[var(--personal-tx)]'
                      : 'text-[var(--text)]'
                  }`}
                >
                  {isZero ? '0' : `${item.delta}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider and Total Score */}
        <div className="pt-2 border-t border-[var(--necessary-bd)] flex items-center justify-between text-xs font-bold text-[var(--text)]">
          <span>Total score</span>
          <span className="text-sm font-mono text-[var(--blue-600)]">
            {score} / 100
          </span>
        </div>
      </div>
    </div>
  );
};
