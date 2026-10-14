import React, { useState, useEffect } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';
import { CONFIG_REGISTRY, RegistryItem } from '../../services/configRegistry';
import { DevAdminOverview } from './DevAdminOverview';
import { DevAdminClock } from './DevAdminClock';
import { DevAdminFlags } from './DevAdminFlags';
import { DevAdminSettings } from './DevAdminSettings';
import { DevAdminMaintenance } from './DevAdminMaintenance';
import { DevAdminDiagnostics } from './DevAdminDiagnostics';
import { DevAdminAudit } from './DevAdminAudit';
import { CommandPalette } from './CommandPalette';

interface DevAdminLayoutProps {
  onNavigate: (path: string) => void;
}

export const DevAdminLayout: React.FC<DevAdminLayoutProps> = ({ onNavigate }) => {
  const {
    config,
    stagedChanges,
    stagedCount,
    unstageChange,
    clearStagedChanges,
    applyStagedChanges,
    stageChange,
    resetKeyToDefault,
    activeClock,
  } = useDevAdmin();

  const [activeTab, setActiveTab] = useState<'overview' | 'clock' | 'flags' | 'settings' | 'maintenance' | 'diagnostics' | 'audit'>('overview');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyReason, setApplyReason] = useState('Dev admin configuration update');
  const [applyResultMsg, setApplyResultMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Sparkline data mock
  const [latency] = useState(12);

  const selectedItem: RegistryItem | undefined = selectedKey ? CONFIG_REGISTRY[selectedKey] : undefined;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyStagedChanges(applyReason);
    if (res.success) {
      setApplyResultMsg({ type: 'ok', text: 'All staged changes applied atomically!' });
      setApplyModalOpen(false);
      setApplyReason('Dev admin configuration update');
    } else {
      setApplyResultMsg({
        type: 'err',
        text: `Apply failed: ${res.errors?.join(', ') || 'Validation error'}`,
      });
    }
    setTimeout(() => setApplyResultMsg(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E6EAF5] flex flex-col font-sans selection:bg-indigo-500/30">
      {/* 1. STATE STRIP (Permanent top bar) */}
      <header className="h-12 bg-[#0B1020] border-b border-[#27304A] px-4 flex items-center justify-between text-xs font-mono select-none sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded font-bold bg-cyan-950/80 text-[#38BDF8] border border-cyan-800/50">
            LOCAL
          </span>
          <div className="flex items-center gap-1.5 text-[#E6EAF5]">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="font-semibold">Platform OK</span>
          </div>
          <span className="text-[#27304A]">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-indigo-300">
            <span>⏳ Clock:</span>
            <span className="font-bold text-white">{activeClock.targetTime} IST</span>
            <span className="text-[10px] text-[#9AA6C4]">({activeClock.enabled ? 'Active' : 'Off'})</span>
          </div>
          <span className="hidden md:inline text-[#27304A]">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-[#9AA6C4]">
            <span>DB Latency:</span>
            <span className="text-[#4ADE80] font-semibold">{latency}ms</span>
            <span className="text-[10px] text-neutral-500">▁▂▁▃▁</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141A2E] border border-[#27304A] text-[#9AA6C4] hover:text-[#E6EAF5] hover:border-indigo-500/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
            </svg>
            <span className="text-[11px]">Search keys...</span>
            <kbd className="px-1.5 py-0.2 text-[9px] bg-[#1B2238] rounded border border-[#27304A]">
              Ctrl+K
            </kbd>
          </button>

          {/* Staged counter pill */}
          {stagedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse">
              {stagedCount} staged
            </span>
          )}

          <span className="text-[#9AA6C4] hidden lg:inline">
            130180058@sastra.ac.in
          </span>

          <button
            onClick={() => onNavigate('/app/home')}
            className="px-2.5 py-1 rounded text-xs font-sans font-semibold bg-[#1B2238] hover:bg-[#27304A] border border-[#27304A] text-indigo-300 transition-colors"
          >
            Exit to App ↗
          </button>
        </div>
      </header>

      {/* Result toast message */}
      {applyResultMsg && (
        <div
          className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b ${
            applyResultMsg.type === 'ok'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/80 text-rose-300 border-rose-800'
          }`}
        >
          <span>{applyResultMsg.text}</span>
          <button onClick={() => setApplyResultMsg(null)} className="text-white hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE (Rail + Workbench + Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail (width 220px) */}
        <aside className="w-56 shrink-0 bg-[#0B1020] border-r border-[#27304A] p-3 flex flex-col justify-between hidden md:flex">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-wider uppercase text-[#9AA6C4]">
              Workbenches
            </div>

            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'clock', label: 'Campus Clock', icon: '⏳' },
              { id: 'flags', label: 'Feature Flags', icon: '🚩' },
              { id: 'settings', label: 'Platform Settings', icon: '⚙️' },
              { id: 'maintenance', label: 'Maintenance', icon: '🛡️' },
              { id: 'diagnostics', label: 'Diagnostics', icon: '🩺' },
              { id: 'audit', label: 'Audit & Rollback', icon: '📜' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#141A2E] text-white font-semibold border-l-2 border-indigo-400'
                      : 'text-[#9AA6C4] hover:text-[#E6EAF5] hover:bg-[#1B2238]/60'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 bg-[#141A2E] rounded-lg border border-[#27304A] text-[11px] font-mono text-[#9AA6C4]">
            <div className="text-white font-bold mb-1">Sri Thinesh</div>
            <div className="text-[10px] text-indigo-300">Lead Dev Super Admin</div>
            <div className="text-[10px] text-neutral-500 mt-2">NEEDIT Control Room v1.0</div>
          </div>
        </aside>

        {/* Workbench (Current Page View) */}
        <main className="flex-1 p-6 overflow-y-auto max-w-5xl">
          {activeTab === 'overview' && (
            <DevAdminOverview
              onSelectTab={(t) => setActiveTab(t as any)}
              onSelectKey={(k) => {
                setSelectedKey(k);
                setInspectorOpen(true);
              }}
            />
          )}

          {activeTab === 'clock' && <DevAdminClock />}

          {activeTab === 'audit' && <DevAdminAudit />}

          {activeTab === 'flags' && (
            <DevAdminFlags
              onSelectKey={(k) => {
                setSelectedKey(k);
                setInspectorOpen(true);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <DevAdminSettings
              onSelectKey={(k) => {
                setSelectedKey(k);
                setInspectorOpen(true);
              }}
            />
          )}

          {activeTab === 'maintenance' && <DevAdminMaintenance />}

          {activeTab === 'diagnostics' && <DevAdminDiagnostics />}
        </main>

        {/* 3. INSPECTOR (Collapsible right panel) */}
        {inspectorOpen && (
          <aside className="w-80 shrink-0 bg-[#0B1020] border-l border-[#27304A] p-4 flex flex-col justify-between hidden xl:flex">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27304A]">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9AA6C4]">
                  Key Inspector
                </span>
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="text-xs text-[#9AA6C4] hover:text-white"
                >
                  ✕
                </button>
              </div>

              {selectedItem ? (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[#9AA6C4] uppercase block">Registry Key</span>
                    <span className="font-bold text-indigo-300 break-all">{selectedItem.key}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#9AA6C4] uppercase block">Description</span>
                    <span className="text-[#E6EAF5] font-sans">{selectedItem.description}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27304A]">
                    <div>
                      <span className="text-[10px] text-[#9AA6C4] uppercase block">Type</span>
                      <span className="text-white font-bold">{selectedItem.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9AA6C4] uppercase block">Risk</span>
                      <span
                        className={`font-bold ${
                          selectedItem.risk === 'H'
                            ? 'text-rose-400'
                            : selectedItem.risk === 'M'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {selectedItem.risk} Level
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27304A]">
                    <div>
                      <span className="text-[10px] text-[#9AA6C4] uppercase block">Effect</span>
                      <span className="text-white">{selectedItem.effect}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9AA6C4] uppercase block">Default</span>
                      <span className="text-white font-bold">{String(selectedItem.default)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#27304A]">
                    <span className="text-[10px] text-[#9AA6C4] uppercase block">Reach</span>
                    <div className="flex gap-1 mt-1">
                      {selectedItem.reach.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-[#141A2E] border border-[#27304A] text-[#9AA6C4]"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedItem.safeOffBehaviour && (
                    <div className="pt-2 border-t border-[#27304A]">
                      <span className="text-[10px] text-[#9AA6C4] uppercase block">Safe-off Behaviour</span>
                      <span className="text-xs font-sans text-neutral-300">
                        {selectedItem.safeOffBehaviour}
                      </span>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={() => resetKeyToDefault(selectedItem.key)}
                      className="w-full py-1.5 rounded bg-[#1B2238] hover:bg-[#27304A] text-[#E6EAF5] text-xs font-mono border border-[#27304A] transition-colors"
                    >
                      Stage Reset to Default
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#9AA6C4]">
                  Select any config key or control row to inspect its type, reach, and risk envelope.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 4. STAGING TRAY (Docked at bottom) */}
      {stagedCount > 0 && (
        <div className="h-14 bg-[#141A2E] border-t-2 border-indigo-500/60 px-4 flex items-center justify-between sticky bottom-0 z-40 shadow-2xl animate-slideUp">
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
              ⚡ {stagedCount} change{stagedCount > 1 ? 's' : ''} staged:
            </span>

            <div className="flex items-center gap-2">
              {Object.entries(stagedChanges).map(([k, newVal]) => {
                const oldVal = config[k];
                return (
                  <div
                    key={k}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B1020] border border-[#27304A] text-xs font-mono shrink-0"
                  >
                    <span className="text-indigo-300 font-semibold">{k}:</span>
                    <span className="text-[#9AA6C4] line-through">{String(oldVal)}</span>
                    <span className="text-neutral-500">→</span>
                    <span className="text-white font-bold">{String(newVal)}</span>
                    <button
                      onClick={() => unstageChange(k)}
                      className="ml-1 text-[#9AA6C4] hover:text-white"
                      title="Discard staged change"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={clearStagedChanges}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#9AA6C4] hover:text-white transition-colors"
            >
              Discard All
            </button>
            <button
              onClick={() => setApplyModalOpen(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors flex items-center gap-1.5"
            >
              <span>Review & Apply</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141A2E] border border-[#27304A] rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#E6EAF5] flex items-center gap-2 mb-2">
              <span>Atomic Apply Confirmation</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-950/80 text-amber-300 border border-amber-700/50">
                {stagedCount} Changes
              </span>
            </h3>
            <p className="text-xs text-[#9AA6C4] mb-4">
              Review staged configuration diffs before committing to the live platform store.
            </p>

            <div className="max-h-56 overflow-y-auto space-y-2 mb-4 p-2 bg-[#0B1020] rounded-lg border border-[#27304A]">
              {Object.entries(stagedChanges).map(([k, v]) => (
                <div key={k} className="text-xs font-mono flex items-center justify-between p-1.5">
                  <span className="text-indigo-300 font-semibold">{k}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9AA6C4] line-through">{String(config[k])}</span>
                    <span className="text-neutral-500">→</span>
                    <span className="text-white font-bold">{String(v)}</span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#9AA6C4] uppercase font-bold mb-1">
                  Reason for Change (Audit Requirement)
                </label>
                <input
                  type="text"
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-xs text-[#E6EAF5] focus:outline-none focus:border-indigo-400 font-mono"
                  placeholder="e.g. Adjusted curfew delivery window for exam period"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#9AA6C4] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors"
                >
                  Confirm & Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectKey={(k) => {
          setSelectedKey(k);
          setInspectorOpen(true);
        }}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />
    </div>
  );
};
