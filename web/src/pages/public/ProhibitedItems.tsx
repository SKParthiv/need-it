import React from 'react';
import {
  ShieldAlert,
  Ban,
  AlertTriangle,
  Scale,
  DollarSign,
  FileText,
  ArrowRight
} from 'lucide-react';
import { prohibitedItemsList } from '../../data/mockData';

interface ProhibitedItemsProps {
  onNavigate: (path: string) => void;
}

export const ProhibitedItems: React.FC<ProhibitedItemsProps> = ({ onNavigate }) => {
  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-semantic-danger-tint text-semantic-danger text-xs font-bold uppercase tracking-wider">
            <Ban className="w-3.5 h-3.5" />
            <span>Strict Campus Policy</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            Prohibited Items & Limitations
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            To keep student helpers and the university community safe, certain items are strictly banned from NEEDIT.
          </p>
        </div>

        {/* Strict Dietary Prohibition Callout */}
        <div className="max-w-3xl mx-auto p-5 rounded-panel bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-semantic-danger text-white flex items-center justify-center shrink-0 mt-0.5">
            <Ban className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-base text-red-900 dark:text-red-200">
              Strict Campus Rule: 100% Non-Vegetarian Items Banned
            </h3>
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 leading-relaxed">
              All non-vegetarian food items (chicken, mutton, meat, seafood, fish, eggs, non-veg rolls, etc.) are strictly prohibited from being requested, transported, or delivered on SASTRA campus premises. Zero tolerance policy enforced.
            </p>
          </div>
        </div>

        {/* 1. Why We Have This List */}
        <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e1 space-y-3">
          <h2 className="font-heading font-bold text-lg sm:text-xl text-neutral-ink dark:text-neutral-dark-text">
            Why we enforce strict item boundaries
          </h2>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
            NEEDIT is run on campus under college administration approval. All interactions are student-to-student. Prohibited item rules protect student helpers from legal liability, hostel disciplinary action, and physical hazard during transit.
          </p>
        </div>

        {/* 2. Categorized Prohibited List */}
        <div className="space-y-4">
          <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
            Banned items list
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prohibitedItemsList.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-card bg-semantic-danger-tint/30 dark:bg-semantic-danger/10 border border-semantic-danger/20 flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-full bg-semantic-danger text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Ban className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                      {item.item}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-semantic-danger px-1.5 py-0.5 rounded bg-white dark:bg-slate-800">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Weight & Price Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-panel bg-neutral-surface-alt dark:bg-slate-900 border border-neutral-border dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
              Size & Weight Cap: 5 kg Maximum
            </h3>
            <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              Items must fit comfortably into a standard backpack or bicycle basket. Heavy construction tools, furniture, or oversized boxes cannot be accepted.
            </p>
          </div>

          <div className="p-6 rounded-panel bg-neutral-surface-alt dark:bg-slate-900 border border-neutral-border dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
              Pilot Price Cap: ₹1,500 Maximum
            </h3>
            <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              To minimize peer financial liability, high-value electronics (smartphones, laptops, luxury watches) are blocked during the campus pilot phase.
            </p>
          </div>
        </div>

        {/* 4. What happens if blocked at posting */}
        <div className="p-6 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border space-y-4">
          <div className="flex items-center gap-2 text-semantic-warning font-heading font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Inline Post Form Enforcement</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
            When typing into the "Add items" field in <code className="font-mono text-xs bg-neutral-surface-alt px-1.5 py-0.5 rounded">/app/post</code>, our real-time keyword filter blocks banned terms inline with an informative error message. Requests violating terms will fail validation. Repeated attempts to bypass filters result in immediate account suspension by the student club moderators.
          </p>

          <div className="pt-2 border-t border-neutral-border dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-neutral-secondary">Need more policy details?</span>
            <button
              onClick={() => onNavigate('/terms')}
              className="text-brand-indigo dark:text-brand-indigo-darkmode font-semibold hover:underline flex items-center gap-1"
            >
              <span>View full student responsibility policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
