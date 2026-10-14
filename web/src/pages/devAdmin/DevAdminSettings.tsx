import React, { useState } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';
import { CONFIG_REGISTRY, RegistryItem } from '../../services/configRegistry';

interface DevAdminSettingsProps {
  onSelectKey?: (key: string) => void;
}

export const DevAdminSettings: React.FC<DevAdminSettingsProps> = ({ onSelectKey }) => {
  const { config, stageChange, isStaged, resetKeyToDefault, stagedChanges } = useDevAdmin();

  // Local state for editing inputs before staging
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const groups = [
    {
      id: 'fees',
      title: 'Errand Fees & Delivery Rates',
      description: 'Controls the minimum, maximum, and base helper tips offered by students across campus',
      keys: ['fees.min_inr', 'fees.max_inr', 'fees.base_inr'],
    },
    {
      id: 'orders',
      title: 'Order Limits & Safety Caps',
      description: 'Waiting timeouts, item quantities, and maximum total order value thresholds',
      keys: ['orders.waiting_long_minutes', 'orders.max_items_per_request', 'orders.max_order_value_inr'],
    },
    {
      id: 'handover_chat',
      title: 'Handover OTP & Cloudinary Media Limits',
      description: 'Validity duration for OTP codes and maximum upload file size for shelf photo receipts',
      keys: ['handover.code_expiry_minutes', 'chat.max_photo_mb'],
    },
    {
      id: 'support',
      title: 'Campus Support & Emergency Hotlines',
      description: 'Official student support contacts displayed across public pages and incident reports',
      keys: ['support.email', 'support.whatsapp', 'support.hours'],
    },
  ];

  const handleInputChange = (key: string, rawVal: string, item: RegistryItem) => {
    let parsed: any = rawVal;
    if (item.type === 'integer') {
      parsed = parseInt(rawVal, 10);
      if (isNaN(parsed)) parsed = 0;
    }
    setEditingValues((prev) => ({ ...prev, [key]: parsed }));

    // Inline validation check
    if (item.min !== undefined && parsed < item.min) {
      setErrorMap((prev) => ({ ...prev, [key]: `Must be at least ${item.min} ${item.unit || ''}` }));
    } else if (item.max !== undefined && parsed > item.max) {
      setErrorMap((prev) => ({ ...prev, [key]: `Cannot exceed ${item.max} ${item.unit || ''}` }));
    } else {
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCommitStage = (key: string) => {
    const val = editingValues[key] !== undefined ? editingValues[key] : config[key];
    const res = stageChange(key, val);
    if (!res.success && res.error) {
      setErrorMap((prev) => ({ ...prev, [key]: res.error || 'Invalid value' }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Platform Settings & Numeric Limits</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              E5 Configuration Store
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Registered platform limits and parameters with strict range validation and audit history
          </p>
        </div>
      </div>

      {/* Settings Groups */}
      {groups.map((group) => (
        <div key={group.id} className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#27304A]/60">
            <h3 className="text-sm font-bold text-[#E6EAF5]">{group.title}</h3>
            <p className="text-xs text-[#9AA6C4] mt-0.5">{group.description}</p>
          </div>

          <div className="divide-y divide-[#27304A]/40">
            {group.keys.map((key) => {
              const item = CONFIG_REGISTRY[key];
              if (!item) return null;

              const currentVal = config[key];
              const staged = isStaged(key);
              const stagedVal = stagedChanges[key];
              const inputValue = editingValues[key] !== undefined ? editingValues[key] : (staged ? stagedVal : currentVal);
              const isDefault = currentVal === item.default;
              const hasError = !!errorMap[key];

              return (
                <div
                  key={key}
                  onClick={() => onSelectKey?.(key)}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1B2238]/30 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-[#0B1020] px-2 py-0.5 rounded border border-[#27304A]">
                        {key}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.risk === 'H'
                            ? 'bg-rose-950/70 text-rose-300'
                            : item.risk === 'M'
                            ? 'bg-amber-950/70 text-amber-300'
                            : 'bg-emerald-950/70 text-emerald-300'
                        }`}
                      >
                        {item.risk} Risk
                      </span>
                      {staged && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                          STAGED: {String(stagedVal)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#E6EAF5] font-sans font-medium">
                      {item.description}
                    </p>

                    <div className="text-[11px] font-mono text-[#9AA6C4] flex items-center gap-3">
                      <span>Default: <strong className="text-white">{item.default} {item.unit}</strong></span>
                      {item.min !== undefined && item.max !== undefined && (
                        <span>Allowed Range: [{item.min} – {item.max} {item.unit}]</span>
                      )}
                    </div>

                    {hasError && (
                      <span className="text-[11px] font-mono text-rose-400 block">
                        ⚠ {errorMap[key]}
                      </span>
                    )}
                  </div>

                  {/* Input and Stage Controls */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <input
                        type={item.type === 'integer' ? 'number' : 'text'}
                        value={inputValue}
                        min={item.min}
                        max={item.max}
                        onChange={(e) => handleInputChange(key, e.target.value, item)}
                        className={`w-32 sm:w-40 bg-[#0B1020] border rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none transition-colors ${
                          hasError
                            ? 'border-rose-500 text-rose-300'
                            : 'border-[#27304A] focus:border-indigo-400'
                        }`}
                      />
                      {item.unit && (
                        <span className="absolute right-2.5 top-1.5 text-xs font-mono text-[#9AA6C4]">
                          {item.unit}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCommitStage(key)}
                      disabled={hasError}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#1B2238] hover:bg-indigo-600 text-indigo-300 hover:text-white border border-[#27304A] hover:border-indigo-500 transition-colors disabled:opacity-40"
                    >
                      Stage
                    </button>

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => resetKeyToDefault(key)}
                        className="px-2 py-1.5 rounded-lg text-xs font-mono text-[#9AA6C4] hover:text-white bg-[#0B1020] border border-[#27304A] transition-colors"
                        title="Reset to default"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
