import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  IndianRupee,
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * Merchant-of-record payout console. The platform collected the customer's
 * money, so each completed order leaves a payout the founders owe the helper.
 * The daily ritual: open this panel, tap PAY (opens the founder's UPI app
 * pre-filled — receiver, amount, order reference), approve with PIN, paste the
 * UTR from the bank app, tap Mark paid. ~15 seconds per helper.
 */

interface PayoutRow {
  id: number;
  orderId: number;
  helper: { id: number; name: string; email: string };
  upiId: string;
  upiIdAtCreation: string;
  itemCost: number;
  helperFee: number;
  platformCut: number;
  amount: number;
  status: 'due' | 'paid' | 'cancelled';
  utr: string;
  paidBy: string | null;
  createdAt: string;
  paidAt: string | null;
}

const buildUpiLink = (p: PayoutRow) =>
  `upi://pay?${new URLSearchParams({
    pa: p.upiId,
    pn: p.helper.name,
    am: String(p.amount),
    cu: 'INR',
    tn: `NeedIt payout order #${p.orderId}`,
  }).toString()}`;

export const PayoutsPanel: React.FC = () => {
  const [tab, setTab] = useState<'due' | 'paid'>('due');
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [utrById, setUtrById] = useState<Record<number, string>>({});
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await api.getAdminPayouts(tab));
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Could not load payouts. Staff access required.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const settle = async (p: PayoutRow) => {
    const utr = (utrById[p.id] || '').trim();
    if (!utr) {
      setError(`Paste the UPI reference (UTR) for order #${p.orderId} before marking paid.`);
      return;
    }
    setSettlingId(p.id);
    setError('');
    try {
      await api.markPayoutPaid(p.id, utr);
      setUtrById((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not mark paid.');
    } finally {
      setSettlingId(null);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard unavailable in some browsers — no-op
    }
  };

  const dueTotal = rows.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-indigo" />
            Helper Payouts
          </h2>
          <p className="text-xs text-neutral-secondary mt-1">
            The platform holds the money (merchant of record). Settle helpers daily — one tap per
            person, then paste the UTR from your bank app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-neutral-surface-alt dark:bg-slate-800 p-1 text-xs font-medium">
            {(['due', 'paid'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  tab === t
                    ? 'bg-white dark:bg-slate-900 text-neutral-ink dark:text-white shadow-sm font-bold'
                    : 'text-neutral-secondary'
                }`}
              >
                {t === 'due' ? 'Due' : 'Settled'}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-full border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-brand-indigo transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-card bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {tab === 'due' && !loading && rows.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-card bg-slate-900 text-white">
          <span className="text-xs text-slate-300">
            {rows.length} payout{rows.length === 1 ? '' : 's'} waiting
          </span>
          <span className="font-heading font-extrabold text-xl font-mono flex items-center">
            <IndianRupee className="w-4 h-4" />
            {dueTotal}
          </span>
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="p-10 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-heading font-bold text-neutral-ink dark:text-neutral-dark-text">
            {tab === 'due' ? 'Nothing owed. All helpers settled.' : 'No settled payouts yet.'}
          </p>
          <p className="text-xs text-neutral-secondary mt-1">
            {tab === 'due'
              ? 'Payouts appear here the moment an order completes.'
              : 'Settled payouts keep their UTR and who-paid record here.'}
          </p>
        </div>
      )}

      {tab === 'due' && (
        <div className="space-y-3">
          {rows.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-heading font-bold text-sm text-neutral-ink dark:text-neutral-dark-text">
                    {p.helper.name}
                  </p>
                  <p className="text-[11px] text-neutral-secondary">
                    {p.helper.email} · Order #{p.orderId} ·{' '}
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-extrabold text-2xl font-mono text-brand-indigo flex items-center justify-end">
                    <IndianRupee className="w-5 h-5" />
                    {p.amount}
                  </p>
                  <p className="text-[11px] text-neutral-placeholder">
                    items ₹{p.itemCost} + fee ₹{p.helperFee} − platform ₹{p.platformCut}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <code className="px-2 py-1 rounded bg-neutral-surface-alt dark:bg-slate-800 font-mono text-neutral-ink dark:text-neutral-dark-text">
                  {p.upiId || 'no UPI ID on profile'}
                </code>
                {p.upiId && (
                  <button
                    onClick={() => copy(`upi-${p.id}`, p.upiId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-brand-indigo transition-colors"
                  >
                    {copiedKey === `upi-${p.id}` ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy ID
                  </button>
                )}
                <button
                  onClick={() => copy(`amt-${p.id}`, String(p.amount))}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-brand-indigo transition-colors"
                >
                  {copiedKey === `amt-${p.id}` ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copy ₹{p.amount}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={p.upiId ? buildUpiLink(p) : undefined}
                  aria-disabled={!p.upiId}
                  className={`flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-button font-heading font-bold text-sm transition-colors ${
                    p.upiId
                      ? 'bg-brand-indigo text-white hover:opacity-90'
                      : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-placeholder cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Pay ₹{p.amount} — opens your UPI app
                </a>
                <input
                  value={utrById[p.id] || ''}
                  onChange={(e) =>
                    setUtrById((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  placeholder="UTR from your bank app"
                  className="sm:w-56 h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
                <button
                  onClick={() => settle(p)}
                  disabled={settlingId === p.id}
                  className="h-11 px-4 rounded-button bg-emerald-600 text-white font-heading font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {settlingId === p.id ? 'Saving…' : 'Mark paid'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'paid' && (
        <div className="space-y-2">
          {rows.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-heading font-bold text-sm text-neutral-ink dark:text-neutral-dark-text">
                  {p.helper.name} · ₹{p.amount}
                </p>
                <p className="text-[11px] text-neutral-secondary">
                  Order #{p.orderId} · {p.paidAt ? new Date(p.paidAt).toLocaleString() : ''} · by{' '}
                  {p.paidBy || '—'}
                </p>
              </div>
              <code className="text-[11px] px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono self-start">
                UTR {p.utr}
              </code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PayoutsPanel;
