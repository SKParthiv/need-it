import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
  Camera,
  AlertCircle,
  Loader2,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useWebApp } from '../../context/WebAppContext';
import { api } from '../../services/api';

interface ReportProblemPageProps {
  onNavigate: (path: string) => void;
}

interface FiledReport {
  id: number;
  orderReference: number;
  issueType: string;
  details: string;
  photoUrl?: string;
  priority: string;
  status: string;
  createdAt: string;
}

const ISSUE_TYPES = [
  'Item missing or damaged',
  'Price dispute',
  'No-show at handover',
  'Inappropriate behavior',
  'Other',
];

export const ReportProblemPage: React.FC<ReportProblemPageProps> = ({ onNavigate }) => {
  const { orders } = useWebApp();
  const [selectedOrder, setSelectedOrder] = useState(orders[0]?.id || '');
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [details, setDetails] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);
  const [reportsList, setReportsList] = useState<FiledReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's existing reports
  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await api.getMyReports();
      if (res && Array.isArray(res.reports)) {
        setReportsList(res.reports);
      }
    } catch (err) {
      console.warn('Could not load reports history:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Update selected order if orders load later
  useEffect(() => {
    if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0].id);
    }
  }, [orders, selectedOrder]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    setErrorMsg('');
    setAttachedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setAttachedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericOrderId = parseInt(selectedOrder, 10);
    if (isNaN(numericOrderId)) {
      setErrorMsg('Please select an order to report.');
      return;
    }

    if (!details.trim()) {
      setErrorMsg('Please provide details explaining the problem.');
      return;
    }

    setIsSubmitting(true);
    let uploadedPhotoUrl: string | undefined = undefined;

    if (attachedFile) {
      try {
        uploadedPhotoUrl = await api.uploadEvidencePhoto(attachedFile);
      } catch (uploadErr: any) {
        console.warn('Photo upload failed:', uploadErr);
        // Requirement 6 & 15: If photo upload is unavailable (e.g. 503), allow text-only report
        setErrorMsg('Photo upload unavailable; proceeding to submit text report.');
      }
    }

    try {
      const res = await api.fileReport({
        orderId: numericOrderId,
        issueType,
        details: details.trim(),
        photoUrl: uploadedPhotoUrl || '',
      });
      setCreatedTicketId(res.id);
      loadReports();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not file report. Please verify order details.');
    } finally {
      setIsSubmitting(false);
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
        {createdTicketId ? (
          <div className="p-8 text-center rounded-panel bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-heading font-bold text-lg text-emerald-900 dark:text-emerald-300">
              Problem Report Logged
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed max-w-sm mx-auto">
              Your ticket reference is{' '}
              <strong className="font-mono text-sm">#REP-{createdTicketId}</strong>. The student
              council team has flagged this order and will reach out via in-app chat or college email
              within 2 hours.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCreatedTicketId(null);
                  setDetails('');
                  handleRemovePhoto();
                }}
                className="h-10 px-4 rounded-btn border border-neutral-border hover:bg-neutral-surface-alt text-xs font-semibold"
              >
                File Another Report
              </button>
              <button
                onClick={() => onNavigate('/app/home')}
                className="h-10 px-6 rounded-btn bg-brand-indigo text-white text-xs font-semibold"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-card bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Select Order *
              </label>
              {orders.length === 0 ? (
                <div className="p-3 rounded-input bg-neutral-surface-alt text-neutral-secondary">
                  No active orders found to report.
                </div>
              ) : (
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {o.items.map((it) => it.name).join(', ')} ({o.status})
                    </option>
                  ))}
                </select>
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
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
                placeholder="Explain clearly what happened (e.g. wrong item, price didn't match receipt, no-show)..."
                className="w-full p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Attach Photo Evidence (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="flex items-center gap-3 p-3 bg-neutral-surface-alt dark:bg-slate-800 rounded-xl border border-neutral-border">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover border"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold truncate block">
                      {attachedFile?.name}
                    </span>
                    <span className="text-[10px] text-neutral-secondary">
                      Ready to upload with report
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1 rounded-full hover:bg-neutral-border/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-14 rounded-input border-2 border-dashed border-neutral-border dark:border-slate-700 flex items-center justify-center gap-2 text-neutral-secondary hover:text-neutral-ink hover:bg-neutral-surface-alt"
                >
                  <Camera className="w-4 h-4" />
                  <span>Upload receipt photo or damaged item picture</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || orders.length === 0}
              className="w-full h-12 rounded-btn bg-semantic-danger hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket to Moderators...</span>
                </>
              ) : (
                <span>Submit Ticket to Club Moderators</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* REPORT HISTORY LIST (Req 15) */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 shadow-e2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-indigo" />
            <span>My Filed Reports</span>
          </h2>
          <span className="text-xs text-neutral-secondary">
            {reportsList.length} report{reportsList.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoadingReports ? (
          <div className="py-6 text-center text-xs text-neutral-secondary flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading your reports history...</span>
          </div>
        ) : reportsList.length === 0 ? (
          <p className="text-xs text-neutral-secondary text-center py-4">
            You haven't filed any reports yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reportsList.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-ink dark:text-neutral-dark-text">
                      #REP-{r.id}
                    </span>
                    <span className="text-neutral-placeholder">•</span>
                    <span className="text-neutral-secondary">Order #{r.orderReference}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : r.status === 'Investigating'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <p className="font-semibold text-neutral-ink dark:text-neutral-dark-text">
                  {r.issueType}
                </p>
                <p className="text-neutral-secondary whitespace-pre-wrap">{r.details}</p>

                {r.photoUrl && (
                  <a
                    href={r.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-indigo font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Evidence Photo</span>
                  </a>
                )}

                <div className="flex items-center gap-1 text-[10px] text-neutral-placeholder pt-1">
                  <Clock className="w-3 h-3" />
                  <span>Filed on {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
