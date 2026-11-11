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
import { useWebApp } from '../../context/WebAppContext';

interface CustomerHomeProps {
  onNavigate: (path: string) => void;
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Primary Hero: Post a New Request */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-panel bg-gradient-to-r from-brand-indigo to-indigo-700 text-white shadow-e2">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl">
              Hello, {firstName}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/20 font-semibold backdrop-blur-sm">
              {currentUser.hostel || 'Campus Hostel'}
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Order #{waitingLongOrder.id} has been waiting 40+ minutes
                </span>
                <span className="text-[10px] font-mono uppercase bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold text-amber-800 dark:text-amber-200">
                  Waiting long
                </span>
              </div>
              <p className="text-neutral-secondary dark:text-slate-300 mt-0.5">
                Helpers might be hesitant with current timing or fee. You can adjust parameters to speed up acceptance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onNavigate(`/app/orders/${waitingLongOrder.id}`)}
              className="flex-1 sm:flex-initial h-9 px-4 rounded-btn bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shadow-sm"
            >
              Open Order Details
            </button>
          </div>
        </div>
      )}

      {/* 3. Active Delivery & Chat Access */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-base sm:text-lg text-neutral-ink dark:text-neutral-dark-text">
            Active Campus Delivery
          </h2>
          <button
            onClick={() => onNavigate('/app/orders')}
            className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
          >
            View all orders →
          </button>
        </div>

        {activeOrder ? (
          <div className="p-5 sm:p-6 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-all space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-placeholder">
                    #{activeOrder.id}
                  </span>
                  <StatusChip status={activeOrder.status} size="sm" />
                </div>
                <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                  {activeOrder.items.map((it) => it.name).join(', ')}
                </h3>
                <p className="text-xs text-neutral-secondary flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                  <span>Handover Spot: {activeOrder.pickupPoint}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono font-extrabold text-xl text-neutral-ink dark:text-neutral-dark-text block">
                  ₹{activeOrder.totalCost}
                </span>
                <span className="text-xs text-brand-teal font-semibold">
                  Fee: ₹{activeOrder.helperFee}
                </span>
              </div>
            </div>

            {/* Helper Attribution & Prominent Chat Action Button */}
            <div className="pt-4 border-t border-neutral-border dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center font-bold text-xs">
                  {activeOrder.helperName?.slice(0, 1) || 'H'}
                </div>
                <div>
                  <span className="text-neutral-secondary text-[11px]">Delivery Agent: </span>
                  <strong className="text-neutral-ink dark:text-neutral-dark-text font-semibold block sm:inline">
                    {activeOrder.helperName || 'Awaiting Delivery Helper'}
                  </strong>
                </div>
                <VerifiedBadge size="sm" showText={false} />
              </div>

              {/* Prominent Chat & Order Action */}
              <button
                type="button"
                onClick={() => onNavigate(`/app/orders/${activeOrder.id}`)}
                className="w-full sm:w-auto h-10 px-5 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Order Chat & Updates</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-indigo-light dark:bg-brand-indigo/20 flex items-center justify-center text-brand-indigo">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                No active campus requests
              </h3>
              <p className="text-xs text-neutral-secondary max-w-sm mx-auto leading-relaxed">
                Need snacks, stationery, pharmacy supplies, or books? Post a request in under a minute and a peer heading out will bring it.
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
