import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  UserCheck,
  QrCode
} from 'lucide-react';

interface BecomeAHelperProps {
  onNavigate: (path: string) => void;
}

export const BecomeAHelper: React.FC<BecomeAHelperProps> = ({ onNavigate }) => {
  const [openHelperFaq, setOpenHelperFaq] = useState<number | null>(0);

  const helperDaySteps = [
    {
      step: 1,
      title: 'Heading to the campus market?',
      desc: 'Going to buy snacks, notebooks, or dinner outside? Open NEEDIT or broadcast your "Going out" time window.'
    },
    {
      step: 2,
      title: 'Pick requests along your route',
      desc: 'Browse orders from students living in your hostel block or study library. Accept only what fits easily in your bag.'
    },
    {
      step: 3,
      title: 'Buy items & send shop QR',
      desc: 'Pay zero personal money. The requester scans the shop’s cashier QR code in chat and approves any price differences.'
    },
    {
      step: 4,
      title: 'Drop off & keep 100% of your fee',
      desc: 'Meet at the hostel block lounge, verify the 4-digit code, and instantly receive your ₹20–₹50 helper fee via UPI.'
    }
  ];

  const helperFaqs = [
    {
      q: 'Do I have to commit to minimum delivery shifts?',
      a: 'No! NEEDIT is 100% voluntary and peer-driven. You only accept requests when you are already heading out. There are zero quotas or inactivity penalties.'
    },
    {
      q: 'What if I cannot find the requested brand?',
      a: 'Simply tap "Couldn\'t find it" in the helper job screen. You can propose an alternative with a photo, or release the order back to the live campus feed with zero penalty.'
    },
    {
      q: 'Do I ever need to pay for items with my own money?',
      a: 'Never. You never front personal cash. You send the store cashier\'s payment QR in the private chat, and the customer pays the merchant directly.'
    },
    {
      q: 'Can day scholars be helpers?',
      a: 'Yes! Both hostel residents and day scholars who commute to campus are welcome, as long as you hold an active college email address.'
    }
  ];

  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Helper Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal-light text-brand-teal text-xs font-bold uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Student Earnings with Freedom</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            Earn while you're already going out
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
            Turn your routine trips to the college gate, canteen, or stationery shops into effortless pocket money. Help dorm peers and pocket ₹20–₹50 per stop.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('/register')}
              className="h-12 px-8 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white font-medium shadow-sm transition-transform active:scale-95 inline-flex items-center gap-2"
            >
              <span>Join as a Student Helper</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Why Help Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2 shadow-e1">
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              100% Voluntary
            </h3>
            <p className="text-xs text-neutral-secondary leading-relaxed">
              No shifts, no required hours, and no algorithms forcing deliveries. Deliver once a month or five times a week.
            </p>
          </div>

          <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2 shadow-e1">
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              Never Front Cash
            </h3>
            <p className="text-xs text-neutral-secondary leading-relaxed">
              You do not need savings or spare cash. The customer pays the store cashier directly via in-chat UPI QR before purchase.
            </p>
          </div>

          <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2 shadow-e1">
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              Clear Up-Front Fee
            </h3>
            <p className="text-xs text-neutral-secondary leading-relaxed">
              Every card on the feed lists the exact offered helper fee (₹20–₹50) before you decide to accept.
            </p>
          </div>

          <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2 shadow-e1">
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              Zero Penalty Release
            </h3>
            <p className="text-xs text-neutral-secondary leading-relaxed">
              Store out of stock or line too long? Release the request back to the campus feed without account demerits.
            </p>
          </div>
        </div>

        {/* How A Helper Day Works (4 Steps) */}
        <div className="bg-neutral-surface-alt dark:bg-slate-900 rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-heading font-bold text-2xl text-neutral-ink dark:text-neutral-dark-text">
              How a helper's day works
            </h2>
            <p className="text-xs sm:text-sm text-neutral-secondary">
              Seamlessly woven into your ordinary daily campus routine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helperDaySteps.map((step) => (
              <div
                key={step.step}
                className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-teal text-white flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                <h4 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                  {step.title}
                </h4>
                <p className="text-xs text-neutral-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Going-Out Availability Feature Preview */}
        <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-e1">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode">
              <Calendar className="w-4 h-4" />
              <span>Helper Availability Scheduler</span>
            </div>
            <h3 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Broadcast "I'm going out"
            </h3>
            <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
              Heading out this evening? Use presets like <em>"Today evening"</em> or <em>"Weekend morning"</em> in <code className="font-mono text-xs bg-neutral-surface-alt px-1 py-0.5 rounded">/app/helper/availability</code> so peers in your hostel block know to queue their requests for your trip.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/helper-rules')}
            className="h-11 px-5 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt transition-colors shrink-0"
          >
            Review Helper Pilot Rules →
          </button>
        </div>

        {/* Helper FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h3 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text text-center">
            Helper Questions & Answers
          </h3>

          <div className="space-y-3">
            {helperFaqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenHelperFaq(openHelperFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-secondary shrink-0 transition-transform ${
                      openHelperFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openHelperFaq === i && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed border-t border-neutral-border/40 dark:border-slate-800/40">
                    <div className="pt-2">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate('/register')}
            className="h-12 px-8 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white font-medium shadow-sm transition-colors"
          >
            Sign Up as a Student Helper
          </button>
        </div>
      </div>
    </div>
  );
};
