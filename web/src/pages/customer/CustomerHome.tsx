import React from 'react';
import {
  PlusCircle,
  Clock,
  Package,
  ChevronRight,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { CampusClockWidget } from '../../components/common/CampusClockWidget';
import { useWebApp } from '../../context/WebAppContext';

interface CustomerHomeProps {
  onNavigate: (path: string) => void;
  onOpenAskNeedit?: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onNavigate,
}) => {
  const { orders, currentUser } = useWebApp();

  // Find active orders and waiting long order
  const activeOrder = orders.find(
    (o) =>
      o.status === 'purchased' ||
      o.status === 'accepted' ||
      o.status === 'handed_over' ||
      o.status === 'open'
  );
  const waitingLongOrder = orders.find((o) => o.isWaitingLong && o.status === 'open');
  const pastOrders = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  const firstName = currentUser.name.split(' ')[0] || 'Student';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Campus Activity Clock Widget */}
      <CampusClockWidget currentRole="customer" />

      {/* 1. Primary Hero: Post a New Request */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-panel bg-gradient-to-r from-brand-indigo to-indigo-700 text-white shadow-e2">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl">
              Hello, {firstName}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/20 font-semibold backdrop-blur-sm">
              {currentUser.hostel || 'SASTRA University'}
            </span>
          </div>
          <p className="text-sm text-brand-indigo-light opacity-95 leading-relaxed">
            Need something from campus stores or canteens? Post your request and a peer will deliver it.
          </p>
        </div>

        {/* Primary Call to Action Button */}
        <button
          onClick={() => onNavigate('/app/post')}
          className="w-full sm:w-auto h-12 px-7 rounded-btn bg-white hover:bg-neutral-surface-alt text-brand-indigo font-heading font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2.5 transition-transform active:scale-95 shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-brand-indigo" />
          <span>Post a New Request</span>
        </button>
      </div>

      {/* 2. Waiting-Long Alert Banner (if any) */}
      {waitingLongOrder && (
        <div className="p-4 rounded-card bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 block">
                Order #{waitingLongOrder.id} is waiting for a helper
              </span>
              <p className="text-neutral-secondary dark:text-slate-300 mt-0.5">
                Helpers haven't picked this up yet. You can adjust the delivery timing or raise the fee.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate(`/app/orders/${waitingLongOrder.id}`)}
            className="w-full sm:w-auto h-9 px-4 rounded-btn bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0"
          >
            Update Request
          </button>
        </div>
      )}

      {/* 3. CURRENT ORDER & CHAT WITH DELIVERY AGENT (Immediately follows Post Request) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-neutral-ink dark:text-neutral-dark-text">
              Current Order & Chat
            </h2>
            {activeOrder && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <button
            onClick={() => onNavigate('/app/orders')}
            className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline flex items-center gap-1"
          >
            <span>All orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeOrder ? (
          <div className="p-5 sm:p-6 rounded-panel bg-white dark:bg-neutral-dark-card border-2 border-brand-indigo/30 dark:border-brand-indigo/40 shadow-e2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-border dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary">
                  #{activeOrder.id}
                </span>
                <StatusChip status={activeOrder.status} size="sm" />
                <span className="text-xs text-neutral-secondary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeOrder.neededBy}</span>
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-neutral-secondary block">Total to Pay</span>
                <span className="font-mono font-extrabold text-lg sm:text-xl text-neutral-ink dark:text-neutral-dark-text">
                  ₹{activeOrder.totalCost}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  {activeOrder.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                </h3>
                <p className="text-xs text-neutral-secondary flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                  <span>Pickup: {activeOrder.pickupPoint}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center font-bold text-xs">
                    {activeOrder.helperName?.slice(0, 1) || 'H'}
                  </div>
                  <span className="text-xs text-neutral-secondary">
                    Helper: <strong className="text-neutral-ink dark:text-white">{activeOrder.helperName || 'Finding a student helper...'}</strong>
                  </span>
                  {activeOrder.helperName && <VerifiedBadge size="sm" showText={false} />}
                </div>
              </div>

              {/* Big, Prominent Chat Button with 1-click access */}
              <button
                type="button"
                onClick={() => onNavigate(`/app/orders/${activeOrder.id}`)}
                className="w-full sm:w-auto h-12 px-6 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-heading font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-transform active:scale-95 shrink-0"
              >
                <MessageSquare className="w-5 h-5 text-white" />
                <span>Open Chat with Delivery Agent</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-indigo-light dark:bg-brand-indigo/20 flex items-center justify-center text-brand-indigo">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                No active orders right now
              </h3>
              <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
                Post a request when you need items from the canteen or stores. A student heading out will deliver to your block.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/app/post')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Request</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Recent Deliveries & Orders */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-base sm:text-lg text-neutral-ink dark:text-neutral-dark-text">
            Recent Orders
          </h2>
          <button
            onClick={() => onNavigate('/app/history')}
            className="text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
          >
            View history →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pastOrders.length === 0 ? (
            <div className="col-span-full p-6 rounded-card bg-neutral-surface-alt/50 dark:bg-slate-800/40 border border-neutral-border dark:border-slate-800 text-center text-xs text-neutral-secondary">
              No completed orders yet. Your past orders and receipts will show here.
            </div>
          ) : (
            pastOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                onClick={() => onNavigate(`/app/orders/${order.id}`)}
                className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 hover:border-brand-indigo/40 shadow-sm cursor-pointer transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-neutral-placeholder">#{order.id}</span>
                    <StatusChip status={order.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-indigo transition-colors line-clamp-1">
                    {order.items.map((it) => it.name).join(', ')}
                  </h4>
                  <p className="text-[11px] text-neutral-secondary">
                    {order.pickupPoint}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-neutral-ink dark:text-white">
                    ₹{order.totalCost}
                  </span>
                  <span className="text-brand-indigo font-semibold flex items-center gap-1 group-hover:underline">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Chat</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
