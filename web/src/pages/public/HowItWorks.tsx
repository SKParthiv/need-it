import React, { useState } from 'react';
import {
  UserCheck,
  PlusCircle,
  Clock,
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Sparkles
} from 'lucide-react';

interface HowItWorksProps {
  onNavigate: (path: string) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const [roleMode, setRoleMode] = useState<'customer' | 'helper'>('customer');

  const customerSteps = [
    {
      num: 1,
      title: 'Sign in with college ID',
      desc: 'Verify your official SASTRA email address (your_reg_no@sastra.ac.in). No outsider accounts are permitted on the network.',
      icon: UserCheck
    },
    {
      num: 2,
      title: 'Add items and category',
      desc: 'Specify the item name, estimated store price, quantity, and notes. Prohibited items are blocked automatically.',
      icon: PlusCircle
    },
    {
      num: 3,
      title: 'Choose time window & preferences',
      desc: 'Set when you need it by, whether substitute brands are acceptable, and select your approved campus drop-off point.',
      icon: Clock
    },
    {
      num: 4,
      title: 'Helper accepts & chat opens',
      desc: 'A peer who is already visiting stores accepts the order. Private alias chat opens with masked phone numbers.',
      icon: MessageSquare
    },
    {
      num: 5,
      title: 'Approve prices & pay cashier',
      desc: 'Helper uploads receipt or shop UPI QR code. You pay the retailer directly with 0% extra markup.',
      icon: QrCode
    },
    {
      num: 6,
      title: 'Confirm with code & rate',
      desc: 'Meet at your block lobby, show your 4-digit handover code, pay the ₹20–₹50 helper fee, and leave an optional review.',
      icon: CheckCircle2
    }
  ];

  const helperSteps = [
    {
      num: 1,
      title: 'Sign in & set availability',
      desc: 'Log in with your verified SASTRA email (your_reg_no@sastra.ac.in) and optionally mark "I am going out" to let dorm peers know your route.',
      icon: UserCheck
    },
    {
      num: 2,
      title: 'Browse open request feed',
      desc: 'See campus orders sorted by category, distance, size (S/M/L), and offered helper fee (₹20–₹50).',
      icon: Clock
    },
    {
      num: 3,
      title: 'Review & accept (Locks request)',
      desc: 'Acceptance is 100% voluntary with zero penalties. Once accepted, the order is locked exclusively to you.',
      icon: PlusCircle
    },
    {
      num: 4,
      title: 'Check items & send shop QR',
      desc: 'Buy the items at local stores. Send photos if item is missing. Send the shop’s payment QR code directly in chat.',
      icon: QrCode
    },
    {
      num: 5,
      title: 'Hand over at campus point',
      desc: 'Head back to campus and meet at the pre-selected public pickup location (e.g., Hostel Block A lounge).',
      icon: MessageSquare
    },
    {
      num: 6,
      title: 'Verify code & receive fee',
      desc: 'Enter the customer’s 4-digit code in your app to close the job, and receive your direct UPI helper fee payment.',
      icon: CheckCircle2
    }
  ];

  const currentSteps = roleMode === 'customer' ? customerSteps : helperSteps;

  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header with Role Toggle */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
            Step-by-Step Guide
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            How NEEDIT Works
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            Learn the complete journey from initial request to campus handover.
          </p>

          {/* Role Toggle */}
          <div className="inline-flex p-1 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 shadow-sm mt-4">
            <button
              onClick={() => setRoleMode('customer')}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                roleMode === 'customer'
                  ? 'bg-brand-indigo text-white shadow-sm'
                  : 'text-neutral-secondary dark:text-neutral-dark-secondary'
              }`}
            >
              Customer Journey
            </button>
            <button
              onClick={() => setRoleMode('helper')}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                roleMode === 'helper'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-neutral-secondary dark:text-neutral-dark-secondary'
              }`}
            >
              Helper Journey
            </button>
          </div>
        </div>

        {/* Section 10.3: 6 Steps Grid with Step Connector (stroke-dashoffset flow) & 80ms stagger */}
        <div className="relative">
          {/* Animated connector track behind cards on desktop */}
          <div className="hidden lg:block absolute top-12 left-10 right-10 h-2 pointer-events-none z-0">
            <svg className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <line
                x1="0%"
                y1="4"
                x2="100%"
                y2="4"
                stroke={roleMode === 'customer' ? '#4F46E5' : '#0F766E'}
                strokeWidth="2.5"
                strokeDasharray="6 8"
                className="route-flow-1 opacity-50 dark:opacity-40 transition-colors duration-300"
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {currentSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card shadow-e1 hover:shadow-e2 transition-all duration-250 hover:-translate-y-1 space-y-4 animate-slide-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform active:scale-[0.97] ${
                        roleMode === 'customer' ? 'bg-brand-indigo' : 'bg-brand-teal'
                      }`}
                    >
                      {step.num}
                    </div>
                    <Icon className="w-5 h-5 text-neutral-secondary" />
                  </div>
                  <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* "When Things Change" Section */}
        <div className="bg-neutral-surface-alt dark:bg-slate-900 rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-10 space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              <span>When things change: Exceptions & Safeguards</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary">
              Real life on campus is unpredictable. Here is how NEEDIT protects both students when plans shift.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Item Unavailable
              </h4>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                Helper takes a photo of possible substitutes. You receive "Approve" or "Decline" buttons. If declined, you owe ₹0 for that item.
              </p>
            </div>

            <div className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Price Discrepancy
              </h4>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                If the retail price differs from your estimate, the helper cannot purchase without your explicit in-chat price confirmation.
              </p>
            </div>

            <div className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Waiting Too Long?
              </h4>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                If your order stays open without an accept, tap the amber alert to extend your needed-by window or raise the offered helper fee.
              </p>
            </div>

            <div className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <XCircle className="w-4 h-4 text-neutral-placeholder" />
                Cancellation Before Buy
              </h4>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                Requesters can cancel anytime before purchase with a single tap. Zero cost, zero penalties for either side.
              </p>
            </div>

            <div className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                Helper Safe Release
              </h4>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                If an emergency arises before buying items, the helper can release the order back to the live campus feed with no penalty.
              </p>
            </div>

            <div className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Reschedule Handover
              </h4>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                Stuck in a campus lecture? Use the reschedule button on the Handover screen to agree on a new drop-off time window.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Row */}
        <div className="p-8 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border text-center space-y-4 shadow-e1">
          <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-ink dark:text-neutral-dark-text">
            Start using NEEDIT at your college today
          </h3>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary max-w-md mx-auto">
            Choose whether you want to request essentials or earn as a student helper.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/register')}
              className="w-full sm:w-auto h-11 px-6 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-sm font-medium transition-colors"
            >
              Sign Up as Customer
            </button>
            <button
              onClick={() => onNavigate('/become-a-helper')}
              className="w-full sm:w-auto h-11 px-6 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-medium transition-colors"
            >
              Join as a Student Helper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
