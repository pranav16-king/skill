import React from 'react';
import type { AuditResult, NoticeLanguage } from '../types/dpdp';
import { generateConsentNotice } from '../engine/noticeGenerator';

interface PrintReportProps {
  result: AuditResult | null;
  language: NoticeLanguage;
}

export const PrintReport: React.FC<PrintReportProps> = ({ result, language }) => {
  if (!result) return null;

  const notice = generateConsentNotice(result, language);
  const now = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="hidden print-only print-container p-6 bg-white text-black font-sans">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide">
            DPDP Form Compliance Audit Report
          </h1>
          <p className="text-sm text-gray-700 mt-1">
            Statutory assessment under Digital Personal Data Protection Act, 2023
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Generated locally in-browser · Verification date: {now}
          </p>
        </div>
        <div className="text-right border border-black p-2.5 rounded">
          <div className="text-xs font-semibold uppercase text-gray-600">Compliance Score</div>
          <div className="text-2xl font-bold">{result.score} / 100</div>
          <div className="text-xs font-semibold">{result.scoreBand}</div>
        </div>
      </div>

      {/* Overview Block */}
      <div className="mb-6 bg-gray-50 border border-gray-300 p-3.5 rounded text-xs space-y-1">
        <div>
          <span className="font-bold">Form Purpose Stated:</span> {result.purpose}
        </div>
        <div>
          <span className="font-bold">Evaluation Summary:</span> {result.totalFields} total fields analyzed ({result.personalDataCount} personal data, {result.necessaryCount} necessary, {result.unnecessaryCount} excess, {result.reviewCount} review).
        </div>
        <div>
          <span className="font-bold">Key Recommendation:</span> {result.scoreStatusSentence}
        </div>
      </div>

      {/* Field Breakdown Table */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">
          1. Field Itemization & Necessity Findings
        </h2>
        <table className="w-full text-xs border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-left">
              <th className="p-2 border-r border-gray-300">Field Name</th>
              <th className="p-2 border-r border-gray-300">Category</th>
              <th className="p-2 border-r border-gray-300">Classification</th>
              <th className="p-2 border-r border-gray-300">Verdict</th>
              <th className="p-2">Reason & Matched Hint</th>
            </tr>
          </thead>
          <tbody>
            {result.fields.map((f) => (
              <tr key={f.id} className="border-b border-gray-200">
                <td className="p-2 font-mono font-bold border-r border-gray-300">
                  {f.name}
                </td>
                <td className="p-2 border-r border-gray-300">
                  {f.categoryLabel} {f.sensitive ? '(Sensitive)' : ''}
                </td>
                <td className="p-2 border-r border-gray-300">
                  {f.isPersonalData ? 'Personal' : 'Non-Personal'}
                </td>
                <td className="p-2 font-bold border-r border-gray-300">
                  [{f.verdict.toUpperCase()}]
                </td>
                <td className="p-2">
                  <div>{f.reason}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Signals: {f.matchedBy.join(', ')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score Deductions */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">
          2. Score Calculation Breakdown
        </h2>
        <div className="space-y-1 text-xs">
          {result.scoreDeductions.map((d, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono font-bold w-12 text-right">
                {d.delta > 0 ? `+${d.delta}` : d.delta}
              </span>
              <span>{d.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Draft Consent Notice */}
      <div className="mb-8 page-break">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">
          3. Draft Statutory Consent Notice ({language.toUpperCase()})
        </h2>
        <div className="border border-gray-300 p-4 rounded text-xs space-y-3 leading-relaxed">
          <div className="font-bold underline">{notice.headline}</div>
          <div>
            <div className="font-bold">{notice.collectTitle}</div>
            <ul className="list-disc pl-5">
              {notice.collectItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold">{notice.purposeTitle}</div>
            <p>{notice.purposeText}</p>
          </div>
          <div>
            <div className="font-bold">{notice.withdrawTitle}</div>
            <p>{notice.withdrawText}</p>
          </div>
          <div>
            <div className="font-bold">{notice.retentionTitle}</div>
            <p>{notice.retentionText}</p>
          </div>
          <div>
            <div className="font-bold">{notice.grievanceTitle}</div>
            <p>{notice.grievanceText}</p>
          </div>
          {notice.childrenNotice && (
            <div className="border border-gray-400 p-2 font-medium">
              {notice.childrenNotice}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[11px] text-gray-600 border-t border-gray-400 pt-3">
        <strong>LEGAL DISCLAIMER:</strong> Draft output for guidance only. This document is not formal legal advice. Compliance decisions must be reviewed by qualified legal counsel in accordance with the Digital Personal Data Protection Act (DPDP), 2023.
      </div>
    </div>
  );
};
