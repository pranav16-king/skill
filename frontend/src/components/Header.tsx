import React, { useState } from 'react';
import { Shield, Sparkles, Menu, Info, AlertCircle } from 'lucide-react';
import type { NoticeLanguage } from '../types/dpdp';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onLoadSample: () => void;
  language: NoticeLanguage;
  onSelectLanguage: (lang: NoticeLanguage) => void;
  isOutOfDate: boolean;
  backendSource?: 'backend' | 'in-browser';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onLoadSample,
  language,
  onSelectLanguage,
  isOutOfDate
}) => {
  const [showTrustTooltip, setShowTrustTooltip] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between no-print shadow-xs">
      {/* Left: Mobile hamburger + Page Title "Audit a form" */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-alt)]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-[var(--text)]">
            Audit a form
          </h1>
          {isOutOfDate && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300"
              title="Inputs modified since last audit"
            >
              <AlertCircle className="w-3 h-3" />
              Out of date. Analyze again.
            </span>
          )}
        </div>
      </div>

      {/* Right: Trust Badge + Load Sample + Language Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Load sample form button */}
        <button
          onClick={onLoadSample}
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-2)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Load sample form</span>
        </button>

        {/* 100% Private Trust Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTrustTooltip(!showTrustTooltip)}
            onMouseEnter={() => setShowTrustTooltip(true)}
            onMouseLeave={() => setShowTrustTooltip(false)}
            onFocus={() => setShowTrustTooltip(true)}
            onBlur={() => setShowTrustTooltip(false)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--nonpers-bg)',
              color: 'var(--nonpers-tx)',
              border: '1px solid var(--nonpers-bd)'
            }}
            aria-label="Privacy guarantee"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">100% private · Runs entirely in your browser</span>
            <span className="sm:hidden">100% private</span>
            <Info className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
          </button>

          {showTrustTooltip && (
            <div
              role="tooltip"
              className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-white border border-[var(--border)] shadow-xl z-50 text-xs text-[var(--text-2)] leading-relaxed pointer-events-none"
            >
              <div className="flex items-center gap-1.5 font-bold text-[var(--text)] mb-1">
                <Shield className="w-4 h-4 text-[var(--nonpers-tx)]" />
                <span>Zero server transmission</span>
              </div>
              <p>
                Analysis uses rules stored in this page. Your form is never uploaded or saved to any external database or analytics tool.
              </p>
            </div>
          )}
        </div>

        {/* Language switcher */}
        <div
          className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)]"
          role="radiogroup"
          aria-label="Language"
        >
          <button
            role="radio"
            aria-checked={language === 'en'}
            onClick={() => onSelectLanguage('en')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-white text-[var(--blue-600)] font-bold shadow-xs'
                : 'text-[var(--text-3)] hover:text-[var(--text)]'
            }`}
          >
            EN
          </button>
          <button
            role="radio"
            aria-checked={language === 'hi'}
            onClick={() => onSelectLanguage('hi')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              language === 'hi'
                ? 'bg-white text-[var(--blue-600)] font-bold shadow-xs'
                : 'text-[var(--text-3)] hover:text-[var(--text)]'
            }`}
          >
            हिन्दी
          </button>
          <button
            role="radio"
            aria-checked={language === 'mr'}
            onClick={() => onSelectLanguage('mr')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              language === 'mr'
                ? 'bg-white text-[var(--blue-600)] font-bold shadow-xs'
                : 'text-[var(--text-3)] hover:text-[var(--text)]'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>
    </header>
  );
};
