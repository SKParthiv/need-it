import React from 'react';
import { Logo } from '../common/Logo';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-neutral-surface-alt dark:bg-slate-900 border-t border-neutral-border dark:border-neutral-dark-border mt-16 transition-colors">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand info column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary max-w-sm">
              Student-powered campus essentials. Built by students, for students, to deliver food, stationery, snacks, and academic supplies across campus hostels.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-indigo-light dark:bg-brand-indigo/20 text-brand-indigo dark:text-brand-indigo-darkmode text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pilot active on verified university campus</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading font-semibold text-xs tracking-wider uppercase text-neutral-secondary dark:text-neutral-dark-secondary mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-neutral-body dark:text-neutral-dark-text">
              <li>
                <button onClick={() => onNavigate('/how-it-works')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  How it works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/pricing')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Pricing & fees
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/safety')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Safety & trust
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/become-a-helper')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Become a helper
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/faq')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Guidelines & Safety */}
          <div>
            <h4 className="font-heading font-semibold text-xs tracking-wider uppercase text-neutral-secondary dark:text-neutral-dark-secondary mb-3">
              Rules & Guidelines
            </h4>
            <ul className="space-y-2 text-sm text-neutral-body dark:text-neutral-dark-text">
              <li>
                <button onClick={() => onNavigate('/prohibited-items')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors font-medium text-semantic-danger dark:text-semantic-danger-dark">
                  Prohibited items
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/helper-rules')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Pilot rules for helpers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Terms & responsibility
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Privacy policy (DPDP)
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Support */}
          <div>
            <h4 className="font-heading font-semibold text-xs tracking-wider uppercase text-neutral-secondary dark:text-neutral-dark-secondary mb-3">
              Support & Club
            </h4>
            <ul className="space-y-2 text-sm text-neutral-body dark:text-neutral-dark-text">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  About NEEDIT & club
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors">
                  Contact & feedback
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-semantic-danger dark:hover:text-semantic-danger-dark transition-colors font-medium">
                  Report a problem
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/club')} className="hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode transition-colors text-xs text-neutral-placeholder">
                  Club team console →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-6 border-t border-neutral-border dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
          <p>© 2026 NEEDIT. Built by students with pride.</p>
          <div className="flex items-center gap-1">
            <span>Student-powered peer delivery</span>
            <Heart className="w-3.5 h-3.5 text-brand-coral fill-current inline mx-0.5" />
            <span>Campus Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
