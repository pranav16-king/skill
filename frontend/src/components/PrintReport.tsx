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

  return (
    <div className="hidden print-only print-container p-6 bg-white text-black font-sans leading-relaxed">
      {/* Title & Header */}
      <div className="border-b-2 border-black pb-4 mb-5 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            DPDP Form Compliance Audit Report
          </h1>
          <p className="text-sm text-gray-700 mt-1">
            Section 6 & 9 Data Minimisation Assessment
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            100% private in-browser analysis · Generated locally
          </p>
        </div>
        <div className="text-right border-2 border-black p-3 rounded-lg min-w-[120px]">
          <div className="text-xs font-bold uppercase text-gray-600">Compliance Score</div>
          <div className="text-3xl font-extrabold">{result.score} / 100</div>
          <div className="text-xs font-bold">{result.scoreBand}</div>
        </div>
      </div>

      {/* Purpose & Summary Tiles as text */}
      <div className="mb-6 p-4 border border-gray-300 bg-gray-50 rounded-lg text-xs space-y-1.5">
        <div>
          <span className="font-bold">Form Purpose Stated:</span> “{result.purpose}”
        </div>
        <div>
          <span className="font-bold">Summary Metrics:</span> {result.totalFields} total fields | {result.personalDataCount} personal data ({result.personalPercent}%) | {result.nonPersonalCount} non-personal ({result.nonPersonalPercent}%) | {result.necessaryCount} necessary | {result.unnecessaryCount} unnecessary (excess).
        </div>
        <div>
          <span className="font-bold">Assessment:</span> {result.scoreStatusSentence}
        </div>
      </div>

      {/* Fields Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">
          1. Field Itemization & Findings
        </h2>
        <table className="w-full text-xs border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-left">
              <th className="p-2 border-r border-gray-300 w-[24%]">Field</th>
              <th className="p-2 border-r border-gray-300 w-[20%]">Category</th>
              <th className="p-2 border-r border-gray-300 w-[14%]">Personal Data?</th>
              <th className="p-2 border-r border-gray-300 w-[14%]">Needed?</th>
              <th className="p-2 w-[28%]">Reason</th>
            </tr>
          </thead>
          <tbody>
            {result.fields.map((f) => (
              <tr key={f.id} className="border-b border-gray-200">
                <td className="p-2 font-mono font-bold border-r border-gray-300">
                  {f.name}
                  <span className="font-sans font-normal text-gray-600 block text-[11px] mt-0.5">
                    {f.label}
                  </span>
                </td>
                <td className="p-2 border-r border-gray-300">
                  {f.categoryLabel} {f.sensitive ? '(Sensitive)' : ''}
                </td>
                <td className="p-2 border-r border-gray-300 font-bold">
                  {f.isPersonalData ? 'Yes' : 'No'}
                </td>
                <td className="p-2 border-r border-gray-300 font-bold">
                  {f.needed ? 'Yes' : 'No (Excess)'}
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

      {/* Score Calculation */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">
          2. Score Calculation Breakdown
        </h2>
        <div className="text-xs space-y-1">
          <div className="flex justify-between w-64 border-b pb-0.5 font-bold">
            <span>Base score</span>
            <span>100</span>
          </div>
          {(result.scoreItems || []).map((item, idx) => (
            <div key={idx} className="flex justify-between w-64">
              <span>{item.description}</span>
              <span className="font-mono font-bold">
                {item.delta > 0 ? `+${item.delta}` : item.delta}
              </span>
            </div>
          ))}
          <div className="flex justify-between w-64 border-t pt-0.5 font-bold text-sm">
            <span>Total score</span>
            <span>{result.score} / 100</span>
          </div>
        </div>
      </div>

      {/* Draft Consent Notice */}
      <div className="mb-6 page-break">
        <h2 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">
          3. Draft Consent Notice ({language.toUpperCase()})
        </h2>
        <div className="border border-gray-300 p-4 rounded-lg text-xs space-y-3 leading-relaxed">
          <h3 className="font-bold text-sm">{notice.headline}</h3>
          <p>
            {notice.paragraph1.prefix}
            <strong>{notice.paragraph1.collectedData}</strong>
            {notice.paragraph1.mid}
            {notice.paragraph1.purposePhrase}
            {notice.paragraph1.suffix}
          </p>
          <p>{notice.paragraph2}</p>
          {notice.childrenNotice && (
            <p className="font-semibold text-gray-800">{notice.childrenNotice}</p>
          )}
          <p className="italic text-gray-600 pt-2 border-t">{notice.footerNote}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t-2 border-black pt-3 text-[11px] text-gray-600">
        <strong>Draft notice for guidance. Not legal advice. Review before publishing.</strong> Generated locally via the DPDP Form Auditor in-browser compliance engine.
      </div>
    </div>
  );
};
