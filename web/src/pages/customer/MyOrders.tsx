import React, { useState } from 'react';
import { StatusChip } from '../../components/common/StatusChip';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { useWebApp } from '../../context/WebAppContext';
import { PlusCircle, Package, Clock, MapPin, ChevronRight } from 'lucide-react';

interface MyOrdersProps {
  onNavigate: (path: string) => void;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ onNavigate }) => {
  const { orders } = useWebApp();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const activeOrders = orders.filter(
    (o) => o.status === 'open' || o.status === 'accepted' || o.status === 'purchased' || o.status === 'handed_over'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
            My Campus Orders
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary">
            Track live orders, inspect receipts, and review past deliveries.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/app/post')}
          className="h-10 px-4 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Tabs: Active / Past (Section 6.3) */}
      <div className="flex border-b border-neutral-border dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-brand-indigo text-brand-indigo dark:text-brand-indigo-darkmode'
              : 'border-transparent text-neutral-secondary hover:text-neutral-ink'
          }`}
        >
          <span>Active Orders</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20">
            {activeOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'past'
              ? 'border-brand-indigo text-brand-indigo dark:text-brand-indigo-darkmode'
              : 'border-transparent text-neutral-secondary hover:text-neutral-ink'
          }`}
        >
          <span>Past Deliveries</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary">
            {pastOrders.length}
          </span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {displayedOrders.length === 0 ? (
          <div className="p-12 text-center rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3">
            <Package className="w-10 h-10 text-neutral-placeholder mx-auto" />
            <h3 className="font-heading font-semibold text-neutral-ink dark:text-neutral-dark-text text-base">
              No {activeTab} orders right now
            </h3>
            <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'Need snacks, study notes, or pharmacy supplies? Post your first campus request.'
                : 'Completed and closed orders will appear here for your private reference.'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => onNavigate('/app/post')}
                className="mt-2 h-10 px-5 rounded-btn bg-brand-indigo text-white text-xs font-semibold"
              >
                Post a Request
              </button>
            )}
          </div>
        ) : (
          displayedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onNavigate(`/app/orders/${order.id}`)}
              className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-neutral-placeholder">
                    #{order.id}
                  </span>
                  <StatusChip status={order.status} size="sm" />
                  {order.isUrgent && <StatusChip status="urgent" size="sm" />}
                  {order.isWaitingLong && <StatusChip status="waiting_long" size="sm" />}
                </div>

                <div className="text-xs text-neutral-secondary flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Needed by: {order.neededBy}</span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-indigo transition-colors">
                    {order.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                  </h3>
                  <p className="text-xs text-neutral-secondary flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                    <span>Drop-off: {order.pickupPoint}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-base text-neutral-ink dark:text-neutral-dark-text block">
                    ₹{order.totalCost}
                  </span>
                  <span className="text-[11px] text-brand-teal font-medium">
                    Helper fee: ₹{order.helperFee}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-neutral-secondary">
                <div className="flex items-center gap-2">
                  {order.helperName ? (
                    <div className="flex items-center gap-1.5">
                      <span>Helper: <strong className="text-neutral-ink dark:text-neutral-dark-text">{order.helperName}</strong></span>
                      <VerifiedBadge size="sm" showText={false} />
                    </div>
                  ) : (
                    <span>Waiting for verified helper to accept</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-brand-indigo dark:text-brand-indigo-darkmode font-medium">
                  <span>Open order view</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
