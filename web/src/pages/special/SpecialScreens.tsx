import React from 'react';
import {
  AlertTriangle,
  Lock,
  Clock,
  ShieldAlert,
  WifiOff,
  Hammer,
  ArrowLeft,
  Home,
  Mail,
  RefreshCw,
  LogIn
} from 'lucide-react';

interface SpecialScreenProps {
  type:
    | '404'
    | 'access-denied'
    | 'session-expired'
    | 'account-suspended'
    | 'offline'
    | 'maintenance';
  onNavigate: (path: string) => void;
  onRetry?: () => void;
}

export const SpecialScreens: React.FC<SpecialScreenProps> = ({
  type,
  onNavigate,
  onRetry
}) => {
  const configs = {
    '404': {
      icon: AlertTriangle,
      iconBg: 'bg-brand-indigo-light text-brand-indigo',
      title: 'Page not found (404)',
      desc: 'The campus link or order you are looking for does not exist or has been moved.',
      primaryBtn: { label: 'Return to Home', action: () => onNavigate('/'), icon: Home },
      secondaryBtn: { label: 'Contact Support', action: () => onNavigate('/contact'), icon: Mail }
    },
    'access-denied': {
      icon: Lock,
      iconBg: 'bg-rose-100 text-rose-700',
      title: 'You don\'t have access to this page',
      desc: 'This area is restricted to verified students, club operations team members, or the authorized order owner.',
      primaryBtn: { label: 'Go Back', action: () => onNavigate('/'), icon: ArrowLeft },
      secondaryBtn: { label: 'Contact Club Team', action: () => onNavigate('/contact'), icon: Mail }
    },
    'session-expired': {
      icon: Clock,
      iconBg: 'bg-amber-100 text-amber-700',
      title: 'Session Expired due to Inactivity',
      desc: 'To protect student privacy and order data on campus networks, your session was signed out. Please sign in again to continue.',
      primaryBtn: { label: 'Sign In Again', action: () => onNavigate('/login'), icon: LogIn },
      secondaryBtn: { label: 'Return to Home', action: () => onNavigate('/'), icon: Home }
    },
    'account-suspended': {
      icon: ShieldAlert,
      iconBg: 'bg-rose-100 text-rose-700',
      title: 'Student Account Suspended',
      desc: 'Your account was flagged by the student welfare council for a prohibited item attempt or dispute report. Please appeal through campus support.',
      primaryBtn: { label: 'Appeal to Club Council', action: () => onNavigate('/contact'), icon: Mail },
      secondaryBtn: { label: 'Read Terms & Policy', action: () => onNavigate('/terms'), icon: null }
    },
    'offline': {
      icon: WifiOff,
      iconBg: 'bg-slate-200 text-slate-800',
      title: 'No Connection (Offline Mode)',
      desc: 'Your device lost campus Wi-Fi connection. Showing your last cached order view. Connect and tap retry.',
      primaryBtn: { label: 'Retry Connection', action: () => onRetry ? onRetry() : alert('Reconnecting to campus server...'), icon: RefreshCw },
      secondaryBtn: { label: 'Go to Home', action: () => onNavigate('/'), icon: Home }
    },
    'maintenance': {
      icon: Hammer,
      iconBg: 'bg-brand-teal-light text-brand-teal',
      title: 'Scheduled Campus Maintenance',
      desc: 'NEEDIT is currently undergoing database calibration for the campus pilot. Expected back online at: Tonight, 11:30 PM.',
      primaryBtn: { label: 'Check Status on WhatsApp', action: () => onNavigate('/contact'), icon: Mail },
      secondaryBtn: { label: 'Return to Home', action: () => onNavigate('/'), icon: Home }
    }
  };

  const item = configs[type] || configs['404'];
  const Icon = item.icon;
  const PrimaryIcon = item.primaryBtn.icon;
  const SecondaryIcon = item.secondaryBtn.icon;

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-8 shadow-e2 text-center space-y-6">
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-sm ${item.iconBg}`}>
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-ink dark:text-neutral-dark-text">
            {item.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
            {item.desc}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={item.primaryBtn.action}
            className="w-full sm:w-auto h-11 px-5 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            {PrimaryIcon && <PrimaryIcon className="w-3.5 h-3.5" />}
            <span>{item.primaryBtn.label}</span>
          </button>

          {item.secondaryBtn && (
            <button
              onClick={item.secondaryBtn.action}
              className="w-full sm:w-auto h-11 px-5 rounded-btn border border-neutral-border dark:border-slate-700 text-neutral-ink dark:text-neutral-dark-text font-medium text-xs hover:bg-neutral-surface-alt transition-colors flex items-center justify-center gap-1.5"
            >
              {SecondaryIcon && <SecondaryIcon className="w-3.5 h-3.5" />}
              <span>{item.secondaryBtn.label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
