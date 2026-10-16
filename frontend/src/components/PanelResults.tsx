import React, { useState } from 'react';
import type { AuditedField, AuditResult, FieldCategory } from '../types/dpdp';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  HeartPulse,
  Baby,
  MinusCircle,
  ShieldAlert,
  ArrowUpDown,
  FilterX
} from 'lucide-react';

interface PanelResultsProps {
  result: AuditResult | null;
  selectedCategoryFilter?: FieldCategory | null;
  onSelectCategoryFilter?: (cat: FieldCategory | null) => void;
}

type FilterType = 'all' | 'personal' | 'non-personal' | 'necessary' | 'unnecessary';

export const PanelResults: React.FC<PanelResultsProps> = ({
  result,
  selectedCategoryFilter,
  onSelectCategoryFilter
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<'excess-first' | 'name-asc'>('excess-first');

  if (!result || result.fields.length === 0) {
    return (
      <div
        id="panel-results"
        className="bg-white rounded-[14px] border border-[var(--border)] p-8 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--text-3)] mb-3">
          <MinusCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[var(--text)] mb-1">
          Paste a form to begin audit
        </h3>
        <p className="text-sm text-[var(--text-2)] max-w-md leading-relaxed">
          Paste a form and choose Analyze form to see each field classified.
        </p>
      </div>
    );
  }

  // Filter fields
  let displayed = [...result.fields];

  if (selectedCategoryFilter) {
    displayed = displayed.filter((f) => f.category === selectedCategoryFilter);
  }

  if (activeFilter === 'personal') {
    displayed = displayed.filter((f) => f.isPersonalData);
  } else if (activeFilter === 'non-personal') {
    displayed = displayed.filter((f) => !f.isPersonalData);
  } else if (activeFilter === 'necessary') {
    displayed = displayed.filter((f) => f.needed);
  } else if (activeFilter === 'unnecessary') {
    displayed = displayed.filter((f) => !f.needed);
  }

  // Sorting
  if (sortOrder === 'excess-first') {
    // Unnecessary personal data first, then necessary personal data, then non-personal
    displayed.sort((a, b) => {
      const rank = (f: AuditedField) => (!f.needed ? 1 : f.isPersonalData ? 2 : 3);
      return rank(a) - rank(b);
    });
  } else {
    displayed.sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleTileClick = (type: FilterType) => {
    setActiveFilter(activeFilter === type ? 'all' : type);
  };

  return (
    <div
      id="panel-results"
      className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Header row with step badge 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[var(--blue-600)] text-white text-sm font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] leading-tight">
              Analysis results
            </h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              We analyzed {result.totalFields} fields for the purpose: “{result.purpose}”
            </p>
          </div>
        </div>

        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'excess-first' ? 'name-asc' : 'excess-first')}
          className="self-start sm:self-auto text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--surface-alt)] text-[var(--text-2)] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortOrder === 'excess-first' ? 'Excess first' : 'A-Z'}</span>
        </button>
      </div>

      {/* 4 Summary Tiles (88px tall, radius 12px, tinted bg + border per ui.md) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: Personal Data (Red tint) */}
        <button
          type="button"
          aria-pressed={activeFilter === 'personal'}
          onClick={() => handleTileClick('personal')}
          className={`h-[88px] p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            activeFilter === 'personal'
              ? 'ring-2 ring-[var(--personal-tx)] border-[var(--personal-tx)]'
              : 'hover:border-[var(--border-strong)]'
          }`}
          style={{
            backgroundColor: 'var(--personal-bg)',
            borderColor: 'var(--personal-bd)'
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-[var(--personal-bd)] flex items-center justify-center shrink-0 text-[var(--personal-tx)]">
            <User className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[26px] font-bold tabular-nums leading-none text-[var(--personal-tx)]">
              {result.personalDataCount}
            </div>
            <div className="text-xs font-semibold text-[var(--text)] mt-1 truncate">Personal data</div>
            <div className="text-[11px] text-[var(--text-3)] truncate">{result.personalPercent}% of fields</div>
          </div>
        </button>

        {/* Tile 2: Non-personal (Green tint) */}
        <button
          type="button"
          aria-pressed={activeFilter === 'non-personal'}
          onClick={() => handleTileClick('non-personal')}
          className={`h-[88px] p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            activeFilter === 'non-personal'
              ? 'ring-2 ring-[var(--nonpers-tx)] border-[var(--nonpers-tx)]'
              : 'hover:border-[var(--border-strong)]'
          }`}
          style={{
            backgroundColor: 'var(--nonpers-bg)',
            borderColor: 'var(--nonpers-bd)'
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-[var(--nonpers-bd)] flex items-center justify-center shrink-0 text-[var(--nonpers-tx)]">
            <MinusCircle className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[26px] font-bold tabular-nums leading-none text-[var(--nonpers-tx)]">
              {result.nonPersonalCount}
            </div>
            <div className="text-xs font-semibold text-[var(--text)] mt-1 truncate">Non-personal</div>
            <div className="text-[11px] text-[var(--text-3)] truncate">{result.nonPersonalPercent}% of fields</div>
          </div>
        </button>

        {/* Tile 3: Necessary (Blue tint) */}
        <button
          type="button"
          aria-pressed={activeFilter === 'necessary'}
          onClick={() => handleTileClick('necessary')}
          className={`h-[88px] p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            activeFilter === 'necessary'
              ? 'ring-2 ring-[var(--necessary-tx)] border-[var(--necessary-tx)]'
              : 'hover:border-[var(--border-strong)]'
          }`}
          style={{
            backgroundColor: 'var(--necessary-bg)',
            borderColor: 'var(--necessary-bd)'
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-[var(--necessary-bd)] flex items-center justify-center shrink-0 text-[var(--necessary-tx)]">
            <User className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[26px] font-bold tabular-nums leading-none text-[var(--necessary-tx)]">
              {result.necessaryCount}
            </div>
            <div className="text-xs font-semibold text-[var(--text)] mt-1 truncate">Necessary</div>
            <div className="text-[11px] text-[var(--text-3)] truncate">For this purpose</div>
          </div>
        </button>

        {/* Tile 4: Unnecessary (Orange tint) */}
        <button
          type="button"
          aria-pressed={activeFilter === 'unnecessary'}
          onClick={() => handleTileClick('unnecessary')}
          className={`h-[88px] p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
            activeFilter === 'unnecessary'
              ? 'ring-2 ring-[var(--unnecessary-tx)] border-[var(--unnecessary-tx)]'
              : 'hover:border-[var(--border-strong)]'
          }`}
          style={{
            backgroundColor: 'var(--unnecessary-bg)',
            borderColor: 'var(--unnecessary-bd)'
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-[var(--unnecessary-bd)] flex items-center justify-center shrink-0 text-[var(--unnecessary-tx)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-[26px] font-bold tabular-nums leading-none text-[var(--unnecessary-tx)]">
              {result.unnecessaryCount}
            </div>
            <div className="text-xs font-semibold text-[var(--text)] mt-1 truncate">Unnecessary</div>
            <div className="text-[11px] text-[var(--unnecessary-tx)] font-medium truncate">Consider removing</div>
          </div>
        </button>
      </div>

      {/* Active filter banner */}
      {(activeFilter !== 'all' || selectedCategoryFilter) && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] text-xs text-[var(--text-2)]">
          <div className="flex items-center gap-1.5">
            <span>Filter:</span>
            <span className="font-bold capitalize text-[var(--text)]">
              {activeFilter !== 'all' ? activeFilter : `Category (${selectedCategoryFilter})`}
            </span>
            <span>({displayed.length} of {result.fields.length} rows)</span>
          </div>
          <button
            onClick={() => {
              setActiveFilter('all');
              if (onSelectCategoryFilter) onSelectCategoryFilter(null);
            }}
            className="text-[var(--blue-600)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            Show all
          </button>
        </div>
      )}

      {/* Fields Table (Desktop) */}
      <div className="hidden sm:block overflow-x-auto max-h-[520px] rounded-lg border border-[var(--border)] overflow-y-auto">
        <table className="w-full text-left border-collapse" aria-label="Fields table">
          <thead className="sticky top-0 z-10 bg-[var(--surface-alt)] border-b border-[var(--border)] text-[13px] font-semibold text-[var(--text)]">
            <tr>
              <th scope="col" className="py-2.5 px-3 w-[24%]">Field</th>
              <th scope="col" className="py-2.5 px-3 w-[20%]">Category</th>
              <th scope="col" className="py-2.5 px-3 w-[14%]">Personal data?</th>
              <th scope="col" className="py-2.5 px-3 w-[14%]">Needed?</th>
              <th scope="col" className="py-2.5 px-3 w-[28%]">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-xs">
            {displayed.map((f) => {
              const isExcess = !f.needed;
              const catIcon = getCategoryIcon(f.category);

              return (
                <tr
                  key={f.id}
                  className={`min-h-[52px] transition-colors hover:bg-[var(--surface-alt)] ${
                    isExcess ? 'excess-row' : ''
                  }`}
                >
                  {/* Field: raw name in mono + detected label */}
                  <td className="py-3 px-3 align-top">
                    <span
                      title={`Matched by: ${f.matchedBy.join(', ')}`}
                      className={`font-mono text-[13px] font-semibold text-[var(--text)] block cursor-help ${
                        isExcess ? 'redline-wavy' : ''
                      }`}
                    >
                      {f.name}
                    </span>
                    <span className="text-[12px] text-[var(--text-3)] block mt-0.5">
                      {f.label}
                    </span>
                  </td>

                  {/* Category: icon + name + (Sensitive) in red */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0">{catIcon}</span>
                      <span className="font-medium text-[var(--text)]">{f.categoryLabel}</span>
                      {f.sensitive && (
                        <span className="text-[11px] font-bold text-[var(--personal-tx)]">
                          (Sensitive)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Personal data? Yes (red tint) / No (grey) */}
                  <td className="py-3 px-3 align-top">
                    {f.isPersonalData ? (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: 'var(--yes-bg)',
                          color: 'var(--yes-tx)'
                        }}
                      >
                        Yes
                      </span>
                    ) : (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: 'var(--na-bg)',
                          color: 'var(--na-tx)'
                        }}
                      >
                        No
                      </span>
                    )}
                  </td>

                  {/* Needed? Yes (green) / No (red) */}
                  <td className="py-3 px-3 align-top">
                    {f.needed ? (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: 'var(--ok-bg)',
                          color: 'var(--ok-tx)'
                        }}
                      >
                        Yes
                      </span>
                    ) : (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: 'var(--no-bg)',
                          color: 'var(--no-tx)'
                        }}
                      >
                        No
                      </span>
                    )}
                  </td>

                  {/* Reason */}
                  <td className="py-3 px-3 align-top text-xs text-[var(--text-2)] leading-relaxed">
                    {f.reason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fields Cards (Mobile < 640px) */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {displayed.map((f) => {
          const isExcess = !f.needed;
          const catIcon = getCategoryIcon(f.category);

          return (
            <div
              key={f.id}
              className={`p-3 rounded-xl border ${
                isExcess ? 'excess-row border-[var(--personal-bd)]' : 'border-[var(--border)] bg-white'
              }`}
            >
              {/* Line 1: Field name + pills */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span
                    className={`font-mono text-xs font-bold text-[var(--text)] ${
                      isExcess ? 'redline-wavy' : ''
                    }`}
                  >
                    {f.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-3)] block">{f.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: f.isPersonalData ? 'var(--yes-bg)' : 'var(--na-bg)',
                      color: f.isPersonalData ? 'var(--yes-tx)' : 'var(--na-tx)'
                    }}
                  >
                    Personal: {f.isPersonalData ? 'Yes' : 'No'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: f.needed ? 'var(--ok-bg)' : 'var(--no-bg)',
                      color: f.needed ? 'var(--ok-tx)' : 'var(--no-tx)'
                    }}
                  >
                    Needed: {f.needed ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Line 2: Category */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-2)] mb-1.5">
                {catIcon}
                <span>{f.categoryLabel}</span>
                {f.sensitive && (
                  <span className="text-[10px] font-bold text-[var(--personal-tx)]">
                    (Sensitive)
                  </span>
                )}
              </div>

              {/* Line 3: Reason */}
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                {f.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getCategoryIcon(cat: FieldCategory) {
  switch (cat) {
    case 'identity':
      return <User className="w-3.5 h-3.5 text-[#1F4FE0]" />;
    case 'contact':
      return <Phone className="w-3.5 h-3.5 text-[#0F7A4F]" />;
    case 'location':
      return <MapPin className="w-3.5 h-3.5 text-[#9A6200]" />;
    case 'financial':
      return <CreditCard className="w-3.5 h-3.5 text-[#5B3FE0]" />;
    case 'health':
      return <HeartPulse className="w-3.5 h-3.5 text-[#C0264F]" />;
    case 'children':
      return <Baby className="w-3.5 h-3.5 text-[#B3261E]" />;
    default:
      return <MinusCircle className="w-3.5 h-3.5 text-[#0F7A4F]" />;
  }
}
