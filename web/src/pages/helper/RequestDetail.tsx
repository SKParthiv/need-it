import React, { useState } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
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

  const handleAccept = () => {
    // Section 10.4: Accept request (lock): card gets teal border, lock icon morphs in, confirms exclusivity
    setIsLocking(true);
    setTimeout(() => {
      updateOrderStatus(order.id, 'accepted', {
        helperName: currentUser.name,
        helperId: currentUser.email,
      });
      onAcceptOrder(order.id);
      onNavigate(`/app/helper/jobs/${order.id}`);
    }, 350);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-28">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/app/helper/feed')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Request Feed</span>
      </button>

      {/* "No Longer Available" Notice if someone accepted first (Section 7.2) */}
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

      {/* Main Request Card (Section 10.4: Card gets teal border on lock) */}
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

          <div className="p-3 rounded-card bg-brand-teal-light/60 dark:bg-brand-teal/20 border border-brand-teal/30 text-right shrink-0">
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
                      Note from requester: "{it.notes}"
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
            <span className="text-neutral-secondary font-semibold block">Needed By</span>
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

        {/* Safety & Honor Reassurance */}
        <div className="p-3 rounded-card bg-brand-teal-light/40 dark:bg-brand-teal/10 border border-brand-teal/20 text-xs text-brand-teal space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Cash Fronting Guarantee</span>
          </div>
          <p className="text-neutral-secondary">
            You will send the store’s QR code in chat; the requester pays the cashier directly before you leave the shop.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Action Bar per Section 6.3 & 7.2 */}
      <div className="fixed bottom-0 inset-x-0 z-[200] p-4 bg-white/95 dark:bg-neutral-dark-card/95 backdrop-blur-md border-t border-neutral-border dark:border-neutral-dark-border shadow-e3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden xs:block">
            <span className="text-[11px] text-neutral-secondary block">Helper Earnings</span>
            <span className="font-heading font-extrabold text-xl font-mono text-brand-teal">
              ₹{order.helperFee}
            </span>
          </div>

          <button
            onClick={handleAccept}
            disabled={isLocking}
            className={`flex-1 sm:flex-initial sm:min-w-[280px] h-12 px-6 rounded-btn text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isLocking
                ? 'bg-brand-teal-dark scale-[0.98]'
                : 'bg-brand-teal hover:bg-brand-teal-dark'
            }`}
          >
            <Lock className={`w-4 h-4 ${isLocking ? 'animate-lock-morph text-emerald-300' : ''}`} />
            <span>{isLocking ? 'Locking Request Exclusively...' : 'Accept Request (Locks It)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
