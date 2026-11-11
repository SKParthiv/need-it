import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, Store, Check } from 'lucide-react';
import { mockAvailability } from '../../data/mockData';
import { AvailabilityWindow } from '../../types';

interface AvailabilityProps {
  onNavigate: (path: string) => void;
}

const POPULAR_DESTINATIONS = [
  'Canopy Canteen & Refreshments',
  'Campus Health Centre & Essentials',
  'KC Food Court & Juice Corner',
  'Central Stationery Mart'
];

export const Availability: React.FC<AvailabilityProps> = ({ onNavigate }) => {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(mockAvailability);
  const [selectedPreset, setSelectedPreset] = useState<'Today evening' | 'Weekend' | 'Custom'>('Today evening');
  const [customDate, setCustomDate] = useState('Tomorrow');
  const [customTime, setCustomTime] = useState('8:00 PM – 10:00 PM');
  const [selectedStores, setSelectedStores] = useState<string[]>(['Canopy Canteen & Refreshments']);
  const [addedNotice, setAddedNotice] = useState(false);

  const toggleStore = (store: string) => {
    setSelectedStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const handleAddWindow = () => {
    const newWin: AvailabilityWindow = {
      id: `av-${Date.now()}`,
      date: selectedPreset === 'Today evening' ? 'Today' : selectedPreset === 'Weekend' ? 'This Saturday' : customDate,
      timeWindow: selectedPreset === 'Today evening' ? '6:30 PM – 8:30 PM' : selectedPreset === 'Weekend' ? '1:00 PM – 3:30 PM' : customTime,
      preset: selectedPreset,
      status: 'Active'
    };
    setWindows([newWin, ...windows]);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const handleDelete = (id: string) => {
    setWindows(windows.filter((w) => w.id !== id));
  };

  const activeDate = selectedPreset === 'Today evening' ? 'Today' : selectedPreset === 'Weekend' ? 'This Saturday' : customDate;
  const activeTime = selectedPreset === 'Today evening' ? '6:30 PM – 8:30 PM' : selectedPreset === 'Weekend' ? '1:00 PM – 3:30 PM' : customTime;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal-light text-brand-teal text-xs font-semibold mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Helper Route Scheduler</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          "I'm Going Out" Availability
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Let dorm peers in your block know when you are stepping out so they can route requests to you.
        </p>
      </div>

      {/* Add New Availability Window Card */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-slate-800">
          <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-teal" />
            <span>Broadcast a New Shopping Trip</span>
          </h3>
          <span className="text-xs font-mono text-neutral-secondary">Fast 1-Click Broadcast</span>
        </div>

        {/* 1. Quick Timing Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-secondary uppercase tracking-wider">
            1. Select Timing Window
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'Today evening', label: 'Today Evening', time: '6:30 PM – 8:30 PM' },
              { id: 'Weekend', label: 'Weekend Afternoon', time: '1:00 PM – 3:30 PM' },
              { id: 'Custom', label: 'Custom Time Window', time: 'Specify manually' }
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === preset.id
                    ? 'border-brand-teal bg-brand-teal-light/40 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-sm ring-1 ring-brand-teal/40'
                    : 'border-neutral-border dark:border-slate-700 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                }`}
              >
                <span className="block text-xs font-heading font-bold mb-0.5">{preset.label}</span>
                <span className="block text-[11px] font-mono text-neutral-secondary">{preset.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom fields if Custom selected */}
        {selectedPreset === 'Custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-ink dark:text-neutral-dark-text mb-1">
                Date
              </label>
              <input
                type="text"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                placeholder="e.g. Tomorrow, Friday"
                className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-ink dark:text-neutral-dark-text mb-1">
                Time Window
              </label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 5:00 PM – 7:00 PM"
                className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm font-medium"
              />
            </div>
          </div>
        )}

        {/* 2. Destination Stores */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-secondary uppercase tracking-wider">
            2. Campus Shops You're Visiting
          </label>
          <div className="flex flex-wrap gap-2">
            {POPULAR_DESTINATIONS.map((store) => {
              const isSelected = selectedStores.includes(store);
              return (
                <button
                  key={store}
                  type="button"
                  onClick={() => toggleStore(store)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-teal text-white border-brand-teal shadow-sm'
                      : 'border-neutral-border dark:border-slate-700 text-neutral-secondary hover:bg-neutral-surface-alt'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                  <span>{store}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Summary & One-Click Broadcast */}
        <div className="p-4 rounded-xl bg-neutral-surface-alt/70 dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-secondary block">
              Trip Broadcast Summary
            </span>
            <div className="flex items-center gap-2 text-neutral-ink dark:text-neutral-dark-text font-medium">
              <Clock className="w-4 h-4 text-brand-teal" />
              <span><strong>{activeDate}</strong> – {activeTime}</span>
              <span>({selectedStores.length} shop stops)</span>
            </div>
          </div>

          <button
            onClick={handleAddWindow}
            className="h-11 px-6 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Trip to Dorm</span>
          </button>
        </div>

        {addedNotice && (
          <div className="p-3 rounded-card bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Availability broadcasted! Peers in your hostel block will now see your route in their feed.</span>
          </div>
        )}
      </div>

      {/* Upcoming Active Windows List */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
          Your Scheduled "Going Out" Windows
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {windows.map((win) => (
            <div
              key={win.id}
              className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                    {win.date}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-teal-light text-brand-teal">
                    {win.preset}
                  </span>
                </div>
                <p className="text-xs text-neutral-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-teal" />
                  <span>{win.timeWindow}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(win.id)}
                  className="p-2 text-neutral-secondary hover:text-semantic-danger rounded-lg hover:bg-neutral-surface-alt transition-colors"
                  title="Delete window"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
