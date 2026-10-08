import React, { useState, useEffect } from 'react';
import { Store, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

interface SplitPricingCalculatorProps {
  initialItemCost?: number;
  initialHelperFee?: number;
  allowCustomization?: boolean;
}

export const SplitPricingCalculator: React.FC<SplitPricingCalculatorProps> = ({
  initialItemCost = 105,
  initialHelperFee = 25,
  allowCustomization = true,
}) => {
  const [itemCost, setItemCost] = useState(initialItemCost);
  const [helperFee, setHelperFee] = useState(initialHelperFee);
  const [displayedTotal, setDisplayedTotal] = useState(0);

  const presets = [
    { label: 'Chai & Samosa', item: 40, fee: 20 },
    { label: 'Classmate Notebook', item: 105, fee: 25 },
    { label: 'Hostel Dinner Roll', item: 160, fee: 30 },
    { label: 'OTC Paracetamol & Band-Aid', item: 210, fee: 35 },
  ];

  const targetTotal = itemCost + helperFee;

  // Section 10.3: Total counts up (800ms) with smooth deceleration easing
  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayedTotal;
    const duration = 800; // 800ms per spec

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Decelerating cubic-bezier(0.22, 1, 0.36, 1) approximation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetTotal - startValue) * easeOut);
      setDisplayedTotal(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetTotal]);

  const itemPercent = Math.max(20, Math.min(85, Math.round((itemCost / targetTotal) * 100)));
  const helperPercent = 100 - itemPercent;

  return (
    <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-7 shadow-e2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-slate-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-indigo dark:text-brand-indigo-darkmode block">
            Transparent Pricing Formula
          </span>
          <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
            Item Cost + Helper Fee = Exact Total
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          0% Platform Cut
        </span>
      </div>

      {/* Preset Pill Buttons */}
      {allowCustomization && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-neutral-secondary">
            Select an example campus order:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setItemCost(preset.item);
                  setHelperFee(preset.fee);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  itemCost === preset.item && helperFee === preset.fee
                    ? 'bg-brand-indigo text-white shadow-sm scale-[1.02]'
                    : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-body dark:text-slate-300 hover:bg-neutral-border dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section 10.3: Split Bars Slide into Place */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1.5 text-brand-indigo dark:text-brand-indigo-darkmode font-semibold">
            <Store className="w-3.5 h-3.5" /> Retail Store Cost: ₹{itemCost} ({itemPercent}%)
          </span>
          <span className="flex items-center gap-1.5 text-brand-teal dark:text-emerald-400 font-semibold">
            <UserCheck className="w-3.5 h-3.5" /> Helper Fee: ₹{helperFee} ({helperPercent}%)
          </span>
        </div>

        {/* Stacked Animated Progress Bar */}
        <div className="h-6 w-full rounded-full bg-neutral-surface-alt dark:bg-slate-800 overflow-hidden flex p-0.5 border border-neutral-border dark:border-slate-700">
          <div
            className="h-full rounded-l-full bg-brand-indigo transition-all duration-500 ease-enter flex items-center justify-center text-[10px] text-white font-mono font-bold"
            style={{ width: `${itemPercent}%` }}
            title={`Retail Cost: ₹${itemCost}`}
          >
            ₹{itemCost}
          </div>
          <div
            className="h-full rounded-r-full bg-brand-teal transition-all duration-500 ease-enter flex items-center justify-center text-[10px] text-white font-mono font-bold"
            style={{ width: `${helperPercent}%` }}
            title={`Helper Fee: ₹${helperFee}`}
          >
            ₹{helperFee}
          </div>
        </div>
      </div>

      {/* Itemised Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-card bg-neutral-surface-alt/70 dark:bg-slate-800/60 border border-neutral-border/60 dark:border-slate-700/60 space-y-1">
          <span className="text-neutral-secondary block font-medium">1. Store Cashier Receipt</span>
          <span className="font-heading font-extrabold text-lg text-neutral-ink dark:text-neutral-dark-text font-mono block">
            ₹{itemCost}
          </span>
          <p className="text-[10px] text-neutral-placeholder">Paid direct to store via cashier UPI QR</p>
        </div>

        <div className="p-3 rounded-card bg-brand-teal-light/40 dark:bg-brand-teal/15 border border-brand-teal/20 space-y-1">
          <span className="text-brand-teal-dark dark:text-emerald-300 block font-medium">2. Peer Walking Fee</span>
          <span className="font-heading font-extrabold text-lg text-brand-teal dark:text-emerald-400 font-mono block">
            ₹{helperFee}
          </span>
          <p className="text-[10px] text-neutral-placeholder">Paid direct to student after 4-digit code</p>
        </div>
      </div>

      {/* Section 10.3: Total Counts Up Animated Highlight */}
      <div className="p-4 rounded-card bg-gradient-to-r from-brand-indigo-light/70 to-purple-50 dark:from-brand-indigo/20 dark:to-purple-950/20 border border-brand-indigo/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-secondary block">
            Exact Total Paid by Student:
          </span>
          <span className="font-heading font-black text-3xl text-brand-indigo dark:text-brand-indigo-darkmode font-mono tnum">
            ₹{displayedTotal}
          </span>
        </div>

        <div className="text-right space-y-0.5">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Zero Extra Markup
          </span>
          <span className="text-[11px] text-neutral-secondary block">
            No surge • No service charge
          </span>
        </div>
      </div>
    </div>
  );
};
