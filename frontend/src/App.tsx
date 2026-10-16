import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PanelInput } from './components/PanelInput';
import { PanelResults } from './components/PanelResults';
import { PanelScore } from './components/PanelScore';
import { PanelCategories } from './components/PanelCategories';
import { PanelNotice } from './components/PanelNotice';
import { PanelActions } from './components/PanelActions';
import { PrintReport } from './components/PrintReport';

import type {
  AuditResult,
  FieldCategory,
  InputMode,
  NoticeLanguage
} from './types/dpdp';
import {
  auditForm,
  SAMPLE_MESSY_FORM_HTML,
  SAMPLE_MESSY_PURPOSE
} from './engine/ruleEngine';
import { generatePlainTextReport } from './engine/noticeGenerator';
import { executeAudit } from './services/api';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export const App: React.FC = () => {
  // Navigation & Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('panel-input');

  // Input & Audit State
  const [mode, setMode] = useState<InputMode>('html');
  const [rawInput, setRawInput] = useState<string>(SAMPLE_MESSY_FORM_HTML);
  const [purpose, setPurpose] = useState<string>(SAMPLE_MESSY_PURPOSE);
  const [result, setResult] = useState<AuditResult | null>(() =>
    auditForm(SAMPLE_MESSY_FORM_HTML, SAMPLE_MESSY_PURPOSE, 'html')
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOutOfDate, setIsOutOfDate] = useState(false);

  // Filter & Language State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<FieldCategory | null>(null);
  const [language, setLanguage] = useState<NoticeLanguage>('en');

  // UI Feedback
  const [inputError, setInputError] = useState<string | undefined>();
  const [purposeError, setPurposeError] = useState<string | undefined>();
  const [copyToast, setCopyToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Scroll spy to update active section in sidebar
  useEffect(() => {
    const handleScroll = () => {
      const panels = [
        'panel-input',
        'panel-results',
        'panel-score',
        'panel-categories',
        'panel-notice',
        'panel-actions'
      ];

      for (const id of panels) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 150) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set out-of-date flag when input changes
  const handleInputChange = (val: string) => {
    setRawInput(val);
    setInputError(undefined);
    if (result) setIsOutOfDate(true);
  };

  const handlePurposeChange = (val: string) => {
    setPurpose(val);
    setPurposeError(undefined);
    if (result) setIsOutOfDate(true);
  };

  // Perform form audit
  const runAudit = async (inputStr: string, purpStr: string, inputMode: InputMode) => {
    let hasError = false;

    if (!inputStr.trim()) {
      setInputError('Paste your form HTML or list some field names.');
      hasError = true;
    }

    if (!purpStr.trim()) {
      setPurposeError('Add a one-line purpose so we can judge what is necessary.');
      hasError = true;
    }

    if (hasError) return;

    setIsAnalyzing(true);
    setInputError(undefined);
    setPurposeError(undefined);

    try {
      const response = await executeAudit(inputStr, purpStr, inputMode);
      setResult(response.result);
      setIsOutOfDate(false);

      if (response.result.fields.length === 0) {
        setInputError(
          inputMode === 'html'
            ? 'We could not find any fields. Check the HTML, or switch to Enter field list.'
            : 'We could not find any fields.'
        );
      } else {
        // Accessibility announcement
        showLiveToast(
          `Analysis complete: ${response.result.unnecessaryCount} unnecessary fields, score ${response.result.score} out of 100.`
        );
      }
    } catch {
      const fallback = auditForm(inputStr, purpStr, inputMode);
      setResult(fallback);
      setIsOutOfDate(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load sample messy form
  const handleLoadSample = () => {
    setMode('html');
    setRawInput(SAMPLE_MESSY_FORM_HTML);
    setPurpose(SAMPLE_MESSY_PURPOSE);
    setInputError(undefined);
    setPurposeError(undefined);
    setSelectedCategoryFilter(null);
    runAudit(SAMPLE_MESSY_FORM_HTML, SAMPLE_MESSY_PURPOSE, 'html');
    showLiveToast('Loaded sample form (Judge test case)');
  };

  // Clear inputs
  const handleClear = () => {
    setRawInput('');
    setPurpose('');
    setResult(null);
    setInputError(undefined);
    setPurposeError(undefined);
    setIsOutOfDate(false);
    setSelectedCategoryFilter(null);
  };

  // Copy Consent Notice with 2s live toast
  const handleCopyNotice = () => {
    if (!result) return;
    const txt = generatePlainTextReport(result, language);
    const parts = txt.split('======================================================================\nDRAFT CONSENT NOTICE');
    const noticeContent = parts.length > 1 ? parts[1] : txt;

    navigator.clipboard.writeText(noticeContent.trim()).then(() => {
      setCopyToast(true);
      showLiveToast('Consent notice copied to clipboard!');
      setTimeout(() => setCopyToast(false), 2000);
    });
  };

  // Download .txt report
  const handleDownloadTxt = () => {
    if (!result) return;
    const reportText = generatePlainTextReport(result, language);
    const purposeSlug = result.purpose.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'form';
    const dateStr = getTodayDateString();
    const filename = `dpdp-audit-${purposeSlug}-${dateStr}.txt`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showLiveToast(`Downloaded report: ${filename}`);
  };

  // Print PDF via window.print()
  const handlePrintPdf = () => {
    window.print();
  };

  // Show live toast message
  const showLiveToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  // Scroll to section from sidebar navigation
  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Move keyboard focus to heading inside panel for accessibility
      const heading = el.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans">
      {/* Printable Report (visible only in print) */}
      <PrintReport result={result} language={language} />

      {/* Left Sidebar (232px expanded, 72px collapsed, drawer on mobile <1024px) */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        result={result}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[232px]'
        }`}
      >
        {/* Top Header: Title "Audit a form" + 100% Private Badge */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onLoadSample={handleLoadSample}
          language={language}
          onSelectLanguage={setLanguage}
          isOutOfDate={isOutOfDate}
        />

        {/* Live Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[var(--text)] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/20 transition-all duration-200"
          >
            <span className="w-2 h-2 rounded-full bg-[#4BB543]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dashboard 6-Panel Layout in 2 Rows per ui.md Section 2 */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-5 no-print">
          {/* ROW 1: [1 Provide Input] (360px) [2 Analysis Results] (Fluid) [3 Compliance Score] (320px) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Panel 1: Provide Input (360px / col-span-3 or 4) */}
            <div className="lg:col-span-4 xl:col-span-3">
              <PanelInput
                mode={mode}
                onModeChange={setMode}
                rawInput={rawInput}
                onInputChange={handleInputChange}
                purpose={purpose}
                onPurposeChange={handlePurposeChange}
                onAnalyze={() => runAudit(rawInput, purpose, mode)}
                onClear={handleClear}
                onLoadSample={handleLoadSample}
                isAnalyzing={isAnalyzing}
                inputError={inputError}
                purposeError={purposeError}
              />
            </div>

            {/* Panel 2: Analysis Results (Fluid / col-span-5 or 6) */}
            <div className="lg:col-span-5 xl:col-span-6">
              <PanelResults
                result={result}
                selectedCategoryFilter={selectedCategoryFilter}
                onSelectCategoryFilter={setSelectedCategoryFilter}
              />
            </div>

            {/* Panel 3: Compliance Score (320px / col-span-3) */}
            <div className="lg:col-span-3 xl:col-span-3">
              <PanelScore result={result} />
            </div>
          </section>

          {/* ROW 2: [4 Data Categories] (Fluid) [5 Draft Consent Notice] (1.4fr) [6 Actions] (320px) */}
          <section className="space-y-5">
            {/* Panel 4: Data Categories (Full fluid width across Row 2) */}
            <PanelCategories
              result={result}
              selectedCategory={selectedCategoryFilter}
              onSelectCategory={setSelectedCategoryFilter}
            />

            {/* Sub-grid for Panel 5 (1.4fr) & Panel 6 (320px) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Panel 5: Draft Consent Notice (1.4fr ~ 8 cols) */}
              <div className="lg:col-span-8 xl:col-span-8">
                <PanelNotice
                  result={result}
                  language={language}
                  onLanguageChange={setLanguage}
                />
              </div>

              {/* Panel 6: Actions / Export (320px ~ 4 cols) */}
              <div className="lg:col-span-4 xl:col-span-4">
                <PanelActions
                  result={result}
                  onPrintPdf={handlePrintPdf}
                  onDownloadTxt={handleDownloadTxt}
                  onCopyNotice={handleCopyNotice}
                  copyToast={copyToast}
                />
              </div>
            </div>
          </section>

          {/* Footer note */}
          <footer className="pt-6 pb-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-3)] flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-bold text-[var(--text)]">DPDP Form Auditor</span> · Digital Personal Data Protection Act compliance
            </div>
            <div>
              100% private in-browser analysis. Not formal legal advice.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
