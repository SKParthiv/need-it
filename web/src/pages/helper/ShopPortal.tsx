import React, { useState } from 'react';
import { Store, Plus, MapPin, CheckCircle2, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { mockShops } from '../../data/mockData';

interface ShopPortalProps {
  onNavigate: (path: string) => void;
}

export const ShopPortal: React.FC<ShopPortalProps> = ({ onNavigate }) => {
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [category, setCategory] = useState('Stationery');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShopName('');
      setLocation('');
      setDistance('');
      setItemName('');
      setItemPrice('');
    }, 3000);
  };

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal-light text-brand-teal text-xs font-semibold mb-2">
          <Store className="w-3.5 h-3.5" />
          <span>Campus Knowledge Feeder</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Helper Shop Portal
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Add nearby shops, items bought, and retail prices to train the "Ask NEEDIT" campus chatbot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form: Add a Shop (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
          <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
            Add Store & Price Knowledge
          </h3>

          {submitted ? (
            <div className="p-6 rounded-card bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-heading font-bold text-sm text-emerald-900 dark:text-emerald-300">
                Entry Added to Shop Database!
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                This store will now be recommended to requesters by the campus AI assistant.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                    Location / Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                    Distance from Campus
                  </label>
                  <input
                    type="text"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm"
                >
                  <option>Stationery & Xerox</option>
                  <option>Food & Snacks</option>
                  <option>Personal Care & Pharmacy</option>
                  <option>Academic Supplies & Hardware</option>
                </select>
              </div>

              <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 space-y-2">
                <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text block">
                  Add an Item Bought Here (Feeds Price Estimates)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-secondary mb-1">Item Name</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-input bg-white dark:bg-slate-900 border border-neutral-border dark:border-slate-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-secondary mb-1">Retail Price (₹)</label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-input bg-white dark:bg-slate-900 border border-neutral-border dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-btn bg-brand-teal hover:bg-brand-teal-dark active:scale-[0.98] text-white font-semibold text-xs shadow-sm transition-all duration-150"
              >
                Submit Store Details to Database
              </button>
            </form>
          )}
        </div>

        {/* Existing Database Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
              Active Shop Database
            </h3>
            <span className="text-xs text-brand-teal font-semibold">
              {mockShops.length} Stores Verified
            </span>
          </div>

          <div className="space-y-3">
            {mockShops.map((shop) => (
              <div
                key={shop.id}
                className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                      {shop.name}
                    </h4>
                    <p className="text-xs text-neutral-secondary flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                      {shop.location}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-[11px]">
                  {shop.popularItems.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary">
                      {p.name}: ₹{p.estimatedPrice}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
