import React, { useState } from 'react';
import {
  Home,
  Package,
  PlusCircle,
  MessageSquare,
  User,
  Compass,
  Briefcase,
  Calendar,
  Store,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  FileText,
  Users,
  Layers,
  Settings,
  MapPin,
  Radio,
  BarChart3
} from 'lucide-react';
import { UserRole } from '../../types';

interface AppSidebarProps {
  role: UserRole;
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAskNeedit: () => void;
}

interface SidebarItem {
  label: string;
  path: string;
  icon: any;
  isHighlight?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  role,
  currentPath,
  onNavigate,
  onOpenAskNeedit
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const customerItems: SidebarItem[] = [
    { label: 'Customer Home', path: '/app/home', icon: Home },
    { label: 'Post a Request', path: '/app/post', icon: PlusCircle, isHighlight: true },
    { label: 'My Orders', path: '/app/orders', icon: Package },
    { label: 'Order History', path: '/app/history', icon: Clock },
    { label: 'Messages', path: '/app/chat', icon: MessageSquare },
    { label: 'Profile Settings', path: '/app/profile', icon: User },
    { label: 'Report a Problem', path: '/app/report', icon: ShieldAlert },
  ];

  const helperItems: SidebarItem[] = [
    { label: 'Request Feed', path: '/app/helper/feed', icon: Compass },
    { label: 'My Delivery Jobs', path: '/app/helper/jobs', icon: Briefcase },
    { label: 'Going Out Times', path: '/app/helper/availability', icon: Calendar },
    { label: 'Shop Portal', path: '/app/helper/shops', icon: Store },
    { label: 'Messages', path: '/app/chat', icon: MessageSquare },
    { label: 'Profile Settings', path: '/app/profile', icon: User },
    { label: 'Report a Problem', path: '/app/report', icon: ShieldAlert },
  ];

  const clubItems: SidebarItem[] = [
    { label: 'Overview', path: '/club', icon: LayoutDashboard },
    { label: 'Problem Reports', path: '/club/reports', icon: FileText },
    { label: 'Verified Users', path: '/club/users', icon: Users },
    { label: 'All Requests', path: '/club/requests', icon: Layers },
    { label: 'Rules & Limits', path: '/club/rules', icon: Settings },
    { label: 'Pickup Points', path: '/club/pickup-points', icon: MapPin },
    { label: 'Shop Database', path: '/club/shops', icon: Store },
    { label: 'WhatsApp Broadcast', path: '/club/broadcast', icon: Radio },
    { label: 'Pilot Insights', path: '/club/insights', icon: BarChart3 },
  ];

  const items = role === 'club' ? clubItems : role === 'helper' ? helperItems : customerItems;

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-neutral-border dark:border-neutral-dark-border bg-white dark:bg-neutral-dark-card transition-all duration-200 z-20 shrink-0 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Sidebar Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/app/home' && item.path !== '/club' && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive
                  ? role === 'helper'
                    ? 'bg-brand-teal text-white shadow-sm'
                    : role === 'club'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-brand-indigo text-white shadow-sm'
                  : item.isHighlight
                  ? 'bg-brand-indigo-light dark:bg-brand-indigo/15 text-brand-indigo dark:text-brand-indigo-darkmode hover:bg-brand-indigo/20 font-semibold'
                  : 'text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom utility: Ask NEEDIT shortcut & Collapse toggle */}
      <div className="p-3 border-t border-neutral-border dark:border-neutral-dark-border space-y-2">
        {role !== 'club' && (
          <button
            onClick={onOpenAskNeedit}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-xs font-semibold bg-brand-indigo-light/70 dark:bg-brand-indigo/10 text-brand-indigo dark:text-brand-indigo-darkmode hover:bg-brand-indigo-light transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Ask NEEDIT Bot"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Ask NEEDIT Bot</span>}
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-9 flex items-center justify-center rounded-btn text-neutral-secondary dark:text-neutral-dark-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> <span>Collapse</span></div>}
        </button>
      </div>
    </aside>
  );
};
