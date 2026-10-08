import React from 'react';
import { Clock, Package, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { useWebApp } from '../../context/WebAppContext';

interface OrderHistoryProps {
  onNavigate: (path: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onNavigate }) => {
  const { orders } = useWebApp();
  const historyOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Order History Archive
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Private record of all your completed and closed campus deliveries.
        </p>
      </div>

      <div className="space-y-3">
        {historyOrders.length === 0 ? (
          <div className="p-12 text-center rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3">
            <Package className="w-10 h-10 text-neutral-placeholder mx-auto" />
            <h3 className="font-heading font-semibold text-neutral-ink dark:text-neutral-dark-text text-base">
              No Archived Orders
            </h3>
            <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
              Completed campus errands and closed requests will appear here for your personal reference.
            </p>
            <button
              onClick={() => onNavigate('/app/post')}
              className="mt-2 h-10 px-5 rounded-btn bg-brand-indigo text-white text-xs font-semibold"
            >
              Post a Request
            </button>
          </div>
        ) : (
          historyOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onNavigate(`/app/orders/${order.id}`)}
              className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-placeholder">
                    #{order.id}
                  </span>
                  <StatusChip status={order.status} size="sm" />
                  <span className="text-xs text-neutral-secondary">{order.createdAt}</span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-neutral-ink dark:text-neutral-dark-text block">
                    ₹{order.totalCost}
                  </span>
                  <span className="text-[11px] text-neutral-secondary">
                    Helper: {order.helperName || 'None'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-indigo transition-colors">
                    {order.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                  </h3>
                  <p className="text-xs text-neutral-secondary mt-0.5">
                    Drop-off: {order.pickupPoint}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-brand-indigo dark:text-brand-indigo-darkmode font-medium">
                  <span>View receipt</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {order.cancellationReason && (
                <div className="p-2.5 rounded-lg bg-neutral-surface-alt dark:bg-slate-800 text-[11px] text-neutral-secondary border border-neutral-border dark:border-slate-700">
                  Notice: {order.cancellationReason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
