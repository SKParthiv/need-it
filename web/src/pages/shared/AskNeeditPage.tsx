import React, { useState } from 'react';
import { Sparkles, Search, MapPin, Star, CheckCircle, Store, ArrowRight } from 'lucide-react';
import { mockShops } from '../../data/mockData';

interface AskNeeditPageProps {
  onNavigate: (path: string) => void;
}

export const AskNeeditPage: React.FC<AskNeeditPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-indigo-light text-brand-indigo text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus AI Assistant</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
            Ask NEEDIT: Campus Shop Discovery
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary">
            Find where to purchase items around campus with real-time peer pricing.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/app/helper/shops')}
          className="h-10 px-4 rounded-btn border border-brand-teal/40 bg-brand-teal-light text-brand-teal text-xs font-semibold flex items-center gap-1.5"
        >
          <Store className="w-4 h-4" />
          <span>Add New Shop Info</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-neutral-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search campus essentials and shops"
          className="w-full h-12 pl-10 pr-4 rounded-btn bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo shadow-sm"
        />
      </div>

      {/* Suggested Shops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockShops.map((shop) => (
          <div
            key={shop.id}
            className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-shadow space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                  {shop.name}
                </h3>
                <p className="text-xs text-neutral-secondary flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                  {shop.location} • <span className="font-semibold">{shop.distance}</span>
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{shop.rating}</span>
                <span className="text-neutral-placeholder font-normal">({shop.reviewCount})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] text-neutral-secondary block font-semibold">
                Reported Items & Prices:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {shop.popularItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded bg-neutral-surface-alt dark:bg-slate-800 text-neutral-body dark:text-slate-200"
                  >
                    {item.name}: ~₹{item.estimatedPrice}
                  </span>
                ))}
              </div>
            </div>

            {/* Confirm / Correct buttons (Section 8.4 & 16) */}
            <div className="pt-3 border-t border-dashed border-neutral-border dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-placeholder">Community verified</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Thanks for confirming!')}
                  className="px-2.5 py-1 rounded-input border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-medium flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> Confirm Accurate
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/app/helper/shops')}
                  className="px-2.5 py-1 rounded-input border border-neutral-border text-neutral-secondary text-xs hover:bg-neutral-surface-alt"
                >
                  Correct Info
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
