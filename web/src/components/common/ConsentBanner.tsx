import React, { useState, useEffect } from 'react';
import { Shield, X, Check, Lock } from 'lucide-react';

interface ConsentBannerProps {
  onNavigate?: (path: string) => void;
}

interface CookiePreferences {
  strictlyNecessary: boolean;
  functional: boolean;
  analytics: boolean;
}

const STORAGE_KEY = 'needit_cookie_preferences';
const CONSENT_KEY = 'needit_cookie_consent_accepted';

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ onNavigate }) => {
  const [accepted, setAccepted] = useState(true); // default true to avoid flash before checking storage
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    strictlyNecessary: true,
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    try {
      const isAccepted = localStorage.getItem(CONSENT_KEY);
      const savedPrefs = localStorage.getItem(STORAGE_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
      if (!isAccepted) {
        setAccepted(false);
      }
    } catch {
      setAccepted(false);
    }
  }, []);

  const handleAcceptAll = () => {
    const allEnabled: CookiePreferences = {
      strictlyNecessary: true,
      functional: true,
      analytics: true,
    };
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allEnabled));
    } catch {
      // storage unavailable
    }
    setPreferences(allEnabled);
    setShowPreferences(false);
    setAccepted(true);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // storage unavailable
    }
    setShowPreferences(false);
    setAccepted(true);
  };

  const handleRejectOptional = () => {
    const minimal: CookiePreferences = {
      strictlyNecessary: true,
      functional: false,
      analytics: false,
    };
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      // storage unavailable
    }
    setPreferences(minimal);
    setShowPreferences(false);
    setAccepted(true);
  };

  if (accepted && !showPreferences) return null;

  return (
    <>
      {/* 1. Main Cookie & DPDP Consent Banner */}
      {!accepted && (
        <aside
          aria-label="Privacy and cookies"
          className="fixed bottom-0 inset-x-0 z-[600] p-4 bg-white/95 dark:bg-neutral-dark-card/95 backdrop-blur-md border-t border-neutral-border dark:border-neutral-dark-border shadow-e3 animate-slide-up"
        >
          <div className="max-w-content mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-brand-indigo-light dark:bg-brand-indigo/20 text-brand-indigo dark:text-brand-indigo-darkmode mt-0.5 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-body dark:text-neutral-dark-text">
                  We use cookies to keep you signed in and protect student interactions under India's Digital Personal Data Protection (DPDP) Act.
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/privacy')}
                    className="text-brand-indigo dark:text-brand-indigo-darkmode hover:underline font-medium"
                  >
                    Privacy Policy
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
                onClick={() => setShowPreferences(true)}
                className="flex-1 sm:flex-initial h-10 px-5 rounded-btn border border-neutral-border dark:border-neutral-dark-border text-sm font-medium text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
              >
                Manage Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-initial h-10 px-5 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-sm font-medium shadow-sm transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Working Manage Preferences Modal Panel */}
      {showPreferences && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-dark-card rounded-2xl border border-neutral-border dark:border-neutral-dark-border shadow-e3 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-border dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 dark:text-brand-indigo-darkmode">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="cookie-preferences-title"
                    className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text"
                  >
                    Cookie & Privacy Preferences
                  </h2>
                  <p className="text-xs text-neutral-secondary">
                    Configure your data choices under DPDP regulations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1.5 rounded-lg text-neutral-secondary hover:text-neutral-ink hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
                aria-label="Close preferences"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Category Options */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Category 1: Necessary */}
              <div className="p-3.5 rounded-xl bg-neutral-surface-alt/70 dark:bg-slate-800/50 border border-neutral-border dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text">
                      Strictly Necessary Cookies
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200 dark:bg-slate-700 text-neutral-secondary dark:text-slate-300">
                      Always Active
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-secondary leading-relaxed">
                    Essential for student sign-in, session token validation, and order security. Cannot be switched off.
                  </p>
                </div>
                <div className="p-1 text-neutral-secondary">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* Category 2: Functional */}
              <div className="p-3.5 rounded-xl border border-neutral-border dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text block">
                    Functional & Delivery Preferences
                  </span>
                  <p className="text-[11px] text-neutral-secondary leading-relaxed">
                    Saves your campus hostel block, preferred pickup locations, and dark mode display settings.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.functional}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, functional: !prev.functional }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    preferences.functional ? 'bg-brand-indigo' : 'bg-neutral-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      preferences.functional ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Category 3: Analytics */}
              <div className="p-3.5 rounded-xl border border-neutral-border dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text block">
                    Anonymous Performance Analytics
                  </span>
                  <p className="text-[11px] text-neutral-secondary leading-relaxed">
                    Helps us measure errand pickup speed and optimize delivery routing across campus blocks.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.analytics}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, analytics: !prev.analytics }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    preferences.analytics ? 'bg-brand-indigo' : 'bg-neutral-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      preferences.analytics ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-neutral-surface-alt/50 dark:bg-slate-800/40 border-t border-neutral-border dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto px-4 h-9 rounded-btn text-xs font-semibold text-neutral-secondary hover:text-neutral-ink dark:hover:text-white transition-colors"
              >
                Reject Optional
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="flex-1 sm:flex-initial px-4 h-9 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text hover:bg-neutral-surface-alt transition-colors"
                >
                  Save Choices
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-initial px-4 h-9 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
