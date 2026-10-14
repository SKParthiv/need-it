import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useWebApp } from '../../context/WebAppContext';
import { api } from '../../services/api';

interface ReportProblemPageProps {
  onNavigate: (path: string) => void;
}

export const ReportProblemPage: React.FC<ReportProblemPageProps> = ({ onNavigate }) => {
  const { orders, role } = useWebApp();
  const reportableOrders = orders.filter((o) => o.helperId || o.status !== 'open');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [issueType, setIssueType] = useState('Item missing or damaged');
  const [details, setDetails] = useState('');
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const orderId = parseInt(selectedOrder, 10);
    if (!orderId) {
      setSubmitError('Pick the order this report is about.');
      return;
    }
    setSubmitting(true);
    try {
      const report = await api.fileReport({ orderId, issueType, details: details.trim() });
      setSubmittedId(report.id);
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not file the report. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/app/home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Report a Problem to Club Team
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Student club moderators inspect chat receipts and mediate all peer issues manually.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
        {submittedId !== null ? (
          <div className="p-8 text-center rounded-panel bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-heading font-bold text-lg text-emerald-900 dark:text-emerald-300">
              Problem Report Logged
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed max-w-sm mx-auto">
              Your ticket reference is <strong className="font-mono text-sm">#REP-{submittedId}</strong>. The admin team can see it in the console and will reach out via the order chat.
            </p>
            <button
              onClick={() => onNavigate('/app/home')}
              className="mt-2 h-10 px-6 rounded-btn bg-brand-indigo text-white text-xs font-semibold"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Select Order *
              </label>
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm"
              >
                <option value="">— choose an order —</option>
                {reportableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.items.map((it) => it.name).join(', ')} ({o.status})
                  </option>
                ))}
              </select>
              {reportableOrders.length === 0 && (
                <p className="mt-1 text-[11px] text-neutral-secondary">
                  Reports attach to an order you've {role === 'helper' ? 'accepted' : 'had accepted'}. For anything else, use the Contact page.
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Issue Category *
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm"
              >
                <option>Item missing or damaged</option>
                <option>Price dispute</option>
                <option>No-show at handover</option>
                <option>Inappropriate behavior</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-input bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-btn bg-semantic-danger hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Ticket to Club Moderators'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
