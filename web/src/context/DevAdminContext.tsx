import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CONFIG_REGISTRY,
  getDefaultConfigValues,
  validateConfigValue,
  AuditLogEntry,
  ConfigRevision,
  ConfigEntry,
} from '../services/configRegistry';
import { SUPER_ADMIN_EMAIL } from './WebAppContext';

interface ClockSettings {
  enabled: boolean;
  title: string;
  targetTime: string;
  description: string;
  audience: 'both' | 'customer' | 'helper';
  urgency: 'normal' | 'warning' | 'urgent';
}

interface DevAdminContextType {
  config: Record<string, any>;
  stagedChanges: Record<string, any>;
  stagedCount: number;
  isStaged: (key: string) => boolean;
  stageChange: (key: string, value: any) => { success: boolean; error?: string };
  unstageChange: (key: string) => void;
  clearStagedChanges: () => void;
  applyStagedChanges: (reason?: string) => { success: boolean; errors?: string[] };
  resetKeyToDefault: (key: string) => void;
  getConfig: <T = any>(key: string) => T;
  auditLogs: AuditLogEntry[];
  revisions: ConfigRevision[];
  rollbackRevision: (revisionId: string) => { success: boolean; error?: string };
  deviations: { key: string; current: any; default: any }[];
  activeClock: ClockSettings;
  updateClockQuick: (settings: Partial<ClockSettings>, applyImmediately?: boolean) => void;
  isSuperAdminAccess: boolean;
}

const STORAGE_KEY = 'needit_dev_admin_config_v1';
const REVISIONS_KEY = 'needit_dev_admin_revisions_v1';
const AUDIT_KEY = 'needit_dev_admin_audit_v1';

const DevAdminContext = createContext<DevAdminContextType | null>(null);

export const DevAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load config from localStorage or defaults
  const [config, setConfig] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...getDefaultConfigValues(), ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse saved dev admin config', e);
    }
    return getDefaultConfigValues();
  });

  // Staged changes (key -> staged new value)
  const [stagedChanges, setStagedChanges] = useState<Record<string, any>>({});

  // Revisions & Audit logs
  const [revisions, setRevisions] = useState<ConfigRevision[]>(() => {
    try {
      const saved = localStorage.getItem(REVISIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'INIT-001',
        timestamp: new Date().toISOString(),
        actor: SUPER_ADMIN_EMAIL || '130180058@sastra.ac.in',
        action: 'apply',
        reason: 'Initial platform configuration registered at startup',
        result: 'ok',
      },
    ];
  });

  // Persist on config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save dev admin config', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(REVISIONS_KEY, JSON.stringify(revisions));
    } catch {}
  }, [revisions]);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  // Stage a change
  const stageChange = useCallback((key: string, value: any) => {
    const validation = validateConfigValue(key, value);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    setStagedChanges((prev) => ({ ...prev, [key]: value }));
    return { success: true };
  }, []);

  const unstageChange = useCallback((key: string) => {
    setStagedChanges((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearStagedChanges = useCallback(() => {
    setStagedChanges({});
  }, []);

  // Atomic apply of all staged changes
  const applyStagedChanges = useCallback((reason: string = 'Dev admin config update') => {
    const keys = Object.keys(stagedChanges);
    if (keys.length === 0) return { success: true };

    const errors: string[] = [];
    for (const k of keys) {
      const val = stagedChanges[k];
      const valid = validateConfigValue(k, val);
      if (!valid.valid) {
        errors.push(`${k}: ${valid.error}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const changeSetId = `CS-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const actor = SUPER_ADMIN_EMAIL || '130180058@sastra.ac.in';

    const newRevisions: ConfigRevision[] = [];
    const newAuditEntries: AuditLogEntry[] = [];

    const updatedConfig = { ...config };

    for (const k of keys) {
      const oldVal = updatedConfig[k];
      const newVal = stagedChanges[k];
      updatedConfig[k] = newVal;

      const revId = `REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      newRevisions.push({
        id: revId,
        key: k,
        oldValue: oldVal,
        newValue: newVal,
        versionAfter: Date.now(),
        changeSetId,
        reason,
        actor,
        createdAt: now,
      });

      newAuditEntries.push({
        id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
        actor,
        action: 'apply',
        targetKey: k,
        before: oldVal,
        after: newVal,
        reason,
        result: 'ok',
        changeSetId,
      });
    }

    setConfig(updatedConfig);
    setRevisions((prev) => [...newRevisions, ...prev]);
    setAuditLogs((prev) => [...newAuditEntries, ...prev]);
    setStagedChanges({});

    return { success: true };
  }, [stagedChanges, config]);

  // Reset a key to default
  const resetKeyToDefault = useCallback((key: string) => {
    const item = CONFIG_REGISTRY[key];
    if (!item) return;
    stageChange(key, item.default);
  }, [stageChange]);

  // Rollback a revision
  const rollbackRevision = useCallback((revisionId: string) => {
    const rev = revisions.find((r) => r.id === revisionId);
    if (!rev) return { success: false, error: 'Revision not found' };

    const item = CONFIG_REGISTRY[rev.key];
    if (!item) return { success: false, error: 'Key no longer exists in registry' };

    const currentVal = config[rev.key];
    const targetVal = rev.oldValue;

    const validation = validateConfigValue(rev.key, targetVal);
    if (!validation.valid) {
      return { success: false, error: `Rollback target is invalid: ${validation.error}` };
    }

    const changeSetId = `RB-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const actor = SUPER_ADMIN_EMAIL || '130180058@sastra.ac.in';

    const rollbackRev: ConfigRevision = {
      id: `REV-RB-${Date.now()}`,
      key: rev.key,
      oldValue: currentVal,
      newValue: targetVal,
      versionAfter: Date.now(),
      changeSetId,
      reason: `Rollback of revision ${rev.id}`,
      actor,
      createdAt: now,
      rolledBackFrom: rev.id,
    };

    const auditEntry: AuditLogEntry = {
      id: `AUD-RB-${Date.now()}`,
      timestamp: now,
      actor,
      action: 'rollback',
      targetKey: rev.key,
      before: currentVal,
      after: targetVal,
      reason: `Restored value from revision ${rev.id}`,
      result: 'ok',
      changeSetId,
    };

    setConfig((prev) => ({ ...prev, [rev.key]: targetVal }));
    setRevisions((prev) => [rollbackRev, ...prev]);
    setAuditLogs((prev) => [auditEntry, ...prev]);

    return { success: true };
  }, [revisions, config]);

  // Get typed config
  const getConfig = useCallback(<T = any>(key: string): T => {
    if (key in config) return config[key] as T;
    return CONFIG_REGISTRY[key]?.default as T;
  }, [config]);

  // Active deviations from defaults
  const deviations = useMemo(() => {
    const res: { key: string; current: any; default: any }[] = [];
    for (const [key, item] of Object.entries(CONFIG_REGISTRY)) {
      const cur = config[key];
      if (cur !== undefined && JSON.stringify(cur) !== JSON.stringify(item.default)) {
        res.push({ key, current: cur, default: item.default });
      }
    }
    return res;
  }, [config]);

  // Active Campus Clock state helper
  const activeClock: ClockSettings = useMemo(() => {
    return {
      enabled: Boolean(config['clock.enabled']),
      title: String(config['clock.title'] || 'Night Delivery Window Closes'),
      targetTime: String(config['clock.target_time'] || '21:30'),
      description: String(
        config['clock.description'] ||
          'Hostel night gates close at 9:30 PM. Complete handovers and verify OTPs before curfew.'
      ),
      audience: (config['clock.audience'] || 'both') as 'both' | 'customer' | 'helper',
      urgency: (config['clock.urgency'] || 'normal') as 'normal' | 'warning' | 'urgent',
    };
  }, [config]);

  // Quick clock updater
  const updateClockQuick = useCallback((settings: Partial<ClockSettings>, applyImmediately = false) => {
    const keysMap: Record<keyof ClockSettings, string> = {
      enabled: 'clock.enabled',
      title: 'clock.title',
      targetTime: 'clock.target_time',
      description: 'clock.description',
      audience: 'clock.audience',
      urgency: 'clock.urgency',
    };

    const nextStaged: Record<string, any> = {};
    for (const [field, val] of Object.entries(settings)) {
      const regKey = keysMap[field as keyof ClockSettings];
      if (regKey && val !== undefined) {
        nextStaged[regKey] = val;
      }
    }

    if (applyImmediately) {
      const now = new Date().toISOString();
      const changeSetId = `CLK-${Date.now().toString(36).toUpperCase()}`;
      const actor = SUPER_ADMIN_EMAIL || '130180058@sastra.ac.in';
      const reason = 'Campus Clock immediate update from Dev Admin';

      const newRevs: ConfigRevision[] = [];
      const newAuds: AuditLogEntry[] = [];
      const updated = { ...config };

      for (const [k, v] of Object.entries(nextStaged)) {
        const oldV = updated[k];
        updated[k] = v;
        newRevs.push({
          id: `REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          key: k,
          oldValue: oldV,
          newValue: v,
          versionAfter: Date.now(),
          changeSetId,
          reason,
          actor,
          createdAt: now,
        });
        newAuds.push({
          id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: now,
          actor,
          action: 'apply',
          targetKey: k,
          before: oldV,
          after: v,
          reason,
          result: 'ok',
          changeSetId,
        });
      }

      setConfig(updated);
      setRevisions((prev) => [...newRevs, ...prev]);
      setAuditLogs((prev) => [...newAuds, ...prev]);
    } else {
      setStagedChanges((prev) => ({ ...prev, ...nextStaged }));
    }
  }, [config]);

  const value = {
    config,
    stagedChanges,
    stagedCount: Object.keys(stagedChanges).length,
    isStaged: (k: string) => k in stagedChanges,
    stageChange,
    unstageChange,
    clearStagedChanges,
    applyStagedChanges,
    resetKeyToDefault,
    getConfig,
    auditLogs,
    revisions,
    rollbackRevision,
    deviations,
    activeClock,
    updateClockQuick,
    isSuperAdminAccess: true,
  };

  return <DevAdminContext.Provider value={value}>{children}</DevAdminContext.Provider>;
};

export const useDevAdmin = () => {
  const ctx = useContext(DevAdminContext);
  if (!ctx) {
    throw new Error('useDevAdmin must be used within a DevAdminProvider');
  }
  return ctx;
};

// Lightweight hook for public and client pages
export const usePlatformConfig = () => {
  const ctx = useContext(DevAdminContext);
  if (!ctx) {
    // Graceful fallback to defaults if used outside provider
    const defaults = getDefaultConfigValues();
    return {
      getConfig: <T = any>(k: string) => (defaults[k] ?? CONFIG_REGISTRY[k]?.default) as T,
      activeClock: {
        enabled: true,
        title: 'Night Delivery Window Closes',
        targetTime: '21:30',
        description: 'Hostel night gates close at 9:30 PM. Complete handovers before curfew.',
        audience: 'both' as const,
        urgency: 'normal' as const,
      },
    };
  }
  return {
    getConfig: ctx.getConfig,
    activeClock: ctx.activeClock,
  };
};
