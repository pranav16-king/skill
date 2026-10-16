import React from 'react';
import {
  FileCode,
  TableProperties,
  Award,
  Layers,
  FileText,
  Share2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'panel-input', label: 'Provide input', icon: FileCode, step: '1' },
    { id: 'panel-results', label: 'Analysis results', icon: TableProperties, step: '2' },
    { id: 'panel-score', label: 'Compliance score', icon: Award, step: '3' },
    { id: 'panel-categories', label: 'Data categories', icon: Layers, step: '4' },
    { id: 'panel-notice', label: 'Consent notice', icon: FileText, step: '5' },
    { id: 'panel-actions', label: 'Export', icon: Share2, step: '6' }
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 no-print ${
          collapsed ? 'w-[72px]' : 'w-[232px]'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-line)',
          color: 'var(--sidebar-text)'
        }}
        aria-label="Application navigation"
      >
        {/* Brand / Logo Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#1C2746]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#2B3A9E] flex items-center justify-center shrink-0 text-white font-semibold shadow-inner">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-semibold text-white tracking-wide text-sm block leading-tight">
                  DPDP Auditor
                </span>
                <span className="text-[11px] text-[#8C9BB5] block">In-Browser Engine</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-[#BAC7DE] hover:text-white p-1 rounded-md"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto" role="tablist">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleItemClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-[#1C2C54] text-white font-medium border-l-3 border-[#4A6BF5]'
                    : 'text-[#9DB0CF] hover:bg-[#142040] hover:text-white'
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                  <span className="sr-only">Step {item.step}</span>
                </div>

                {!collapsed && (
                  <div className="flex items-center justify-between w-full truncate">
                    <span className="truncate">{item.label}</span>
                    <span className="text-[11px] text-[#6E80A0] font-mono ml-2">0{item.step}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with collapse toggle on desktop */}
        <div className="p-3 border-t border-[#1C2746] hidden lg:flex items-center justify-between">
          {!collapsed && (
            <span className="text-xs text-[#7B8DAA] truncate">
              v1.0 · Section 6 DPDP
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-md hover:bg-[#192648] text-[#BAC7DE] hover:text-white transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
