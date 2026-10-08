import React from 'react';
import {
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Package,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { useWebApp } from '../../context/WebAppContext';

interface CustomerHomeProps {
  onNavigate: (path: string) => void;
  onOpenAskNeedit: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onNavigate,
  onOpenAskNeedit
}) => {
  const { orders, currentUser } = useWebApp();

  // Find active order & waiting long order
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
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Greeting & Hero Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-panel bg-gradient-to-r from-brand-indigo to-indigo-700 text-white shadow-e2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl">
              Hello, {firstName}!
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20 font-semibold backdrop-blur-sm">
              {currentUser.hostel || 'SASTRA University'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-brand-indigo-light opacity-90">
            Need something from local stores? Post a request for peers to deliver.
          </p>
        </div>

        {/* Big "Post a request" Button per spec */}
        <button
          onClick={() => onNavigate('/app/post')}
          className="w-full sm:w-auto h-12 px-6 rounded-btn bg-white hover:bg-neutral-surface-alt text-brand-indigo font-heading font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-brand-indigo" />
          <span>Post a Request</span>
        </button>
      </div>

      {/* 2. Waiting-Long Alert Banner (if any) per spec 6.1 & 16 */}
      {waitingLongOrder && (
        <div className="p-4 rounded-card bg-semantic-warning-tint/70 dark:bg-semantic-warning/15 border border-semantic-warning/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 text-semantic-warning shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-semantic-warning">
                  Order #{waitingLongOrder.id} has been waiting 40+ minutes
                </span>
                <span className="text-[10px] font-mono uppercase bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold text-amber-800 dark:text-amber-200">
                  Waiting long
                </span>
              </div>
              <p className="text-neutral-secondary dark:text-slate-300 mt-0.5">
                Helpers might be hesitant with current timing or fee. You can adjust the parameters to speed up acceptance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onNavigate(`/app/orders/${waitingLongOrder.id}`)}
              className="flex-1 sm:flex-initial h-9 px-3.5 rounded-btn bg-semantic-warning text-white font-medium text-xs hover:bg-amber-800 transition-colors"
            >
              Edit Time / Raise Fee
            </button>
          </div>
        </div>
      )}

      {/* 3. Active Order Card or Empty Card */}
      {activeOrder ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
              Active Campus Delivery
            </h2>
            <button
              onClick={() => onNavigate('/app/orders')}
              className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
            >
              View all orders →
            </button>
          </div>

          <div
            onClick={() => onNavigate(`/app/orders/${activeOrder.id}`)}
            className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-all cursor-pointer space-y-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-placeholder">
                    #{activeOrder.id}
                  </span>
                  <StatusChip status={activeOrder.status} size="sm" />
                </div>
                <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text mt-1 group-hover:text-brand-indigo transition-colors">
                  {activeOrder.items.map((it) => it.name).join(', ')}
                </h3>
                <p className="text-xs text-neutral-secondary flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                  <span>Pickup: {activeOrder.pickupPoint}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono font-extrabold text-base text-neutral-ink dark:text-neutral-dark-text block">
                  ₹{activeOrder.totalCost}
                </span>
                <span className="text-[11px] text-brand-teal font-medium">
                  Fee: ₹{activeOrder.helperFee}
                </span>
              </div>
            </div>

            {/* Helper Attribution & Handover Code Preview */}
            <div className="pt-3 border-t border-neutral-border dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center font-bold text-xs">
                  {activeOrder.helperName?.slice(0, 1) || 'H'}
                </div>
                <div>
                  <span className="text-neutral-secondary">Helper: </span>
                  <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text">
                    {activeOrder.helperName || 'Awaiting Helper'}
                  </span>
                </div>
                <VerifiedBadge size="sm" showText={false} />
              </div>

              <div className="flex items-center gap-2 text-brand-indigo dark:text-brand-indigo-darkmode font-medium">
                <span>Manage order & chat</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-brand-indigo-light dark:bg-brand-indigo/20 flex items-center justify-center text-brand-indigo">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
              No active campus requests
            </h3>
            <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
              Need snacks, stationery, pharmacy supplies, or groceries? Post a request in under 60 seconds and a peer heading out will bring it.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/app/post')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Request</span>
          </button>
        </div>
      )}

      {/* 4. "Ask NEEDIT" Shortcut Banner per spec 6.1 */}
      <div className="p-4 rounded-card bg-brand-indigo-light/50 dark:bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
              Not sure where to find an item on campus?
            </h3>
            <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
              Ask our student helper database for store locations, stock availability, and prices.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAskNeedit}
          className="h-9 px-4 rounded-btn bg-brand-indigo text-white text-xs font-semibold hover:bg-brand-indigo-dark transition-colors shrink-0"
        >
          Ask NEEDIT
        </button>
      </div>

      {/* 5. Recent Orders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
            Recent Orders
          </h2>
          <button
            onClick={() => onNavigate('/app/history')}
            className="text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
          >
            History archive →
          </button>
        </div>

        <div className="space-y-2">
          {pastOrders.length === 0 ? (
            <div className="p-5 rounded-card bg-neutral-surface-alt/50 dark:bg-slate-800/40 border border-neutral-border dark:border-slate-800 text-center text-xs text-neutral-secondary">
              No completed orders yet. Your delivery receipts will appear here after handovers.
            </div>
          ) : (
            pastOrders.slice(0, 2).map((order) => (
              <div
                key={order.id}
                onClick={() => onNavigate(`/app/orders/${order.id}`)}
                className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-neutral-disabled cursor-pointer transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-placeholder">#{order.id}</span>
                    <StatusChip status={order.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-medium text-neutral-ink dark:text-neutral-dark-text">
                    {order.items.map((it) => it.name).join(', ')}
                  </h4>
                  <p className="text-[11px] text-neutral-secondary">
                    {order.createdAt} • Handover at {order.pickupPoint}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm text-neutral-ink dark:text-neutral-dark-text block">
                    ₹{order.totalCost}
                  </span>
                  <span className="text-[11px] text-brand-indigo font-medium">Details →</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
