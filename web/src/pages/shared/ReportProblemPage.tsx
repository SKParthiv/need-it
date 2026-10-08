import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import { useWebApp } from '../../context/WebAppContext';

interface ReportProblemPageProps {
  onNavigate: (path: string) => void;
}

export const ReportProblemPage: React.FC<ReportProblemPageProps> = ({ onNavigate }) => {
  const { orders } = useWebApp();
  const [selectedOrder, setSelectedOrder] = useState('general');
  const [issueType, setIssueType] = useState('Item missing or damaged');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
        {submitted ? (
          <div className="p-8 text-center rounded-panel bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-heading font-bold text-lg text-emerald-900 dark:text-emerald-300">
              Problem Report Logged
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed max-w-sm mx-auto">
              Your ticket Reference is <strong className="font-mono text-sm">#REP-304</strong>. The student council team has flagged this order and will reach out via in-app chat or college email within 2 hours.
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
                <option value="general">General Campus Inquiry / Not order specific</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.items.map((it) => it.name).join(', ')} ({o.status})
                  </option>
                ))}
              </select>
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
                <option>Price dispute / Unapproved price difference</option>
                <option>No-show at handover campus location</option>
                <option>Inappropriate peer conduct or communication</option>
                <option>Other issue</option>
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

            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Attach Photo Evidence (Optional)
              </label>
              <button
                type="button"
                onClick={() => alert('Simulating photo attachment...')}
                className="w-full h-14 rounded-input border-2 border-dashed border-neutral-border dark:border-slate-700 flex items-center justify-center gap-2 text-neutral-secondary hover:text-neutral-ink hover:bg-neutral-surface-alt"
              >
                <Camera className="w-4 h-4" />
                <span>Upload receipt photo or damaged item picture</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-btn bg-semantic-danger hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              Submit Ticket to Club Moderators
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
