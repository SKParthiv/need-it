import React, { useState } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';
import { CONFIG_REGISTRY, RegistryItem } from '../../services/configRegistry';

interface DevAdminFlagsProps {
  onSelectKey?: (key: string) => void;
}

export const DevAdminFlags: React.FC<DevAdminFlagsProps> = ({ onSelectKey }) => {
  const { config, stageChange, isStaged, resetKeyToDefault } = useDevAdmin();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const flagEntries = Object.entries(CONFIG_REGISTRY).filter(
    ([_, item]) => item.category === 'flags'
  );

  const filtered = flagEntries.filter(([k, item]) => {
    if (filterRisk !== 'all' && item.risk !== filterRisk) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        k.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.safeOffBehaviour && item.safeOffBehaviour.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Feature Flags & Platform Kill Switches</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              E4 Runtime Switches
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Safely disable individual campus features without code deployments. All off-states have documented safe fallbacks.
          </p>
        </div>

        <div className="text-xs font-mono text-[#9AA6C4]">
          <span>Registered Flags: <strong className="text-white">{flagEntries.length}</strong></span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141A2E] p-3 rounded-xl border border-[#27304A]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter flags by name or behavior..."
          className="w-full sm:w-72 bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-1.5 text-xs text-[#E6EAF5] placeholder-[#9AA6C4] focus:outline-none focus:border-indigo-400 font-mono"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-mono text-[#9AA6C4]">Risk:</span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-[#0B1020] border border-[#27304A] rounded-lg px-2.5 py-1.5 text-xs text-[#E6EAF5] focus:outline-none font-mono"
          >
            <option value="all">All Risk Levels</option>
            <option value="H">High Risk (Kill Switches)</option>
            <option value="M">Medium Risk</option>
            <option value="L">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-[#27304A]/60">
          {filtered.map(([key, item]) => {
            const currentValue = Boolean(config[key]);
            const staged = isStaged(key);
            const isDefault = currentValue === item.default;

            return (
              <div
                key={key}
                onClick={() => onSelectKey?.(key)}
                className="p-4 sm:p-5 hover:bg-[#1B2238]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-[#0B1020] px-2 py-0.5 rounded border border-[#27304A]">
                      {key}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.risk === 'H'
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                          : item.risk === 'M'
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                      }`}
                    >
                      {item.risk} Risk
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2238] text-[#9AA6C4]">
                      {item.effect.toUpperCase()}
                    </span>
                    {staged && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                        STAGED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#E6EAF5] font-medium font-sans">
                    {item.description}
                  </p>

                  {item.safeOffBehaviour && (
                    <div className="text-[11px] text-[#9AA6C4] flex items-center gap-1.5">
                      <span className="text-amber-400 font-mono">Safe-Off:</span>
                      <span>{item.safeOffBehaviour}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#9AA6C4] uppercase font-mono">Reach:</span>
                    {item.reach.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0B1020] border border-[#27304A] text-[#9AA6C4]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Switch Control */}
                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => resetKeyToDefault(key)}
                      className="px-2 py-1 rounded bg-[#0B1020] hover:bg-[#1B2238] text-[#9AA6C4] hover:text-white text-xs font-mono border border-[#27304A] transition-colors"
                      title="Reset to codebase default"
                    >
                      Reset ({String(item.default)})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => stageChange(key, !currentValue)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all shadow-sm flex items-center gap-2 ${
                      currentValue
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-700/60 hover:bg-rose-900/60'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        currentValue ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>{currentValue ? 'ENABLED' : 'DISABLED'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
