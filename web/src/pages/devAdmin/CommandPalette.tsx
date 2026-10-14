import React, { useState, useEffect } from 'react';
import { CONFIG_REGISTRY, RegistryItem } from '../../services/configRegistry';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKey: (key: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectKey,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredKeys = Object.entries(CONFIG_REGISTRY).filter(([k, item]) => {
    const q = query.toLowerCase();
    return (
      k.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const pages = [
    { id: 'overview', name: 'Overview & Platform Health', icon: '📊' },
    { id: 'clock', name: 'Campus Clock & Delivery Window', icon: '⏳' },
    { id: 'flags', name: 'Feature Flags & Kill Switches', icon: '🚩' },
    { id: 'settings', name: 'Platform Settings & Fee Caps', icon: '⚙️' },
    { id: 'maintenance', name: 'Maintenance Mode Controller', icon: '🛡️' },
    { id: 'diagnostics', name: 'Diagnostics & Latency Grid', icon: '🩺' },
    { id: 'audit', name: 'Audit Log & Reversible Rollback', icon: '📜' },
  ].filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#141A2E] border border-[#27304A] rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#27304A] bg-[#0B1020]">
          <svg className="w-5 h-5 text-indigo-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a config key (e.g. clock.target_time, fees.max) or page..."
            className="w-full bg-transparent text-sm text-[#E6EAF5] placeholder-[#9AA6C4] focus:outline-none font-mono"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#1B2238] text-[#9AA6C4] rounded border border-[#27304A]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#27304A]/50">
          {/* Quick Page Navigation */}
          {pages.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#9AA6C4] px-3 mb-1 block">
                Workbenches
              </span>
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onNavigateTab(p.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm text-[#E6EAF5] hover:bg-[#1B2238] transition-colors"
                >
                  <span>{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Config Registry Keys */}
          {filteredKeys.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#9AA6C4] px-3 mb-1 block">
                Configuration Keys ({filteredKeys.length})
              </span>
              {filteredKeys.slice(0, 10).map(([k, item]) => (
                <button
                  key={k}
                  onClick={() => {
                    onSelectKey(k);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-sm hover:bg-[#1B2238] transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
                      {k}
                    </span>
                    <span className="text-xs text-[#9AA6C4] truncate max-w-md">
                      {item.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#0B1020] border border-[#27304A] text-[#9AA6C4]">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        item.risk === 'H'
                          ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                          : item.risk === 'M'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      }`}
                    >
                      {item.risk}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredKeys.length === 0 && pages.length === 0 && (
            <div className="py-8 text-center text-sm text-[#9AA6C4]">
              No matching config keys or workbenches found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
