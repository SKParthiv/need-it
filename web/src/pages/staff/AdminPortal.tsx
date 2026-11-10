import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useWebApp } from '../../context/WebAppContext';

export const AdminPortal: React.FC = () => {
  const { currentUser } = useWebApp();
  const [overview, setOverview] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser.isStaff) return;
    Promise.all([api.getAdminOverview(), api.getAdminReports()])
      .then(([nextOverview, nextReports]) => {
        setOverview(nextOverview);
        setReports(nextReports.reports || []);
      })
      .catch((err) => setError(err?.message || 'Could not load staff data.'));
  }, [currentUser.isStaff]);

  if (!currentUser.isStaff) {
    return <div className="max-w-2xl mx-auto p-8 text-center">Staff access required.</div>;
  }

  const resolveReport = async (id: number) => {
    try {
      await api.resolveAdminReport(id, 'dismissed');
      setReports((items) => items.map((item) => item.id === id ? { ...item, status: 'dismissed' } : item));
    } catch (err: any) {
      setError(err?.message || 'Could not update the report.');
    }
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-700" />
          <h1 className="font-heading font-extrabold text-2xl">Staff portal</h1>
        </div>
        <p className="text-sm text-neutral-secondary mt-1">Authenticated staff operations only.</p>
      </div>
      {error && <div role="alert" className="p-3 rounded-card bg-rose-50 text-rose-800 text-sm">{error}</div>}
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ['Open orders', overview?.openOrders],
          ['Active orders', overview?.activeOrders],
          ['Users', overview?.totalUsers],
          ['Open reports', overview?.pendingReports],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card border border-neutral-border bg-white p-4">
            <p className="text-xs text-neutral-secondary">{label}</p>
            <p className="text-2xl font-bold mt-1">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <section className="rounded-card border border-neutral-border bg-white p-5">
        <h2 className="font-bold mb-4">Report review</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-neutral-secondary">No reports to review.</p>
        ) : reports.map((report) => (
          <div key={report.id} className="border-b border-neutral-border pb-3 mb-3 last:border-0">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{report.issueType}</p>
                <p className="text-sm text-neutral-secondary">{report.details}</p>
              </div>
              {report.status === 'open' ? (
                <button className="text-sm text-brand-indigo" onClick={() => resolveReport(report.id)}>
                  Mark dismissed
                </button>
              ) : <CheckCircle2 className="w-5 h-5 text-semantic-success" />}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
