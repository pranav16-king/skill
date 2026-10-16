import React from 'react';
import {
  FileCode,
  TableProperties,
  Award,
  Layers,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  X
} from 'lucide-react';
import type { AuditResult } from '../types/dpdp';

interface SidebarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  result?: AuditResult | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  result
}) => {
  const navItems = [
    { id: 'panel-input', label: 'Provide input', icon: FileCode, step: '1' },
    { id: 'panel-results', label: 'Analysis results', icon: TableProperties, step: '2' },
    { id: 'panel-score', label: 'Compliance score', icon: Award, step: '3' },
    { id: 'panel-categories', label: 'Data categories', icon: Layers, step: '4' },
    { id: 'panel-notice', label: 'Consent notice', icon: FileText, step: '5' },
    { id: 'panel-actions', label: 'Export', icon: Download, step: '6' }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0B1530]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between transition-all duration-300 no-print select-none ${
          collapsed ? 'w-[72px]' : 'w-[232px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--navy-900)',
          borderRight: '1px solid #1A274E',
          color: '#C9D3EA'
        }}
        aria-label="Sections"
      >
        {/* Top: Brand Block */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-[#1A274E] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[var(--blue-600)] flex items-center justify-center shrink-0 text-white shadow-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="truncate">
                  <h1 className="font-bold text-white tracking-tight text-[17px] leading-tight truncate">
                    DPDP Auditor
                  </h1>
                  <p className="text-[11px] text-[#8EA2D4] leading-tight truncate mt-0.5">
                    Check. Understand.
                  </p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#C9D3EA] hover:text-white p-1 rounded-md"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (44px tall each, 8px gap) */}
          <nav className="p-3 space-y-2 overflow-y-auto" role="tablist">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const hasAnalysis = result !== null;

              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => handleItemClick(item.id)}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                  className={`w-full h-11 flex items-center gap-3 px-3.5 rounded-[10px] text-left text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--blue-600)] text-white shadow-xs font-semibold'
                      : 'text-[#C9D3EA] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#8EA2D4]'}`} />
                    {!hasAnalysis && item.step !== '1' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>

                  {(!collapsed || mobileOpen) && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Status line + Privacy card + Collapse toggle */}
        <div className="p-3 border-t border-[#1A274E] space-y-3">
          {/* Status Line (small 12px) */}
          {result && (!collapsed || mobileOpen) && (
            <div className="px-2 py-1.5 rounded-md bg-[#11204A] text-[11px] text-[#A6B9DE] leading-tight truncate">
              <span className="text-white font-medium">Last analysed:</span> {result.totalFields} fields · {result.purpose}
            </div>
          )}

          {/* Bottom Privacy Card */}
          {(!collapsed || mobileOpen) && (
            <div className="p-3 rounded-xl bg-[#11204A]/80 border border-[#1F3369] text-xs text-[#A6B9DE]">
              <div className="flex items-center gap-1.5 font-bold text-white text-[12px] mb-1">
                <Lock className="w-3.5 h-3.5 text-[#4BB543]" />
                <span>100% private</span>
              </div>
              <p className="text-[11px] text-[#8EA2D4] leading-snug">
                Runs entirely in your browser. Nothing is uploaded.
              </p>
            </div>
          )}

          {/* Desktop Rail Collapse Button */}
          <div className="hidden lg:flex items-center justify-end">
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-2 rounded-lg hover:bg-white/[0.08] text-[#8EA2D4] hover:text-white transition-colors"
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
