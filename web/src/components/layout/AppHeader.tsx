import React from 'react';
import { Logo } from '../common/Logo';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { Bell, Sparkles, Sun, Moon, ArrowLeftRight, UserCheck, Lock } from 'lucide-react';
import { UserRole } from '../../types';

interface AppHeaderProps {
  role: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  onNavigate: (path: string) => void;
  onOpenAskNeedit: () => void;
  unreadNotificationsCount?: number;
  isDark: boolean;
  onToggleDark: () => void;
  userInitials?: string;
  isSuperAdmin?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  role,
  onRoleChange,
  onNavigate,
  onOpenAskNeedit,
  unreadNotificationsCount = 0,
  isDark,
  onToggleDark,
  userInitials,
  isSuperAdmin = false,
}) => {
  const isHelper = role === 'helper';
  const isClub = role === 'club';

  // Fallback initials
  const initials = userInitials || (isClub ? 'CA' : isHelper ? 'PK' : 'AS');

  return (
    <header className="sticky top-0 z-[200] w-full h-16 bg-white/95 dark:bg-neutral-dark-page/95 backdrop-blur-md border-b border-neutral-border dark:border-neutral-dark-border transition-colors">
      <div className="max-w-hero mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(isHelper ? '/app/helper/feed' : isClub ? '/club' : '/app/home')}
            className="focus:outline-none"
            aria-label="App Home"
          >
            <Logo size="sm" />
          </button>

          {isClub ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Club Team Console
            </span>
          ) : (
            <div className="hidden sm:flex items-center">
              <VerifiedBadge size="sm" />
            </div>
          )}
        </div>

        {/* Center: Interface Status / Super Admin Switcher */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-1.5">
            <div className="bg-neutral-surface-alt dark:bg-slate-800 p-1 rounded-full flex items-center border border-amber-300 dark:border-amber-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => onRoleChange('customer')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  role === 'customer'
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'text-neutral-secondary dark:text-neutral-dark-secondary hover:text-neutral-ink'
                }`}
              >
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleChange('helper')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  role === 'helper'
                    ? 'bg-brand-teal text-white shadow-sm'
                    : 'text-neutral-secondary dark:text-neutral-dark-secondary hover:text-neutral-ink'
                }`}
              >
                <span>Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleChange('club')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  role === 'club'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-secondary dark:text-neutral-dark-secondary hover:text-neutral-ink'
                }`}
              >
                <span>Admin</span>
              </button>
            </div>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Dev Mode
            </span>
          </div>
        ) : (
          <div className="px-3 sm:px-4 py-1.5 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-neutral-secondary" />
            <span>
              {role === 'helper'
                ? 'Delivery Agent Portal'
                : role === 'club'
                ? 'Campus Admin Console'
                : 'Customer Portal'}
            </span>
          </div>
        )}

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ask NEEDIT shortcut button */}
          {!isClub && (
            <button
              onClick={onOpenAskNeedit}
              className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full text-xs font-medium bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 dark:text-brand-indigo-darkmode hover:bg-brand-indigo/15 transition-colors"
              title="Ask NEEDIT shop assistant"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask NEEDIT</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-btn flex items-center justify-center text-neutral-secondary dark:text-neutral-dark-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to light' : 'Switch to dark'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Bell with unread dot */}
          <button
            onClick={() => onNavigate('/app/notifications')}
            className="relative w-9 h-9 rounded-btn flex items-center justify-center text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-semantic-danger" />
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => onNavigate('/app/profile')}
            className={`relative w-9 h-9 rounded-full border text-white flex items-center justify-center font-heading font-bold text-xs transition-transform active:scale-95 ${
              isClub
                ? 'bg-purple-600 border-purple-400'
                : isHelper
                ? 'bg-brand-teal border-teal-400'
                : 'bg-brand-indigo border-indigo-400'
            }`}
            title="Your Profile"
            aria-label="Your Profile"
          >
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-dark-page" />
          </button>
        </div>
      </div>
    </header>
  );
};
