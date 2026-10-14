import React, { useState } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';
import { CampusClockWidget } from '../../components/common/CampusClockWidget';

export const DevAdminClock: React.FC = () => {
  const { activeClock, updateClockQuick, stageChange, isStaged } = useDevAdmin();

  const [title, setTitle] = useState(activeClock.title);
  const [targetTime, setTargetTime] = useState(activeClock.targetTime);
  const [description, setDescription] = useState(activeClock.description);
  const [audience, setAudience] = useState(activeClock.audience);
  const [urgency, setUrgency] = useState(activeClock.urgency);
  const [enabled, setEnabled] = useState(activeClock.enabled);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const presets = [
    { label: 'Hostel Curfew Cutoff (9:30 PM)', time: '21:30', title: 'Night Delivery Window Closes', desc: 'Hostel night gates close at 9:30 PM. Complete handovers and verify OTPs before curfew.' },
    { label: 'Late Night Delivery (10:00 PM)', time: '22:00', title: 'Late Night Errand Window', desc: 'Campus library & departmental block late errand delivery slot.' },
    { label: 'Dinner Rush Window (8:30 PM)', time: '20:30', title: 'KC Canteen Dinner Dispatch', desc: 'Place canteen orders before 8:30 PM for guaranteed dinner slot.' },
    { label: 'Exam Week Extended (11:00 PM)', time: '23:00', title: 'Exam Week Night Errand Dispatch', desc: 'Extended delivery hours active for internal exams revision night.' },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setTitle(p.title);
    setTargetTime(p.time);
    setDescription(p.desc);
  };

  const handleStage = (e: React.FormEvent) => {
    e.preventDefault();
    updateClockQuick({
      title,
      targetTime,
      description,
      audience,
      urgency,
      enabled,
    });
    setToastMessage('Clock settings staged in bottom tray. Review and click "Apply Changes".');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyInstant = () => {
    updateClockQuick(
      {
        title,
        targetTime,
        description,
        audience,
        urgency,
        enabled,
      },
      true
    );
    setToastMessage('✓ Clock settings updated live! Synchronized across student & delivery interfaces.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Campus Activity Clock & Delivery Window Controller</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              Live Widget Engine
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Configure the countdown timer visible to students and delivery agents across campus
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
              enabled
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
            }`}
          >
            {enabled ? '● CLOCK ONLINE' : '○ CLOCK OFFLINE'}
          </span>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#27304A]">
          <h3 className="font-bold text-sm text-[#E6EAF5] flex items-center gap-2">
            <span>👁️</span>
            <span>Live Student Interface Preview</span>
          </h3>
          <span className="text-[10px] font-mono text-[#9AA6C4] uppercase">Simulated Client View</span>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <span className="text-[11px] font-mono font-semibold text-indigo-300 block mb-2">
              Customer Surface Banner View (Role: Customer):
            </span>
            <CampusClockWidget currentRole="customer" />
          </div>

          <div>
            <span className="text-[11px] font-mono font-semibold text-emerald-300 block mb-2">
              Delivery Agent Surface Banner View (Role: Helper):
            </span>
            <CampusClockWidget currentRole="helper" />
          </div>
        </div>
      </div>

      {/* Clock Configuration Form */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-sm text-[#E6EAF5] pb-3 border-b border-[#27304A] flex items-center gap-2">
          <span>⚙️</span>
          <span>Clock Parameters & Timing Controls</span>
        </h3>

        {/* Quick Presets */}
        <div className="mt-4">
          <span className="text-[11px] font-mono text-[#9AA6C4] uppercase font-bold block mb-2">
            Quick Campus Presets:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-2.5 rounded-lg bg-[#0B1020] border border-[#27304A] text-left hover:border-indigo-500/50 hover:bg-[#1B2238] transition-colors"
              >
                <div className="text-xs font-semibold text-[#E6EAF5] truncate">{p.label}</div>
                <div className="text-[10px] font-mono text-indigo-300">{p.time} IST</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleStage} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Timer Purpose / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-sm text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
                placeholder="e.g. Night Errand Delivery Window"
                required
              />
              <span className="text-[11px] text-[#9AA6C4] mt-1 block">
                Displayed as the prominent header on the countdown card.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Target Deadline Time (24h HH:MM IST)
              </label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
                required
              />
              <span className="text-[11px] text-[#9AA6C4] mt-1 block">
                Countdown ticks down every second towards this campus deadline.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
              Campus Instruction / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-sm text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
              placeholder="Hostel gates lock at 9:30 PM. Complete handovers before curfew."
              required
            />
            <span className="text-[11px] text-[#9AA6C4] mt-1 block">
              Contextual guidance for students regarding hostel regulations, gates, or delivery spots.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-sm text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
              >
                <option value="both">Both Customers & Delivery Agents</option>
                <option value="customer">Customers Only</option>
                <option value="helper">Delivery Agents Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Visual Urgency Tone
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-2 text-sm text-[#E6EAF5] focus:border-indigo-400 focus:outline-none"
              >
                <option value="normal">Normal (Indigo Theme)</option>
                <option value="warning">Warning (Amber Theme)</option>
                <option value="urgent">Urgent / Final Call (Rose Theme)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#E6EAF5] mb-1">
                Display Status
              </label>
              <div className="pt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#0B1020] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 border border-[#27304A]"></div>
                  <span className="ml-3 text-sm text-[#E6EAF5]">
                    {enabled ? 'Active Widget' : 'Hidden from View'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#27304A]">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1B2238] hover:bg-[#27304A] text-indigo-300 border border-[#27304A] transition-colors"
            >
              Stage Changes in Tray
            </button>
            <button
              type="button"
              onClick={handleApplyInstant}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
            >
              Apply Live Instantly
            </button>
          </div>
        </form>

        {toastMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
