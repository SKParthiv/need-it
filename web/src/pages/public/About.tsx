import React from 'react';
import { ShieldCheck, Heart, Users, Sparkles, AlertCircle, ArrowRight, MapPin, DollarSign, Ban } from 'lucide-react';

interface AboutProps {
  onNavigate: (path: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
            Our Mission & Origin
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            About NEEDIT
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            Student-driven, transparent, and built specifically for the daily realities of SASTRA campus life.
          </p>
        </div>

        {/* Key Metrics / Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-e1 text-center space-y-1">
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-indigo font-mono">
              ₹0 Cut
            </span>
            <h4 className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text">Zero Platform Fee</h4>
            <p className="text-[11px] text-neutral-secondary">
              100% of delivery fees go directly to student helpers.
            </p>
          </div>

          <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-e1 text-center space-y-1">
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-teal font-mono">
              13 Spots
            </span>
            <h4 className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text">Approved Campus Points</h4>
            <p className="text-[11px] text-neutral-secondary">
              Safe handovers restricted to vetted campus locations.
            </p>
          </div>

          <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-e1 text-center space-y-1">
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-600 font-mono">
              100% Veg
            </span>
            <h4 className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text">Dietary Compliance</h4>
            <p className="text-[11px] text-neutral-secondary">
              Zero tolerance policy on all non-vegetarian items.
            </p>
          </div>
        </div>

        {/* 1. Our Story (65ch readable prose) */}
        <div className="max-w-prose-custom mx-auto bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-10 shadow-e1 space-y-4">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-neutral-ink dark:text-neutral-dark-text">
            Our Story: Built by students, for students
          </h2>
          <div className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary space-y-3 leading-relaxed">
            <p>
              It's 10:30 PM before semester exams. You need a spiral ruled notebook and two blue ballpoint pens, or your roommate has a headache and needs an OTC paracetamol strip. But commercial delivery apps charge inflated minimum orders, platform surcharges, and delivery surges that students cannot afford.
            </p>
            <p>
              Meanwhile, dozens of hostel mates are already walking back from the campus gate or local commercial street. Why not connect them?
            </p>
            <p>
              NEEDIT was created by a collegiate engineering club to provide an honest, zero-commission peer logistics network. By removing commercial middlemen, students get urgent essentials delivered right to their block lounge while peer helpers pocket fair pocket money.
            </p>
          </div>
        </div>

        {/* 2. The Club Behind NEEDIT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-6 rounded-card bg-neutral-surface-alt dark:bg-slate-900 border border-neutral-border dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
              The Campus Club Behind NEEDIT
            </h3>
            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              Maintained by the Student Innovation & Welfare Council. The student club team actively monitors order safety, moderates item disputes manually, and works directly with campus wardens to ensure physical security.
            </p>
          </div>

          <div className="p-6 rounded-card bg-neutral-surface-alt dark:bg-slate-900 border border-neutral-border dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-teal-light text-brand-teal flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
              What We Stand For
            </h3>
            <ul className="text-xs sm:text-sm text-neutral-secondary space-y-1.5">
              <li>• <strong>Trust:</strong> Strictly verified college students; no outsiders.</li>
              <li>• <strong>Fairness:</strong> Direct shop QR code payment with 0% markups.</li>
              <li>• <strong>Privacy:</strong> Masked phone numbers & read-only chat records.</li>
            </ul>
          </div>
        </div>

        {/* 3. Pilot Notice Box per spec */}
        <div className="max-w-2xl mx-auto p-5 rounded-card bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-bold block">Active Campus Pilot Phase</span>
            <p>
              NEEDIT is currently running as a supervised pilot on select SASTRA campus clusters. System limits (5kg weight cap, ₹1,500 value cap, ₹20–₹50 helper fee) are actively calibrated based on student feedback and club council reviews.
            </p>
          </div>
        </div>

        {/* Contact Link */}
        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('/contact')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
          >
            <span>Questions for the club team? Reach out on our Contact Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
