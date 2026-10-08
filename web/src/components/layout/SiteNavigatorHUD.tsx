import React, { useState } from 'react';
import {
  Compass,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Shield,
  Smartphone,
  Monitor
} from 'lucide-react';
import { UserRole } from '../../types';

interface SiteNavigatorHUDProps {
  currentPath: string;
  role: UserRole;
  onNavigate: (path: string) => void;
  onRoleChange: (role: UserRole) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const SiteNavigatorHUD: React.FC<SiteNavigatorHUDProps> = ({
  currentPath,
  role,
  onNavigate,
  onRoleChange,
  isDark,
  onToggleDark
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const siteMapGroups = [
    {
      group: 'A. Public Website',
      links: [
        { label: 'Home (Landing)', path: '/' },
        { label: 'How It Works', path: '/how-it-works' },
        { label: 'Pricing & Fees', path: '/pricing' },
        { label: 'Safety & Trust', path: '/safety' },
        { label: 'Prohibited Items', path: '/prohibited-items' },
        { label: 'Become a Helper', path: '/become-a-helper' },
        { label: 'FAQ', path: '/faq' },
        { label: 'About Us', path: '/about' },
        { label: 'Contact & Problem', path: '/contact' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Helper Pilot Rules', path: '/helper-rules' },
        { label: 'Sign In / Log In', path: '/login' },
        { label: 'Register Account', path: '/register' },
      ]
    },
    {
      group: 'B. Web App — Onboarding',
      links: [
        { label: '1. Verify College Email', path: '/app/verify' },
        { label: '2. Profile Setup', path: '/app/profile-setup' },
        { label: '3. Mandatory Policy', path: '/app/policy' },
        { label: '4. Choose Initial Role', path: '/app/role' },
      ]
    },
    {
      group: 'C. Web App — Customer Area',
      links: [
        { label: 'Customer Home', path: '/app/home' },
        { label: 'Post a Request (Stepper)', path: '/app/post' },
        { label: 'My Orders List', path: '/app/orders' },
        { label: 'Order Page #ORD-1092', path: '/app/orders/ORD-1092' },
        { label: 'Order History (Private)', path: '/app/history' },
      ]
    },
    {
      group: 'D. Web App — Helper Area',
      links: [
        { label: 'Request Feed', path: '/app/helper/feed' },
        { label: 'Request Detail #ORD-1094', path: '/app/helper/feed/ORD-1094' },
        { label: 'My Delivery Jobs', path: '/app/helper/jobs' },
        { label: 'Job Execution #ORD-1092', path: '/app/helper/jobs/ORD-1092' },
        { label: 'Going-Out Availability', path: '/app/helper/availability' },
        { label: 'Shop Portal (Add Shops)', path: '/app/helper/shops' },
      ]
    },
    {
      group: 'E. Web App — Shared Pages',
      links: [
        { label: 'Chat List', path: '/app/chat' },
        { label: 'Chat Detail #ORD-1092', path: '/app/chat/ORD-1092' },
        { label: 'Notifications Center', path: '/app/notifications' },
        { label: 'Profile & Preferences', path: '/app/profile' },
        { label: 'Ask NEEDIT Chatbot', path: '/app/ask' },
        { label: 'Report a Problem', path: '/app/report' },
      ]
    },
    {
      group: 'F. Club Team Console',
      links: [
        { label: 'Club Dashboard', path: '/club' },
        { label: 'Reports Queue', path: '/club/reports' },
        { label: 'Report Detail #REP-301', path: '/club/reports/REP-301' },
        { label: 'Verified Students', path: '/club/users' },
        { label: 'All Requests Monitor', path: '/club/requests' },
        { label: 'Rules & Caps Config', path: '/club/rules' },
        { label: 'Campus Pickup Points', path: '/club/pickup-points' },
        { label: 'Shop DB Moderation', path: '/club/shops' },
        { label: 'WhatsApp Broadcasts', path: '/club/broadcast' },
        { label: 'Pilot Insights', path: '/club/insights' },
      ]
    },
    {
      group: 'G. Special Error Screens',
      links: [
        { label: '404 Page Not Found', path: '/404' },
        { label: 'Access Denied', path: '/special/access-denied' },
        { label: 'Session Expired', path: '/special/session-expired' },
        { label: 'Account Suspended', path: '/special/account-suspended' },
        { label: 'Offline Banner View', path: '/special/offline' },
        { label: 'Scheduled Maintenance', path: '/special/maintenance' },
      ]
    }
  ];

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-4 right-4 z-[400] flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-neutral-ink text-white dark:bg-brand-indigo dark:text-white shadow-e3 hover:scale-105 active:scale-95 transition-all text-xs font-semibold border border-white/20"
        >
          <Layers className="w-4 h-4 text-brand-coral" />
          <span>Site Master Navigator</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Modal Drawer (Section 10.4: 400ms modal content slide up, 280ms backdrop fade) */}
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-ink/60 backdrop-blur-sm modal-backdrop-anim">
          <div className="w-full max-w-3xl bg-white dark:bg-neutral-dark-card rounded-t-3xl sm:rounded-panel shadow-e3 border border-neutral-border dark:border-neutral-dark-border max-h-[85vh] flex flex-col overflow-hidden modal-content-anim">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-border dark:border-neutral-dark-border flex items-center justify-between bg-neutral-surface-alt/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-indigo text-white flex items-center justify-center shadow-sm">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-ink dark:text-neutral-dark-text text-base">
                    NEEDIT Master Sitemap Navigator
                  </h3>
                  <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
                    Jump to any of the 35+ master pages & special states defined in specs
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-secondary hover:text-neutral-ink hover:bg-neutral-border/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Role & Mode Bar */}
            <div className="px-4 py-2.5 bg-brand-indigo-light/40 dark:bg-brand-indigo/10 border-b border-neutral-border dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-secondary dark:text-neutral-dark-secondary">
                  Active Simulation Role:
                </span>
                <div className="flex rounded-md overflow-hidden border border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                  {(['customer', 'helper', 'club'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => onRoleChange(r)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                        role === r
                          ? r === 'customer'
                            ? 'bg-brand-indigo text-white'
                            : r === 'helper'
                            ? 'bg-brand-teal text-white'
                            : 'bg-purple-700 text-white'
                          : 'text-neutral-secondary hover:text-neutral-ink'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-neutral-secondary dark:text-neutral-dark-secondary">Theme:</span>
                <button
                  onClick={onToggleDark}
                  className="px-2.5 py-1 rounded border border-neutral-border dark:border-slate-700 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
              </div>
            </div>

            {/* Grid of Links */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {siteMapGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40"
                  >
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-indigo dark:text-brand-indigo-darkmode mb-2.5">
                      {group.group}
                    </h4>
                    <div className="space-y-1">
                      {group.links.map((link) => {
                        const isCurrent = currentPath === link.path;
                        return (
                          <button
                            key={link.path}
                            onClick={() => {
                              onNavigate(link.path);
                              setIsOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-input text-xs transition-colors flex items-center justify-between ${
                              isCurrent
                                ? 'bg-brand-indigo text-white font-semibold'
                                : 'text-neutral-body dark:text-neutral-dark-text hover:bg-white dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="truncate">{link.label}</span>
                            <span className="text-[10px] opacity-70 font-mono shrink-0 ml-1">
                              {link.path.length > 18 ? link.path.slice(0, 18) + '…' : link.path}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
