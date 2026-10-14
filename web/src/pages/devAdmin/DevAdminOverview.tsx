import React, { useState } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';
import { CONFIG_REGISTRY } from '../../services/configRegistry';

interface DevAdminOverviewProps {
  onSelectTab: (tab: string) => void;
  onSelectKey: (key: string) => void;
}

export const DevAdminOverview: React.FC<DevAdminOverviewProps> = ({ onSelectTab, onSelectKey }) => {
  const {
    config,
    activeClock,
    updateClockQuick,
    stageChange,
    isStaged,
    resetKeyToDefault,
    deviations,
    auditLogs,
  } = useDevAdmin();

  // Quick edit clock state in modal/inline
  const [clockTitle, setClockTitle] = useState(activeClock.title);
  const [clockTime, setClockTime] = useState(activeClock.targetTime);
  const [clockDesc, setClockDesc] = useState(activeClock.description);
  const [clockAudience, setClockAudience] = useState(activeClock.audience);
  const [clockEnabled, setClockEnabled] = useState(activeClock.enabled);
  const [clockSavedToast, setClockSavedToast] = useState(false);

  const handleStageClock = (e: React.FormEvent) => {
    e.preventDefault();
    updateClockQuick({
      title: clockTitle,
      targetTime: clockTime,
      description: clockDesc,
      audience: clockAudience,
      enabled: clockEnabled,
    });
    setClockSavedToast(true);
    setTimeout(() => setClockSavedToast(false), 3000);
  };

  const handleApplyClockNow = () => {
    updateClockQuick(
      {
        title: clockTitle,
        targetTime: clockTime,
        description: clockDesc,
        audience: clockAudience,
        enabled: clockEnabled,
      },
      true
    );
    setClockSavedToast(true);
    setTimeout(() => setClockSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Control Room Overview</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              v1.0 Live Control
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Real-time configuration, emergency switches, and campus activity clock management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('diagnostics')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#141A2E] border border-[#27304A] text-[#E6EAF5] hover:bg-[#1B2238] transition-colors flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span>Health: 100% OK (12ms)</span>
          </button>
        </div>
      </div>

      {/* FEATURE HIGHLIGHT: Campus Clock / Timer Control Card */}
      <div className="bg-[#141A2E] border-2 border-indigo-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#27304A]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-lg">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#E6EAF5]">Campus Countdown Clock & Delivery Window</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                    activeClock.enabled
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                  }`}
                >
                  {activeClock.enabled ? '● Active in Student UI' : '○ Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#9AA6C4] mt-0.5">
                Controls the live countdown timer seen by both Customers and Delivery Agents across campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('clock')}
              className="px-3 py-1.5 text-xs font-mono text-indigo-300 hover:text-white bg-indigo-950/50 border border-indigo-700/50 rounded-lg hover:bg-indigo-900/60 transition-colors"
            >
              Advanced Clock Settings →
            </button>
          </div>
        </div>

        {/* Clock Control Form */}
        <form onSubmit={handleStageClock} className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-[#9AA6C4] uppercase font-bold mb-1">
              Timer Purpose / Headline
            </label>
            <input
              type="text"
              value={clockTitle}
              onChange={(e) => setClockTitle(e.target.value)}
              className="w-full bg-[#1B2238] border border-[#27304A] rounded-lg px-3 py-2 text-xs font-medium text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
              placeholder="e.g. Night Errand Curfew Window"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#9AA6C4] uppercase font-bold mb-1">
              Target Time (24h IST)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={clockTime}
                onChange={(e) => setClockTime(e.target.value)}
                className="w-full bg-[#1B2238] border border-[#27304A] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
              />
              <span className="text-xs font-mono text-[#9AA6C4] shrink-0">IST</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#9AA6C4] uppercase font-bold mb-1">
              Display Audience
            </label>
            <select
              value={clockAudience}
              onChange={(e) => setClockAudience(e.target.value as any)}
              className="w-full bg-[#1B2238] border border-[#27304A] rounded-lg px-3 py-2 text-xs font-medium text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
            >
              <option value="both">Both Customers & Helpers</option>
              <option value="customer">Customers Only</option>
              <option value="helper">Delivery Agents Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#9AA6C4] uppercase font-bold mb-1">
              Widget Switch
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={clockEnabled}
                  onChange={(e) => setClockEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1B2238] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-[#27304A]"></div>
                <span className="ml-2 text-xs text-[#E6EAF5]">
                  {clockEnabled ? 'Enabled' : 'Hidden'}
                </span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-[11px] font-mono text-[#9AA6C4] uppercase font-bold mb-1">
              Explanatory Campus Note (Shown to Students)
            </label>
            <input
              type="text"
              value={clockDesc}
              onChange={(e) => setClockDesc(e.target.value)}
              className="w-full bg-[#1B2238] border border-[#27304A] rounded-lg px-3 py-2 text-xs text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
              placeholder="e.g. Hostel gates lock at 9:30 PM. Complete handovers before curfew."
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1 flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1B2238] hover:bg-[#27304A] text-indigo-300 border border-[#27304A] transition-colors"
            >
              Stage Changes
            </button>
            <button
              type="button"
              onClick={handleApplyClockNow}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              Apply Live
            </button>
          </div>
        </form>

        {clockSavedToast && (
          <div className="mt-3 p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <span>✓</span>
            <span>Campus clock updated! Changes reflect live across student and helper screens.</span>
          </div>
        )}
      </div>

      {/* Grid: Kill Switches & Deviations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Kill Switches */}
        <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#27304A]">
            <h3 className="font-bold text-sm text-[#E6EAF5] flex items-center gap-2">
              <span className="text-rose-400">🚨</span>
              <span>Emergency Kill Switches</span>
            </h3>
            <span className="text-[10px] font-mono text-[#9AA6C4] uppercase">Instant Staged Safeguards</span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Kill Switch 1 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1020] border border-[#27304A]">
              <div>
                <span className="text-xs font-semibold text-[#E6EAF5] block">
                  Allow Errand Posting (Customer Post)
                </span>
                <span className="text-[11px] font-mono text-[#9AA6C4]">
                  flag.requests_posting · {config['flag.requests_posting'] ? 'ON' : 'OFF'}
                </span>
              </div>
              <button
                onClick={() => stageChange('flag.requests_posting', !config['flag.requests_posting'])}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  config['flag.requests_posting']
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/40'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/50 hover:bg-rose-900/40'
                }`}
              >
                {config['flag.requests_posting'] ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>

            {/* Kill Switch 2 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1020] border border-[#27304A]">
              <div>
                <span className="text-xs font-semibold text-[#E6EAF5] block">
                  Allow Errand Accepting (Helper Feed)
                </span>
                <span className="text-[11px] font-mono text-[#9AA6C4]">
                  flag.requests_accepting · {config['flag.requests_accepting'] ? 'ON' : 'OFF'}
                </span>
              </div>
              <button
                onClick={() => stageChange('flag.requests_accepting', !config['flag.requests_accepting'])}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  config['flag.requests_accepting']
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/40'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/50 hover:bg-rose-900/40'
                }`}
              >
                {config['flag.requests_accepting'] ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>

            {/* Kill Switch 3 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1020] border border-[#27304A]">
              <div>
                <span className="text-xs font-semibold text-[#E6EAF5] block">
                  Strict Vegetarian Enforcement
                </span>
                <span className="text-[11px] font-mono text-[#9AA6C4]">
                  flag.strict_veg_filter · Campus Mandate
                </span>
              </div>
              <button
                onClick={() => stageChange('flag.strict_veg_filter', !config['flag.strict_veg_filter'])}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  config['flag.strict_veg_filter']
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/40'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/50 hover:bg-rose-900/40'
                }`}
              >
                {config['flag.strict_veg_filter'] ? 'ENFORCED' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Deviations from Defaults */}
        <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#27304A]">
            <h3 className="font-bold text-sm text-[#E6EAF5] flex items-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span>Deviations from Defaults ({deviations.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-[#9AA6C4]">Non-Standard Values</span>
          </div>

          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
            {deviations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9AA6C4] bg-[#0B1020] rounded-lg border border-[#27304A]">
                No deviations detected. All platform settings match codebase defaults.
              </div>
            ) : (
              deviations.map((d) => (
                <div
                  key={d.key}
                  className="p-3 rounded-lg bg-[#0B1020] border border-[#27304A] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono text-indigo-300 font-semibold block">{d.key}</span>
                    <span className="font-mono text-[11px] text-[#9AA6C4]">
                      Current: <strong className="text-white">{String(d.current)}</strong> (Default:{' '}
                      {String(d.default)})
                    </span>
                  </div>
                  <button
                    onClick={() => resetKeyToDefault(d.key)}
                    className="px-2.5 py-1 rounded bg-[#1B2238] hover:bg-[#27304A] text-[#E6EAF5] font-mono text-[11px] border border-[#27304A] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Changes from Audit Log */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#27304A]">
          <h3 className="font-bold text-sm text-[#E6EAF5] flex items-center gap-2">
            <span>📜</span>
            <span>Recent Platform Modifications</span>
          </h3>
          <button
            onClick={() => onSelectTab('audit')}
            className="text-xs font-mono text-indigo-300 hover:text-white"
          >
            Full Audit Log ({auditLogs.length}) →
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#27304A] text-[#9AA6C4]">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Target Key</th>
                <th className="pb-2 font-medium">Actor</th>
                <th className="pb-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27304A]/50 text-[#E6EAF5]">
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-[#1B2238]/50">
                  <td className="py-2.5 text-[#9AA6C4]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action === 'apply'
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : log.action === 'rollback'
                          ? 'bg-amber-950/60 text-amber-400'
                          : 'bg-indigo-950/60 text-indigo-400'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-indigo-300 font-semibold">{log.targetKey || '—'}</td>
                  <td className="py-2.5 text-[#9AA6C4]">{log.actor}</td>
                  <td className="py-2.5 text-neutral-300 truncate max-w-xs">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
