import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Search,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  Store
} from 'lucide-react';
import { mockShops } from '../../data/mockData';

interface AskNeeditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const AskNeeditModal: React.FC<AskNeeditModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const suggestedPrompts = [
    'Where can I get engineering graph paper?',
    'Cheapest place for late night snacks?',
    'Emergency OTC paracetamol or band-aids?',
    'Xerox and project binding near Library?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex justify-end">
      {/* Scrim backdrop (Section 10.4: Scrim fades 280ms) */}
      <div
        className="fixed inset-0 bg-neutral-ink/40 backdrop-blur-sm modal-backdrop-anim"
        onClick={onClose}
      />

      {/* Sheet / Drawer panel (Section 10.4: 400ms slide enter) */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-dark-card h-full shadow-e3 flex flex-col z-10 overflow-hidden border-l border-neutral-border dark:border-neutral-dark-border sheet-slide-right">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-border dark:border-neutral-dark-border flex items-center justify-between bg-neutral-surface-alt/60 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-indigo text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-neutral-ink dark:text-neutral-dark-text text-base">
                  Ask NEEDIT
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 dark:text-brand-indigo-darkmode">
                  Campus AI Assistant
                </span>
              </div>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
                Suggestions powered by student helpers & shop database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-secondary hover:text-neutral-ink hover:bg-neutral-border/60 transition-colors"
            aria-label="Close Ask NEEDIT"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Welcome chat bubble */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-indigo/10 text-brand-indigo flex items-center justify-center shrink-0 mt-1">
              <Store className="w-4 h-4" />
            </div>
            <div className="bg-brand-indigo-light dark:bg-brand-indigo/15 rounded-2xl rounded-tl-sm p-4 text-sm text-neutral-ink dark:text-neutral-dark-text max-w-[85%] border border-brand-indigo/10">
              <p className="font-medium mb-1">Looking for something specific near campus?</p>
              <p className="text-neutral-secondary dark:text-neutral-dark-secondary text-xs">
                Ask where to buy items, check estimated prices, or get nearby shop recommendations verified by campus peers.
              </p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div>
            <span className="text-xs font-semibold text-neutral-secondary dark:text-neutral-dark-secondary uppercase tracking-wider block mb-2">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setQuery(prompt);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-chip border text-left transition-colors ${
                    selectedPrompt === prompt
                      ? 'bg-brand-indigo text-white border-brand-indigo'
                      : 'bg-white dark:bg-slate-800 text-neutral-body dark:text-neutral-dark-text border-neutral-border dark:border-neutral-dark-border hover:bg-neutral-surface-alt'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Nearby Shop Results */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-secondary dark:text-neutral-dark-secondary uppercase tracking-wider">
                Recommended Campus Shops
              </span>
              <span className="text-xs text-brand-teal font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Peer Verified
              </span>
            </div>

            <div className="space-y-3">
              {mockShops.map((shop) => (
                <div
                  key={shop.id}
                  className="p-4 rounded-card border border-neutral-border dark:border-neutral-dark-border bg-white dark:bg-slate-800/80 shadow-e1 hover:shadow-e2 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                        {shop.name}
                      </h4>
                      <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                        {shop.location} • <span className="font-medium text-neutral-body dark:text-slate-300">{shop.distance}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{shop.rating}</span>
                      <span className="text-neutral-placeholder font-normal">({shop.reviewCount})</span>
                    </div>
                  </div>

                  {/* Popular items chips */}
                  <div className="mt-3 pt-3 border-t border-neutral-border/60 dark:border-slate-700/60">
                    <span className="text-[11px] text-neutral-secondary dark:text-neutral-dark-secondary block mb-1.5">
                      Frequently bought here:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {shop.popularItems.map((item, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-neutral-surface-alt dark:bg-slate-700/80 px-2 py-0.5 rounded text-neutral-body dark:text-slate-200"
                        >
                          {item.name} (~₹{item.estimatedPrice})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Community Confirm / Correct buttons */}
                  <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-dashed border-neutral-border/60 dark:border-slate-700/60">
                    <span className="text-[11px] text-neutral-placeholder">Information accurate?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-medium rounded-input border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate?.('/app/helper/shops');
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded-input border border-neutral-border dark:border-slate-700 text-neutral-secondary dark:text-neutral-dark-secondary hover:bg-neutral-surface-alt transition-colors"
                      >
                        Correct
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-input bg-brand-teal-light/40 dark:bg-brand-teal/10 border border-brand-teal/20 text-xs text-brand-teal flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Students who deliver can add new shops and item prices at the <button onClick={() => { onClose(); onNavigate?.('/app/helper/shops'); }} className="underline font-semibold">Helper Shop Portal</button>.
            </p>
          </div>
        </div>

        {/* Search bar input footer */}
        <div className="p-4 border-t border-neutral-border dark:border-neutral-dark-border bg-white dark:bg-neutral-dark-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Ask where to find an item on campus"
                className="w-full h-11 pl-9 pr-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-4 rounded-btn bg-brand-indigo text-white text-sm font-medium hover:bg-brand-indigo-dark transition-colors shrink-0"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
