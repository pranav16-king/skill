import React, { useState } from 'react';
import { Shield, Sparkles, Menu, Info, Globe, AlertCircle } from 'lucide-react';
import type { NoticeLanguage } from '../types/dpdp';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onLoadSample: () => void;
  language: NoticeLanguage;
  onSelectLanguage: (lang: NoticeLanguage) => void;
  isOutOfDate: boolean;
  backendSource: 'backend' | 'in-browser';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onLoadSample,
  language,
  onSelectLanguage,
  isOutOfDate,
  backendSource
}) => {
  const [showTrustTooltip, setShowTrustTooltip] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 h-14 bg-white border-b border-[var(--line)] px-4 sm:px-6 flex items-center justify-between no-print shadow-xs"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Left: Mobile hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[var(--ink-2)] hover:bg-[var(--surface-alt)] focus-visible:outline-2"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--ink)]">
            Audit a form
          </h1>
          {isOutOfDate && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--review-bg)] text-[var(--review)] border border-[var(--review)]/30"
              title="Inputs have been modified since last analysis"
            >
              <AlertCircle className="w-3 h-3" />
              Out of date
            </span>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Persistent Trust Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTrustTooltip(!showTrustTooltip)}
            onMouseEnter={() => setShowTrustTooltip(true)}
            onMouseLeave={() => setShowTrustTooltip(false)}
            onFocus={() => setShowTrustTooltip(true)}
            onBlur={() => setShowTrustTooltip(false)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--needed-bg)',
              color: 'var(--needed)'
            }}
            aria-label="Trust badge: 100% private, runs entirely in your browser"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">100% private · Runs entirely in your browser</span>
            <span className="sm:hidden">100% private</span>
            <Info className="w-3 h-3 opacity-70 shrink-0" />
          </button>

          {/* Trust Tooltip */}
          {showTrustTooltip && (
            <div
              role="tooltip"
              className="absolute right-0 top-full mt-2 w-72 p-3 rounded-lg bg-white border border-[var(--line)] shadow-xl z-50 text-xs text-[var(--ink-2)] leading-relaxed pointer-events-none"
            >
              <p className="font-semibold text-[var(--ink)] mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[var(--needed)]" />
                Browser-local security guarantee
              </p>
              <p>
                All form parsing, tokenization, classification and notice generation execute locally in your web browser. Nothing is ever sent or uploaded to any remote server.
              </p>
              <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                <span>Engine mode:</span>
                <span className="font-mono text-[var(--needed)] font-medium">
                  {backendSource === 'backend' ? 'API Connected' : 'Browser Rule Engine'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Loader Button */}
        <button
          onClick={onLoadSample}
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--line-strong)] text-[var(--ink-2)] hover:bg-[var(--surface-alt)] hover:text-[var(--ink)] transition-colors"
          title="Load sample messy form with odd field names"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Load sample form</span>
        </button>

        {/* Language Segmented Control (EN | हिं | मरा) */}
        <div
          className="flex items-center p-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface-alt)]"
          role="radiogroup"
          aria-label="Consent notice language"
        >
          <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-[var(--ink-3)] hidden sm:inline" />
          <button
            role="radio"
            aria-checked={language === 'en'}
            onClick={() => onSelectLanguage('en')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              language === 'en'
                ? 'bg-white text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            EN
          </button>
          <button
            role="radio"
            aria-checked={language === 'hi'}
            onClick={() => onSelectLanguage('hi')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              language === 'hi'
                ? 'bg-white text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            हिन्दी
          </button>
          <button
            role="radio"
            aria-checked={language === 'mr'}
            onClick={() => onSelectLanguage('mr')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              language === 'mr'
                ? 'bg-white text-[var(--primary)] font-semibold shadow-xs'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>
    </header>
  );
};
