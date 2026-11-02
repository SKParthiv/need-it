import React, { useState } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Lock,
  Package
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { useWebApp } from '../../context/WebAppContext';

interface RequestDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
  onAcceptOrder: (orderId: string) => void;
}

export const RequestDetail: React.FC<RequestDetailProps> = ({
  orderId,
  onNavigate,
  onAcceptOrder
}) => {
  const { getOrderById, updateOrderStatus, currentUser } = useWebApp();
  const order = getOrderById(orderId);
  const [alreadyAcceptedByOther, setAlreadyAcceptedByOther] = useState(false);

  if (!order) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-surface-alt dark:bg-slate-800 flex items-center justify-center text-neutral-secondary">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
          Request No Longer Available
        </h2>
        <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
          This errand request may have been completed, cancelled, or accepted by another peer.
        </p>
        <button
          onClick={() => onNavigate('/app/helper/feed')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-teal text-white text-xs font-semibold shadow-sm hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Request Feed</span>
        </button>
      </div>
    );
  }

  const [isLocking, setIsLocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLocking(true);
    setErrorMsg(null);
    try {
      await updateOrderStatus(order.id, 'accepted', {
        helperName: currentUser.name,
        helperId: currentUser.email,
      });
      onAcceptOrder(order.id);
      onNavigate(`/app/helper/jobs/${order.id}`);
    } catch (err: any) {
      setIsLocking(false);
      const msg = err?.message || '';
      if (
        err?.status === 409 ||
        msg.includes('409') ||
        msg.toLowerCase().includes('already taken') ||
        msg.toLowerCase().includes('conflict')
      ) {
        setAlreadyAcceptedByOther(true);
      } else {
        setErrorMsg(msg || 'Failed to accept request. Please try again.');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-28">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/app/helper/feed')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Request Feed</span>
      </button>

      {/* "No Longer Available" Notice if someone accepted first */}
      {alreadyAcceptedByOther && (
        <div className="p-4 rounded-card bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-1">
            <span className="font-bold block">No longer available</span>
            <p>
              Another verified student helper accepted this request a moment ago.
            </p>
            <button
              onClick={() => onNavigate('/app/helper/feed')}
              className="text-brand-indigo font-bold underline mt-1 block"
            >
              Return to request feed →
            </button>
          </div>
        </div>
      )}

      {/* Other error notice */}
      {errorMsg && !alreadyAcceptedByOther && (
        <div className="p-4 rounded-card bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <span className="font-bold block">Could not accept request</span>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Request Card */}
      <div className={`bg-white dark:bg-neutral-dark-card rounded-panel border p-6 sm:p-8 shadow-e2 space-y-6 transition-all duration-300 ${
        isLocking
          ? 'border-2 border-brand-teal ring-4 ring-brand-teal/20 scale-[1.01]'
          : 'border-neutral-border dark:border-neutral-dark-border'
      }`}>
        {/* Header with Fee Highlight */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-border dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-neutral-placeholder">
                #{order.id}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-teal-light text-brand-teal">
                Category: {order.category}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary">
                Size {order.sizeTag}
              </span>
              {order.isUrgent && <StatusChip status="urgent" size="sm" />}
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-neutral-ink dark:text-neutral-dark-text mt-1.5">
              {order.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
            </h1>
          </div>

          <div className="p-3.5 rounded-card bg-brand-teal-light/60 dark:bg-brand-teal/20 border border-brand-teal/30 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-brand-teal block">
              You Earn (Helper Fee)
            </span>
            <span className="font-heading font-extrabold text-2xl font-mono text-brand-teal-dark dark:text-emerald-300">
              ₹{order.helperFee}
            </span>
          </div>
        </div>

        {/* Detailed Item List */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm text-neutral-ink dark:text-neutral-dark-text">
            Requested Items & Notes
          </h3>
          <div className="space-y-2">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 flex justify-between items-center text-xs"
              >
                <div>
                  <strong className="font-semibold text-neutral-ink dark:text-neutral-dark-text text-sm block">
                    {it.name}
                  </strong>
                  <span className="text-neutral-secondary">
                    Quantity: {it.quantity} • Expected price: ~₹{it.expectedPrice}
                  </span>
                  {it.notes && (
                    <p className="text-[11px] text-brand-indigo dark:text-brand-indigo-darkmode mt-0.5">
                      Note: "{it.notes}"
                    </p>
                  )}
                </div>
                <span className="font-mono font-bold text-neutral-ink dark:text-neutral-dark-text">
                  ₹{it.expectedPrice * it.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Logistics Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 space-y-1">
            <span className="text-neutral-secondary font-semibold block">Campus Handover Location</span>
            <p className="font-medium text-neutral-ink dark:text-neutral-dark-text flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
              {order.pickupPoint}
            </p>
          </div>

          <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 space-y-1">
            <span className="text-neutral-secondary font-semibold block">Delivery Timing</span>
            <p className="font-medium text-neutral-ink dark:text-neutral-dark-text flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-indigo" />
              {order.neededBy}
            </p>
          </div>

          {order.suggestedStore && (
            <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 space-y-1 sm:col-span-2">
              <span className="text-neutral-secondary font-semibold block">Suggested Store</span>
              <p className="font-medium text-neutral-ink dark:text-neutral-dark-text flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-neutral-placeholder" />
                {order.suggestedStore}
              </p>
            </div>
          )}
        </div>

        {/* Safety Reassurance */}
        <div className="p-3.5 rounded-card bg-brand-teal-light/40 dark:bg-brand-teal/10 border border-brand-teal/20 text-xs text-brand-teal space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Safe Payment Guarantee</span>
          </div>
          <p className="text-neutral-secondary">
            The customer pays you via UPI before you purchase anything at the shop. You never have to spend your own money.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-[200] p-4 bg-white/95 dark:bg-neutral-dark-card/95 backdrop-blur-md border-t border-neutral-border dark:border-neutral-dark-border shadow-e3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden xs:block">
            <span className="text-[11px] text-neutral-secondary block">Your Delivery Earnings</span>
            <span className="font-heading font-extrabold text-xl font-mono text-brand-teal">
              ₹{order.helperFee}
            </span>
          </div>

          <button
            onClick={handleAccept}
            disabled={isLocking || alreadyAcceptedByOther}
            className={`flex-1 sm:flex-initial sm:min-w-[280px] h-12 px-6 rounded-btn text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isLocking || alreadyAcceptedByOther
                ? 'bg-neutral-muted cursor-not-allowed text-neutral-secondary'
                : 'bg-brand-teal hover:bg-brand-teal-dark'
            }`}
          >
            <Lock className={`w-4 h-4 ${isLocking ? 'animate-lock-morph text-emerald-300' : ''}`} />
            <span>
              {isLocking
                ? 'Accepting Order...'
                : alreadyAcceptedByOther
                ? 'Already Accepted by Peer'
                : 'Accept Order'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
