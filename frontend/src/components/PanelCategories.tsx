import React from 'react';
import type { AuditResult, FieldCategory } from '../types/dpdp';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  HeartPulse,
  Baby,
  MinusCircle
} from 'lucide-react';

interface PanelCategoriesProps {
  result: AuditResult | null;
  selectedCategory: FieldCategory | null;
  onSelectCategory: (cat: FieldCategory | null) => void;
}

interface CategoryCardDef {
  key: FieldCategory;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  borderColor: string;
}

// Order strictly per ui.md: Identity, Contact, Location, Financial, Health, Children's data, Non-personal
const CATEGORY_DEFS: CategoryCardDef[] = [
  {
    key: 'identity',
    title: 'Identity',
    icon: User,
    color: '#1F4FE0',
    bg: '#E8F0FE',
    borderColor: '#BCD0F8'
  },
  {
    key: 'contact',
    title: 'Contact',
    icon: Phone,
    color: '#0F7A4F',
    bg: '#E3F4EB',
    borderColor: '#B7E2CA'
  },
  {
    key: 'location',
    title: 'Location',
    icon: MapPin,
    color: '#9A6200',
    bg: '#FFF4DB',
    borderColor: '#F8E0B0'
  },
  {
    key: 'financial',
    title: 'Financial',
    icon: CreditCard,
    color: '#5B3FE0',
    bg: '#EEE9FD',
    borderColor: '#D4C7F9'
  },
  {
    key: 'health',
    title: 'Health',
    icon: HeartPulse,
    color: '#C0264F',
    bg: '#FDE9EE',
    borderColor: '#F8BCCD'
  },
  {
    key: 'children',
    title: "Children's data",
    icon: Baby,
    color: '#B3261E',
    bg: '#FDECEC',
    borderColor: '#F5C2C2'
  },
  {
    key: 'non_personal',
    title: 'Non-personal',
    icon: MinusCircle,
    color: '#0F7A4F',
    bg: '#E7F6EE',
    borderColor: '#B7E2CA'
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
      className="bg-white rounded-[14px] border border-[var(--border)] p-5 flex flex-col gap-4 shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Title Row with step badge 4 */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[var(--blue-600)] text-white text-sm font-bold flex items-center justify-center shrink-0">
            4
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Data categories</h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Click any category card to filter fields in the table
            </p>
          </div>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-[var(--blue-600)] hover:underline font-semibold cursor-pointer"
          >
            Clear category filter
          </button>
        )}
      </div>

      {/* Grid of category cards: 3 per row on desktop, 2 on tablet, 1 on mobile, 96px tall */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {CATEGORY_DEFS.map((cat) => {
          const Icon = cat.icon;
          const count = result?.categoryCounts[cat.key] || 0;
          const labels = result?.categoryFieldLabels[cat.key] || [];
          const labelsText = labels.length > 0 ? labels.join(', ') : 'None detected';
          const isSelected = selectedCategory === cat.key;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.key)}
              title={labels.length > 0 ? `${cat.title} fields: ${labelsText}` : undefined}
              className={`h-24 p-3.5 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[var(--blue-600)] border-[var(--blue-600)] shadow-xs'
                  : 'hover:border-[var(--border-strong)]'
              }`}
              style={{
                backgroundColor: count > 0 ? cat.bg : 'var(--surface-alt)',
                borderColor: count > 0 ? cat.borderColor : 'var(--border)'
              }}
            >
              {/* Icon in 40px rounded square */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: 'white',
                  color: cat.color
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text content: Category name (14/700), "N fields" (13/500), muted list */}
              <div className="truncate flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text)] truncate">
                    {cat.title}
                  </span>
                  <span
                    className="text-[13px] font-semibold tabular-nums ml-2"
                    style={{ color: count > 0 ? cat.color : 'var(--text-3)' }}
                  >
                    {count} {count === 1 ? 'field' : 'fields'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-3)] truncate mt-1">
                  {labelsText}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
