import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  QrCode,
  DollarSign,
  ArrowRight,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { SplitPricingCalculator } from '../../components/common/SplitPricingCalculator';

interface PricingProps {
  onNavigate: (path: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onNavigate }) => {
  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
            Transparent Campus Fees
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            Fair, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            No markups, no hidden commissions, and no surge multipliers. You pay exact store retail plus a modest peer fee.
          </p>
        </div>

        {/* 1. How Pricing Works Visual Equation */}
        <div className="max-w-3xl mx-auto p-6 sm:p-10 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e2">
          <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text text-center mb-8">
            The Two-Part Payment Formula
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            {/* Box 1: Retail Item Cost */}
            <div className="p-5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700">
              <span className="text-xs font-semibold uppercase text-neutral-secondary block mb-1">Part 1</span>
              <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                Actual Retail Item Cost
              </h3>
              <p className="text-xs text-neutral-secondary mt-1">
                Printed receipt price. Paid directly to the merchant via shop UPI QR.
              </p>
            </div>

            {/* Plus sign */}
            <div className="text-2xl font-black text-brand-indigo dark:text-brand-indigo-darkmode">
              +
            </div>

            {/* Box 2: Helper Fee */}
            <div className="p-5 rounded-card bg-brand-teal-light/50 dark:bg-brand-teal/15 border border-brand-teal/30">
              <span className="text-xs font-semibold uppercase text-brand-teal block mb-1">Part 2</span>
              <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                Helper Delivery Fee
              </h3>
              <p className="text-xs text-neutral-secondary mt-1">
                Pilot range: <strong className="text-brand-teal font-mono">₹20 – ₹50</strong>. Goes 100% to the student helper.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-border dark:border-slate-800 text-center">
            <span className="text-xs text-neutral-secondary">Resulting in</span>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-brand-indigo dark:text-brand-indigo-darkmode font-mono mt-1">
              Exact Total Cost
            </div>
            <p className="text-xs text-neutral-secondary mt-2">
              Both components are agreed upon before your helper makes the purchase at the counter.
            </p>
          </div>
        </div>

        {/* 2. Fee Explainer: Base + Effort/Distance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
              Pilot Structure
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
              How the helper fee is determined
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              During our campus pilot, the system suggests a fair fee range between ₹20 and ₹50 based on three transparent parameters:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-indigo-light text-brand-indigo flex items-center justify-center font-bold text-sm shrink-0">
                  ₹20
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text">Base Flat Effort</h4>
                  <p className="text-xs text-neutral-secondary">
                    Compensates the student for stepping out, finding the shelf, and queueing at the checkout counter.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-teal-light text-brand-teal flex items-center justify-center font-bold text-sm shrink-0">
                  +₹10-15
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text">Walking Distance Tier</h4>
                  <p className="text-xs text-neutral-secondary">
                    Closer shops near gate (₹0 extra); further commercial streets across highway (+₹10–15).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                  +₹10-15
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text">Package Bulk & Weight (S/M/L)</h4>
                  <p className="text-xs text-neutral-secondary">
                    Light envelopes/pens (S) vs heavier beverages/multiple 2kg groceries (M or L).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Worked Example: Section 10.3 Animated Split Pricing Calculator */}
          <div className="space-y-2">
            <SplitPricingCalculator initialItemCost={160} initialHelperFee={25} allowCustomization={true} />
          </div>
        </div>

        {/* 3. Guarantees & Protections */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-panel border border-emerald-200 dark:border-emerald-800/50 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-heading font-bold text-lg">
            <ShieldCheck className="w-5 h-5" />
            <span>Our Campus Student Guarantees</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed">
            <div className="p-4 rounded-card bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-900/50 space-y-1">
              <strong>1. No purchase without price approval:</strong> If a store price changes unexpectedly, the helper is prohibited from purchasing until you tap "Approve" in chat.
            </div>
            <div className="p-4 rounded-card bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-900/50 space-y-1">
              <strong>2. Pay ₹0 for unbought items:</strong> If an item cannot be found or the order is cancelled before purchase, you pay absolutely zero rupees.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/register')}
              className="h-12 px-7 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium shadow-sm transition-colors"
            >
              Sign Up to Place a Request
            </button>
            <button
              onClick={() => onNavigate('/faq')}
              className="h-12 px-6 rounded-btn border border-neutral-border dark:border-slate-700 text-neutral-ink dark:text-neutral-dark-text font-medium hover:bg-neutral-surface-alt transition-colors"
            >
              Read Pricing FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
