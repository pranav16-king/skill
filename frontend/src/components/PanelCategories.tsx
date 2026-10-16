import React from 'react';
import type { AuditResult, FieldCategory } from '../types/dpdp';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  HeartPulse,
  Baby,
  MinusCircle,
  ShieldAlert
} from 'lucide-react';

interface PanelCategoriesProps {
  result: AuditResult | null;
  selectedCategory: FieldCategory | null;
  onSelectCategory: (cat: FieldCategory | null) => void;
}

interface CategoryCardDef {
  key: FieldCategory;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  sensitive: boolean;
  color: string;
  bg: string;
}

const CATEGORY_DEFS: CategoryCardDef[] = [
  {
    key: 'identity',
    title: 'Identity',
    desc: 'Name, DOB, personal identifiers',
    icon: User,
    sensitive: false,
    color: '#4B2E91',
    bg: '#EFE9FB'
  },
  {
    key: 'contact',
    title: 'Contact',
    desc: 'Email address, phone numbers',
    icon: Phone,
    sensitive: false,
    color: '#0B5F7A',
    bg: '#E0F2F8'
  },
  {
    key: 'location',
    title: 'Location',
    desc: 'Physical address, PIN codes',
    icon: MapPin,
    sensitive: false,
    color: '#3F6212',
    bg: '#EAF3D9'
  },
  {
    key: 'financial',
    title: 'Financial',
    desc: 'Bank accounts, income, cards',
    icon: CreditCard,
    sensitive: true,
    color: '#7A3B00',
    bg: '#FBEBD3'
  },
  {
    key: 'health',
    title: 'Health',
    desc: 'Medical details, dietary, disability',
    icon: HeartPulse,
    sensitive: true,
    color: '#9D174D',
    bg: '#FCE7F0'
  },
  {
    key: 'children',
    title: "Children's data",
    desc: 'Minors, students under 18',
    icon: Baby,
    sensitive: true,
    color: '#9A3412',
    bg: '#FDE8D8'
  },
  {
    key: 'not_personal',
    title: 'Non-personal',
    desc: 'CSRF tokens, security values',
    icon: MinusCircle,
    sensitive: false,
    color: '#5A6780',
    bg: '#EAEEF4'
  }
];

export const PanelCategories: React.FC<PanelCategoriesProps> = ({
  result,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div
      id="panel-categories"
      className="bg-white rounded-xl border border-[var(--line)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            4. Data categories
          </h2>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Classified per statutory DPDP personal data domains. Click to filter.
          </p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-[var(--primary)] hover:underline font-medium cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* 7 Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {CATEGORY_DEFS.map((cat) => {
          const Icon = cat.icon;
          const count = result?.categoryCounts[cat.key] || 0;
          const isSelected = selectedCategory === cat.key;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.key)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] shadow-sm'
                  : 'border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-xs'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--primary-tint)' : 'var(--surface)'
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {cat.sensitive && (
                    <span
                      title="Sensitive personal data under DPDP standards"
                      className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800"
                    >
                      <ShieldAlert className="w-2.5 h-2.5" />
                      Risk
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-[var(--ink)] block truncate">
                  {cat.title}
                </span>
                <span className="text-[10px] text-[var(--ink-3)] block line-clamp-1 mt-0.5">
                  {cat.desc}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[var(--ink-3)]">Found:</span>
                <span
                  className="font-bold tabular-nums text-sm"
                  style={{ color: count > 0 ? cat.color : 'var(--ink-3)' }}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
