import React, { useState } from 'react';
import { Mail, MessageCircle, AlertCircle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface ContactProps {
  onNavigate: (path: string) => void;
  isLoggedIn?: boolean;
}

export const Contact: React.FC<ContactProps> = ({ onNavigate, isLoggedIn = false }) => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    orderRef: '',
    email: '',
    issueType: 'Item missing or damaged',
    details: ''
  });

  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
            Direct Campus Support
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            Contact & Report a Problem
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            Have a question, feedback, or need mediation regarding an active or completed order?
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="p-6 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-e1 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              Official Campus Email
            </h3>
            <p className="text-xs text-neutral-secondary">
              For general administrative inquiries, club collaboration, and formal appeals.
            </p>
            <p className="font-mono text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode">
              support.needit@sastra.ac.in
            </p>
          </div>

          <div className="p-6 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-e1 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              WhatsApp Pilot Broadcast
            </h3>
            <p className="text-xs text-neutral-secondary">
              Real-time campus broadcasts, live helper window alerts, and urgent moderation.
            </p>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Campus Pilot WhatsApp Channel
            </span>
          </div>
        </div>

        {/* Report a Problem Form Card */}
        <div className="max-w-xl mx-auto bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-semantic-danger-tint text-semantic-danger flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                Report an Issue or Dispute
              </h2>
              <p className="text-xs text-neutral-secondary">
                Sent directly to the student club moderation team for manual review.
              </p>
            </div>
          </div>

          {/* Logged in prompt notice per spec */}
          <div className="p-3.5 rounded-input bg-brand-indigo-light/50 dark:bg-brand-indigo/10 border border-brand-indigo/20 text-xs text-brand-indigo dark:text-brand-indigo-darkmode flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Already logged into your account? You can file an instant report directly linked to your order at{' '}
              <button
                type="button"
                onClick={() => onNavigate('/app/report')}
                className="underline font-bold"
              >
                /app/report
              </button>.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-card bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-heading font-bold text-base text-emerald-900 dark:text-emerald-300">
                Problem Report Submitted
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                Ticket Reference: <strong className="font-mono">#TKT-9921</strong>. The student club moderators will review the chat logs and contact your college email within 2 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-emerald-700 underline font-semibold mt-2"
              >
                Submit another ticket
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Order Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={form.orderRef}
                  onChange={(e) => setForm({ ...form, orderRef: e.target.value })}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Your SASTRA Email (your_reg_no@sastra.ac.in) *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Issue Category *
                </label>
                <select
                  value={form.issueType}
                  onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                >
                  <option>Item missing or damaged</option>
                  <option>Price dispute / Unapproved price difference</option>
                  <option>No-show at handover location</option>
                  <option>Inappropriate conduct or harassment</option>
                  <option>Other campus inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Details & Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="w-full p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              {/* Response Expectations Note per spec */}
              <div className="p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 text-xs text-neutral-secondary space-y-1">
                <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text block">
                  Response Expectations
                </span>
                <p>
                  During the pilot phase, all reports are reviewed manually by student club representatives. Typical response time is under 2 hours between 8 AM and 11 PM.
                </p>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium text-sm transition-colors"
              >
                Submit Problem Report
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
