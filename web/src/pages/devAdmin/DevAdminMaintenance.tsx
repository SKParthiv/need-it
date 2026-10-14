import React, { useState } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';

export const DevAdminMaintenance: React.FC = () => {
  const { config, stageChange, isStaged } = useDevAdmin();

  const currentState = config['maintenance.state'] || 'off';
  const [selectedState, setSelectedState] = useState<'off' | 'notice' | 'active'>(currentState);
  const [title, setTitle] = useState(config['maintenance.title'] || 'Scheduled Campus Maintenance');
  const [message, setMessage] = useState(
    config['maintenance.message'] ||
      'NEEDIT services are temporarily offline for planned infrastructure maintenance. Services resume shortly.'
  );
  const [expectedEnd, setExpectedEnd] = useState(config['maintenance.expected_end'] || 'Tonight, 11:30 PM IST');
  const [confirmWord, setConfirmWord] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleStageMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedState === 'active' && currentState !== 'active') {
      // Require safety confirm phrase
      setShowConfirmModal(true);
      return;
    }
    commitStage();
  };

  const commitStage = () => {
    stageChange('maintenance.state', selectedState);
    stageChange('maintenance.title', title);
    stageChange('maintenance.message', message);
    stageChange('maintenance.expected_end', expectedEnd);
    setShowConfirmModal(false);
    setConfirmWord('');
    setToastMsg('Maintenance settings staged in bottom tray. Review and click "Apply Changes".');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Maintenance Mode Controller</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              E8 Safe Guard
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Safely suspend campus errands or display advance notices during database upgrades. The Control Room always remains accessible.
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
            currentState === 'active'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-700 animate-pulse'
              : currentState === 'notice'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
          }`}
        >
          {currentState === 'active'
            ? '● ACTIVE LOCKDOWN'
            : currentState === 'notice'
            ? '● ADVANCE NOTICE'
            : '● SYSTEM OPERATIONAL'}
        </span>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs">
          {toastMsg}
        </div>
      )}

      {/* State Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'off',
            name: 'Off (Operational)',
            desc: 'Normal campus operation. Errand feed, posting, and handovers active.',
            badge: 'Normal',
            color: 'border-emerald-600/40 bg-emerald-950/20 text-emerald-300',
          },
          {
            id: 'notice',
            name: 'Notice Banner',
            desc: 'Advance notice banner displayed across student screens with ETA. No blocking.',
            badge: 'Warning',
            color: 'border-amber-600/40 bg-amber-950/20 text-amber-300',
          },
          {
            id: 'active',
            name: 'Active Lockdown',
            desc: 'Blocks student post/accept flows with maintenance screen. Dev account bypasses.',
            badge: 'High Risk',
            color: 'border-rose-600/40 bg-rose-950/20 text-rose-300',
          },
        ].map((s) => {
          const isSelected = selectedState === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedState(s.id as any)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-400 bg-[#141A2E] ring-2 ring-indigo-500/30'
                  : 'border-[#27304A] bg-[#0B1020] hover:bg-[#1B2238]/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-[#E6EAF5]">{s.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${s.color}`}>
                  {s.badge}
                </span>
              </div>
              <p className="text-xs text-[#9AA6C4]">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Maintenance Parameters Form */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#E6EAF5] pb-3 border-b border-[#27304A]">
          Maintenance Message & Expected End Time
        </h3>

        <form onSubmit={handleStageMaintenance} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Headline / Notice Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Estimated Restoration Time (IST)
              </label>
              <input
                type="text"
                value={expectedEnd}
                onChange={(e) => setExpectedEnd(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
              Detailed Explanatory Notice (Max 280 characters)
            </label>
            <textarea
              rows={2}
              value={message}
              maxLength={280}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-[#27304A]">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
            >
              Stage Maintenance Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Safety Gate Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141A2E] border-2 border-rose-500/60 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="text-xl">⚠️</span>
              <h3 className="font-bold text-base">High-Risk Action: Active Lockdown</h3>
            </div>

            <p className="text-xs text-[#E6EAF5]">
              Activating Lockdown will block all student errand submissions and helper acceptances across campus. To confirm, type <strong className="font-mono text-white">MAINTENANCE</strong> below:
            </p>

            <input
              type="text"
              autoFocus
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
              placeholder="Type MAINTENANCE"
              className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-400 text-center tracking-widest uppercase font-bold"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmWord('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#9AA6C4] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmWord !== 'MAINTENANCE'}
                onClick={commitStage}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 shadow-lg"
              >
                Confirm Lockdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
