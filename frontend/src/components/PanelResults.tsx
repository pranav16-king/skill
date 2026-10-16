import React, { useState } from 'react';
import type { AuditedField, AuditResult, FieldCategory } from '../types/dpdp';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MinusCircle,
  ShieldAlert,
  ArrowUpDown,
  Layers,
  List,
  FilterX
} from 'lucide-react';

interface PanelResultsProps {
  result: AuditResult | null;
  onSelectCategoryFilter?: (cat: FieldCategory | null) => void;
  selectedCategoryFilter?: FieldCategory | null;
}

type FilterType = 'all' | 'personal' | 'non-personal' | 'necessary' | 'unnecessary' | 'review';

export const PanelResults: React.FC<PanelResultsProps> = ({
  result,
  onSelectCategoryFilter,
  selectedCategoryFilter
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [sortOrder, setSortOrder] = useState<'excess-first' | 'alpha'>('excess-first');

  if (!result || result.fields.length === 0) {
    return (
      <div
        id="panel-results"
        className="bg-white rounded-xl border border-[var(--line)] p-8 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--surface-alt)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-3)] mb-3">
          <List className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--ink)] mb-1">
          Paste a form to begin audit
        </h3>
        <p className="text-sm text-[var(--ink-3)] max-w-md leading-relaxed">
          We identify each field, group it into standard DPDP categories, evaluate necessity against your purpose, and redline excess collection.
        </p>
      </div>
    );
  }

  // Filter fields based on activeFilter and category filter
  let displayedFields = [...result.fields];

  if (selectedCategoryFilter) {
    displayedFields = displayedFields.filter((f) => f.category === selectedCategoryFilter);
  }

  if (activeFilter === 'personal') {
    displayedFields = displayedFields.filter((f) => f.isPersonalData);
  } else if (activeFilter === 'non-personal') {
    displayedFields = displayedFields.filter((f) => !f.isPersonalData);
  } else if (activeFilter === 'necessary') {
    displayedFields = displayedFields.filter((f) => f.verdict === 'needed');
  } else if (activeFilter === 'unnecessary') {
    displayedFields = displayedFields.filter((f) => f.verdict === 'excess');
  } else if (activeFilter === 'review') {
    displayedFields = displayedFields.filter((f) => f.verdict === 'review');
  }

  // Sorting
  if (sortOrder === 'excess-first') {
    const priority: Record<string, number> = {
      excess: 1,
      review: 2,
      needed: 3,
      'not-personal': 4
    };
    displayedFields.sort((a, b) => (priority[a.verdict] || 5) - (priority[b.verdict] || 5));
  } else {
    displayedFields.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Group by category if requested
  const groupedFields: Record<string, AuditedField[]> = {};
  if (groupByCategory) {
    displayedFields.forEach((field) => {
      const cat = field.categoryLabel;
      if (!groupedFields[cat]) groupedFields[cat] = [];
      groupedFields[cat].push(field);
    });
  }

  // Category styles dictionary
  const getCategoryStyle = (cat: FieldCategory) => {
    switch (cat) {
      case 'identity':
        return { color: '#4B2E91', bg: '#EFE9FB' };
      case 'contact':
        return { color: '#0B5F7A', bg: '#E0F2F8' };
      case 'gov_id':
        return { color: '#8A2D0B', bg: '#FBE9DF' };
      case 'financial':
        return { color: '#7A3B00', bg: '#FBEBD3' };
      case 'health':
        return { color: '#9D174D', bg: '#FCE7F0' };
      case 'location':
        return { color: '#3F6212', bg: '#EAF3D9' };
      case 'children':
        return { color: '#9A3412', bg: '#FDE8D8' };
      case 'demographic':
        return { color: '#1E4E8C', bg: '#E3EDFA' };
      case 'credentials':
        return { color: '#374151', bg: '#E9ECF1' };
      default:
        return { color: '#5A6780', bg: '#EAEEF4' };
    }
  };

  return (
    <div
      id="panel-results"
      className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            2. Analysis results
          </h2>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Audit breakdown for: <span className="font-semibold text-[var(--ink)]">"{result.purpose}"</span>
          </p>
        </div>

        {/* View and sort controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              groupByCategory
                ? 'bg-[var(--primary-tint)] border-[var(--primary)] text-[var(--primary)] font-medium'
                : 'bg-white border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--surface-alt)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{groupByCategory ? 'Grouped' : 'Flat list'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'excess-first' ? 'alpha' : 'excess-first')}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-alt)] text-[var(--ink-2)] flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'excess-first' ? 'Excess first' : 'A-Z'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary interactive count tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Personal data */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'personal' ? 'all' : 'personal')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'personal'
              ? 'border-[#2B3A9E] bg-[#EEF2FC] ring-2 ring-[#2B3A9E]/20'
              : 'border-[var(--line)] bg-[var(--surface-alt)] hover:border-[var(--line-strong)]'
          }`}
        >
          <span className="text-[11px] font-medium text-[var(--ink-3)] block">Personal data</span>
          <div className="text-xl font-bold text-[#1E4E8C] tabular-nums mt-0.5">
            {result.personalDataCount}
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">fields identified</span>
        </button>

        {/* Non-personal */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'non-personal' ? 'all' : 'non-personal')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'non-personal'
              ? 'border-[var(--neutral)] bg-[#E2E6EE] ring-2 ring-[var(--neutral)]/20'
              : 'border-[var(--line)] bg-[var(--surface-alt)] hover:border-[var(--line-strong)]'
          }`}
        >
          <span className="text-[11px] font-medium text-[var(--ink-3)] block">Non-personal</span>
          <div className="text-xl font-bold text-[var(--neutral)] tabular-nums mt-0.5">
            {result.nonPersonalCount}
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">technical / system</span>
        </button>

        {/* Necessary */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'necessary' ? 'all' : 'necessary')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'necessary'
              ? 'border-[var(--needed)] bg-[var(--needed-bg)] ring-2 ring-[var(--needed)]/20'
              : 'border-[var(--line)] bg-[var(--surface-alt)] hover:border-[var(--line-strong)]'
          }`}
        >
          <span className="text-[11px] font-medium text-[var(--needed)] block">Necessary</span>
          <div className="text-xl font-bold text-[var(--needed)] tabular-nums mt-0.5">
            {result.necessaryCount}
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">needed for purpose</span>
        </button>

        {/* Unnecessary / Excess */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'unnecessary' ? 'all' : 'unnecessary')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'unnecessary'
              ? 'border-[var(--excess)] bg-[var(--excess-bg)] ring-2 ring-[var(--excess)]/20'
              : 'border-[var(--line)] bg-[var(--surface-alt)] hover:border-[var(--line-strong)]'
          }`}
        >
          <span className="text-[11px] font-medium text-[var(--excess)] block">Unnecessary</span>
          <div className="text-xl font-bold text-[var(--excess)] tabular-nums mt-0.5">
            {result.unnecessaryCount}
          </div>
          <span className="text-[10px] text-[var(--excess)] font-medium">redline excess</span>
        </button>
      </div>

      {/* Active Filter indicator */}
      {(activeFilter !== 'all' || selectedCategoryFilter) && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] text-xs text-[var(--ink-2)]">
          <div className="flex items-center gap-1.5">
            <span>Filtering by:</span>
            {activeFilter !== 'all' && (
              <span className="font-semibold capitalize text-[var(--ink)]">
                {activeFilter}
              </span>
            )}
            {selectedCategoryFilter && (
              <span className="font-semibold text-[var(--ink)]">
                Category ({selectedCategoryFilter})
              </span>
            )}
            <span>({displayedFields.length} of {result.fields.length} fields)</span>
          </div>
          <button
            onClick={() => {
              setActiveFilter('all');
              if (onSelectCategoryFilter) onSelectCategoryFilter(null);
            }}
            className="text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <FilterX className="w-3.5 h-3.5" />
            Show all
          </button>
        </div>
      )}

      {/* Results Table (Desktop) */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-[var(--line)]">
        <table className="w-full text-left border-collapse" aria-label="Fields found in your form and whether each is needed">
          <thead className="bg-[var(--surface-alt)] border-b border-[var(--line)] text-xs font-semibold text-[var(--ink)]">
            <tr>
              <th scope="col" className="py-2.5 px-3 w-[22%]">Field</th>
              <th scope="col" className="py-2.5 px-3 w-[18%]">Category</th>
              <th scope="col" className="py-2.5 px-3 w-[14%]">Personal?</th>
              <th scope="col" className="py-2.5 px-3 w-[14%]">Needed?</th>
              <th scope="col" className="py-2.5 px-3 w-[32%]">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-xs">
            {groupByCategory
              ? Object.entries(groupedFields).map(([catName, fields]) => (
                  <React.Fragment key={catName}>
                    <tr className="bg-[var(--surface-alt)]/60">
                      <td colSpan={5} className="py-1.5 px-3 font-semibold text-[var(--ink-2)] text-[11px]">
                        {catName} ({fields.length})
                      </td>
                    </tr>
                    {fields.map((f) => renderTableRow(f, getCategoryStyle))}
                  </React.Fragment>
                ))
              : displayedFields.map((f) => renderTableRow(f, getCategoryStyle))}
          </tbody>
        </table>
      </div>

      {/* Results Cards (Mobile) */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {displayedFields.map((field) => {
          const isExcess = field.verdict === 'excess';
          const isReview = field.verdict === 'review';
          const catStyle = getCategoryStyle(field.category);

          return (
            <div
              key={field.id}
              className={`p-3 rounded-lg border ${
                isExcess
                  ? 'excess-row border-[var(--excess)]'
                  : isReview
                  ? 'review-row border-[var(--review)] bg-white'
                  : 'border-[var(--line)] bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`font-mono font-semibold text-xs text-[var(--ink)] ${
                    isExcess ? 'redline-wavy' : ''
                  }`}
                >
                  {field.name}
                </span>
                {renderVerdictBadge(field.verdict)}
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                >
                  {field.categoryLabel}
                  {field.sensitive && (
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                  )}
                </span>
                <span className="text-[10px] text-[var(--ink-3)]">
                  {field.isPersonalData ? 'Personal Data' : 'Non-personal'}
                </span>
              </div>

              <p className="text-xs text-[var(--ink-2)] leading-relaxed mb-1.5">
                {field.reason}
              </p>

              <div className="text-[10px] text-[var(--ink-3)] font-mono">
                Matched by: {field.matchedBy.join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Render Desktop Table Row
function renderTableRow(
  field: AuditedField,
  getCategoryStyle: (cat: FieldCategory) => { color: string; bg: string }
) {
  const isExcess = field.verdict === 'excess';
  const isReview = field.verdict === 'review';
  const catStyle = getCategoryStyle(field.category);

  return (
    <tr
      key={field.id}
      className={`transition-colors hover:bg-[var(--surface-alt)] ${
        isExcess ? 'excess-row' : isReview ? 'review-row' : ''
      }`}
    >
      {/* Field identifier and detected label */}
      <td className="py-3 px-3 align-top">
        <span
          className={`font-mono font-semibold text-[13px] text-[var(--ink)] block ${
            isExcess ? 'redline-wavy' : ''
          }`}
        >
          {field.name}
        </span>
        <span className="text-[11px] text-[var(--ink-3)] block mt-0.5">
          {field.label && field.label !== field.name ? `${field.label} · ` : ''}
          type: {field.type}
        </span>
      </td>

      {/* Category */}
      <td className="py-3 px-3 align-top">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
        >
          <span>{field.categoryLabel}</span>
          {field.sensitive && (
            <span title="Sensitive personal data under DPDP standards">
              <ShieldAlert className="w-3 h-3 text-amber-700 shrink-0" />
            </span>
          )}
        </span>
      </td>

      {/* Personal data? */}
      <td className="py-3 px-3 align-top">
        {field.isPersonalData ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink-3)]">
            <MinusCircle className="w-3 h-3" />
            No
          </span>
        )}
      </td>

      {/* Needed? Verdict */}
      <td className="py-3 px-3 align-top">{renderVerdictBadge(field.verdict)}</td>

      {/* Reason & Matched by */}
      <td className="py-3 px-3 align-top">
        <p className="text-xs text-[var(--ink)] leading-snug">{field.reason}</p>
        <span className="text-[10px] text-[var(--ink-3)] font-mono block mt-1">
          Matched by: {field.matchedBy.join(', ')}
        </span>
      </td>
    </tr>
  );
}

// Verdict Badge helper
function renderVerdictBadge(verdict: string) {
  switch (verdict) {
    case 'needed':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: 'var(--needed-bg)', color: 'var(--needed)' }}
        >
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          Needed
        </span>
      );
    case 'excess':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: 'var(--excess-bg)', color: 'var(--excess)' }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Excess
        </span>
      );
    case 'review':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: 'var(--review-bg)', color: 'var(--review)' }}
        >
          <HelpCircle className="w-3 h-3 shrink-0" />
          Review
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: 'var(--neutral-bg)', color: 'var(--neutral)' }}
        >
          <MinusCircle className="w-3 h-3 shrink-0" />
          Not personal
        </span>
      );
  }
}
