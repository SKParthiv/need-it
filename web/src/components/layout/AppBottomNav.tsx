import React from 'react';
import {
  Home,
  Package,
  Plus,
  MessageSquare,
  User,
  Compass,
  Briefcase,
  Calendar
} from 'lucide-react';
import { UserRole } from '../../types';

interface AppBottomNavProps {
  role: UserRole;
  currentPath: string;
  onNavigate: (path: string) => void;
  hideOnCurrentScreen?: boolean;
}

interface TabItem {
  label: string;
  path: string;
  icon: any;
  shortLabel?: string;
  isRaised?: boolean;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  role,
  currentPath,
  onNavigate,
  hideOnCurrentScreen = false
}) => {
  if (hideOnCurrentScreen || role === 'club') return null;

  const isHelper = role === 'helper';

  const customerTabs: TabItem[] = [
    { label: 'Home', path: '/app/home', icon: Home },
    { label: 'My Orders', shortLabel: 'Orders', path: '/app/orders', icon: Package },
    { label: 'Post', shortLabel: 'Post', path: '/app/post', icon: Plus, isRaised: true },
    { label: 'Chat', path: '/app/chat', icon: MessageSquare },
    { label: 'Profile', path: '/app/profile', icon: User },
  ];

  const helperTabs: TabItem[] = [
    { label: 'Feed', path: '/app/helper/feed', icon: Compass },
    { label: 'My Jobs', shortLabel: 'Jobs', path: '/app/helper/jobs', icon: Briefcase },
    { label: 'Availability', shortLabel: 'Avail', path: '/app/helper/availability', icon: Calendar },
    { label: 'Chat', path: '/app/chat', icon: MessageSquare },
    { label: 'Profile', path: '/app/profile', icon: User },
  ];

  const tabs = isHelper ? helperTabs : customerTabs;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-[200] h-16 pb-safe bg-white/95 dark:bg-neutral-dark-card/95 backdrop-blur-md border-t border-neutral-border dark:border-neutral-dark-border px-2 flex items-center justify-around shadow-e3"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPath.startsWith(tab.path);

        if (tab.isRaised) {
          return (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              className="relative -top-3 flex flex-col items-center justify-center focus:outline-none group"
              aria-label="Post request"
            >
              <div className="w-12 h-12 rounded-full bg-brand-indigo hover:bg-brand-indigo-dark text-white flex items-center justify-center shadow-e2 group-active:scale-95 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-semibold text-brand-indigo dark:text-brand-indigo-darkmode mt-0.5">
                {tab.shortLabel || tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            onClick={() => onNavigate(tab.path)}
            className={`flex flex-col items-center justify-center w-16 py-1 focus:outline-none transition-colors duration-150 ${
              isActive
                ? isHelper
                  ? 'text-brand-teal font-semibold'
                  : 'text-brand-indigo dark:text-brand-indigo-darkmode font-semibold'
                : 'text-neutral-secondary dark:text-neutral-dark-secondary hover:text-neutral-ink'
            }`}
          >
            {/* Section 10.4: Tab bar switch: icon fills/pops, label fades, 150ms */}
            <Icon
              className={`w-5 h-5 transition-transform duration-150 ease-enter ${
                isActive ? 'stroke-[2.4] scale-110' : 'stroke-[1.75] scale-100'
              }`}
            />
            <span
              className={`text-[10px] mt-1 truncate max-w-full transition-opacity duration-150 ease-enter ${
                isActive ? 'opacity-100 font-semibold' : 'opacity-75'
              }`}
            >
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.shortLabel || tab.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
};
