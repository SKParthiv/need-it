import React, { useState } from 'react';
import {
  Compass,
  Filter,
  Zap,
  Clock,
  MapPin,
  Calendar,
  Store,
  ChevronRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { useWebApp } from '../../context/WebAppContext';

interface RequestFeedProps {
  onNavigate: (path: string) => void;
}

export const RequestFeed: React.FC<RequestFeedProps> = ({ onNavigate }) => {
  const { orders, addOrder } = useWebApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [newestOrderId, setNewestOrderId] = useState<string | null>(null);

  // Section 10.4: Simulate new incoming request in feed
  const simulateIncomingRequest = () => {
    const newOrd = addOrder({
      customerName: 'Karthik R.',
      customerAlias: 'Student #5120',
      customerHostel: 'Hostel Block C',
      pickupPoint: 'Hostel Block C Lobby',
      category: 'Food',
      items: [
        {
          id: `item-${Date.now()}`,
          name: 'Hot Paneer Roll + Maaza',
          category: 'Food',
          quantity: 2,
          expectedPrice: 40,
          status: 'pending'
        }
      ],
      neededBy: 'Today, 8:45 PM',
      itemCost: 80,
      helperFee: 30,
      totalCost: 110,
      isUrgent: true,
      isWaitingLong: false,
      status: 'open',
      sizeTag: 'S',
      suggestedStore: 'KC Canteen'
    });
    setNewestOrderId(newOrd.id);
  };

  // Filter only OPEN requests (locked and completed are hidden per Section 7.1)
  const openRequests = orders.filter((o) => o.status === 'open');

  const filteredRequests = openRequests.filter((req) => {
    if (selectedCategory !== 'All' && req.category !== selectedCategory) return false;
    if (selectedSize !== 'All' && req.sizeTag !== selectedSize) return false;
    if (urgentOnly && !req.isUrgent) return false;
    return true;
  });

  // Group by category per Section 7.1 ("Same-category requests grouped")
  const categoriesPresent = Array.from(new Set(filteredRequests.map((r) => r.category)));

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header with Availability Shortcut */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
              Live Campus Request Feed
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-teal animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-neutral-secondary">
            Open student requests waiting for a peer heading to local shops.
          </p>
        </div>

        {/* Action Buttons: Availability & Section 10.4 Live Incoming Order Simulation */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={simulateIncomingRequest}
            title="Demonstrate Section 10.4: Slides in from top with brief indigo-tint highlight"
            className="h-10 px-3.5 rounded-btn bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 dark:text-brand-indigo-darkmode border border-brand-indigo/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-brand-indigo/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
            <span>Simulate Live Order (+1)</span>
          </button>

          <button
            onClick={() => onNavigate('/app/helper/availability')}
            className="h-10 px-4 rounded-btn bg-brand-teal-light text-brand-teal dark:bg-brand-teal/20 dark:text-emerald-300 border border-brand-teal/30 text-xs font-semibold flex items-center gap-2 hover:bg-brand-teal/15 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>I'm Going Out</span>
          </button>
        </div>
      </div>

      {/* Sticky Filter Chips (Section 6.4 & 7.1) */}
      <div className="p-3.5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-neutral-secondary flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Category Pills */}
        {['All', 'Food', 'Snacks', 'Personal care', 'Stationery', 'Academic supplies'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full transition-colors font-medium ${
              selectedCategory === cat
                ? 'bg-brand-teal text-white font-semibold'
                : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-body dark:text-slate-300 hover:bg-neutral-border'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="h-4 w-px bg-neutral-border mx-1" />

        {/* Urgent Only Filter */}
        <button
          onClick={() => setUrgentOnly(!urgentOnly)}
          className={`px-3 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1 ${
            urgentOnly
              ? 'bg-semantic-danger text-white font-semibold'
              : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-body dark:text-slate-300 hover:bg-neutral-border'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Urgent Only</span>
        </button>

        {/* Size Filter */}
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="h-8 px-2.5 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-body dark:text-slate-300"
        >
          <option value="All">All Sizes (S/M/L)</option>
          <option value="S">Small (S)</option>
          <option value="M">Medium (M)</option>
          <option value="L">Large (L)</option>
        </select>
      </div>

      {/* Feed Cards Grouped by Category (Section 7.1) */}
      <div className="space-y-8">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3">
            <Compass className="w-10 h-10 text-neutral-placeholder mx-auto" />
            <h3 className="font-heading font-semibold text-neutral-ink dark:text-neutral-dark-text text-base">
              No open requests match your filter
            </h3>
            <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
              Check back soon or broadcast your walking route using the "Going Out" feature.
            </p>
          </div>
        ) : (
          categoriesPresent.map((catName) => {
            const catRequests = filteredRequests.filter((r) => r.category === catName);

            return (
              <div key={catName} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-neutral-border dark:border-slate-800 pb-2">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-brand-teal dark:text-emerald-400">
                    {catName}
                  </h3>
                  <span className="text-xs text-neutral-secondary font-mono">
                    ({catRequests.length} {catRequests.length === 1 ? 'request' : 'requests'})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => onNavigate(`/app/helper/feed/${req.id}`)}
                      className={`p-5 rounded-card bg-white dark:bg-neutral-dark-card border shadow-e1 hover:shadow-e2 transition-all cursor-pointer space-y-3 group ${
                        req.id === newestOrderId ? 'new-request-enter border-brand-indigo ring-2 ring-brand-indigo/30' : ''
                      } ${
                        req.isUrgent
                          ? 'border-l-4 border-l-semantic-danger border-neutral-border dark:border-slate-800'
                          : req.isWaitingLong
                          ? 'border-l-4 border-l-semantic-warning border-neutral-border dark:border-slate-800'
                          : 'border-neutral-border dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-placeholder">
                            #{req.id}
                          </span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary">
                            Size {req.sizeTag}
                          </span>
                          {req.isUrgent && <StatusChip status="urgent" size="sm" />}
                          {req.isWaitingLong && <StatusChip status="waiting_long" size="sm" />}
                        </div>

                        {/* Helper Fee Highlight (Section 7.1) */}
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-neutral-secondary font-semibold block">
                            Helper Fee
                          </span>
                          <span className="font-heading font-extrabold text-lg text-brand-teal dark:text-emerald-400 font-mono">
                            ₹{req.helperFee}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-teal transition-colors">
                          {req.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </h4>
                        <p className="text-xs text-neutral-secondary flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                          <span>Deliver to: {req.pickupPoint}</span>
                        </p>
                      </div>

                      {req.suggestedStore && (
                        <div className="text-xs text-neutral-secondary flex items-center gap-1.5 pt-1">
                          <Store className="w-3.5 h-3.5 text-neutral-placeholder" />
                          <span>Suggested Store: <strong>{req.suggestedStore}</strong></span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-neutral-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Needed: {req.neededBy}</span>
                        </div>

                        <span className="font-semibold text-brand-teal flex items-center gap-1">
                          Review request <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
