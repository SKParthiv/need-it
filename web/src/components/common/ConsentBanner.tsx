import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface ConsentBannerProps {
  onNavigate?: (path: string) => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ onNavigate }) => {
  const [accepted, setAccepted] = useState(false);

  if (accepted) return null;

  return (
    <aside
      aria-label="Privacy and cookies"
      className="fixed bottom-0 inset-x-0 z-[600] p-4 bg-white/95 dark:bg-neutral-dark-card/95 backdrop-blur-md border-t border-neutral-border dark:border-neutral-dark-border shadow-e3"
    >
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-indigo-light dark:bg-brand-indigo/20 text-brand-indigo dark:text-brand-indigo-darkmode mt-0.5 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-neutral-body dark:text-neutral-dark-text">
              We use strictly necessary cookies to keep you signed in and protect student interactions under India's Digital Personal Data Protection (DPDP) Act.
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <button
                type="button"
                onClick={() => onNavigate?.('/privacy')}
                className="text-brand-indigo dark:text-brand-indigo-darkmode hover:underline font-medium"
              >
                Read Privacy Policy
              </button>
              <span className="text-neutral-disabled">•</span>
              <button
                type="button"
                onClick={() => onNavigate?.('/terms')}
                className="text-neutral-secondary dark:text-neutral-dark-secondary hover:underline"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setAccepted(true)}
            className="flex-1 sm:flex-initial h-10 px-5 rounded-btn border border-neutral-border dark:border-neutral-dark-border text-sm font-medium text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
          >
            Manage Preferences
          </button>
          <button
            type="button"
            onClick={() => setAccepted(true)}
            className="flex-1 sm:flex-initial h-10 px-5 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-sm font-medium transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </aside>
  );
};
