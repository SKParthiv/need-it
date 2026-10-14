import React, { useState } from 'react';
import { useDevAdmin } from '../../context/DevAdminContext';

export const DevAdminAudit: React.FC = () => {
  const { auditLogs, revisions, rollbackRevision } = useDevAdmin();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rollbackStatus, setRollbackStatus] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (log.targetKey && log.targetKey.toLowerCase().includes(q)) ||
        log.reason.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRollback = (revId: string) => {
    const res = rollbackRevision(revId);
    if (res.success) {
      setRollbackStatus(`Successfully rolled back revision ${revId}. New audit entry recorded.`);
    } else {
      setRollbackStatus(`Rollback failed: ${res.error}`);
    }
    setTimeout(() => setRollbackStatus(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Audit Trail & Rollback History</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              Append-Only Ledger
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Immutable log of all platform configuration updates with single-click reversible rollbacks
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#9AA6C4]">
          <span>Total Entries: <strong className="text-white">{auditLogs.length}</strong></span>
          <span>·</span>
          <span>Revisions: <strong className="text-white">{revisions.length}</strong></span>
        </div>
      </div>

      {rollbackStatus && (
        <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 text-xs flex items-center gap-2">
          <span>ℹ️</span>
          <span>{rollbackStatus}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141A2E] p-3 rounded-xl border border-[#27304A]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by key, actor, or reason..."
            className="w-full sm:w-64 bg-[#0B1020] border border-[#27304A] rounded-lg px-3 py-1.5 text-xs text-[#E6EAF5] placeholder-[#9AA6C4] focus:outline-none focus:border-indigo-400 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#9AA6C4] font-mono">Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[#0B1020] border border-[#27304A] rounded-lg px-2.5 py-1.5 text-xs text-[#E6EAF5] focus:outline-none font-mono"
          >
            <option value="all">All Actions</option>
            <option value="apply">Apply</option>
            <option value="rollback">Rollback</option>
            <option value="reset">Reset</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0B1020] border-b border-[#27304A] text-[#9AA6C4]">
                <th className="py-3 px-4 font-semibold">Timestamp (IST)</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Config Key</th>
                <th className="py-3 px-4 font-semibold">Transition (Old → New)</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Reason / Context</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27304A]/50 text-[#E6EAF5]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9AA6C4]">
                    No audit log records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const matchingRev = revisions.find(
                    (r) => r.key === log.targetKey && r.changeSetId === log.changeSetId
                  );

                  return (
                    <tr key={log.id} className="hover:bg-[#1B2238]/40 transition-colors">
                      <td className="py-3 px-4 text-[#9AA6C4] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.action === 'apply'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : log.action === 'rollback'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-300">
                        {log.targetKey || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {log.before !== undefined || log.after !== undefined ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-[#9AA6C4] line-through">
                              {JSON.stringify(log.before)}
                            </span>
                            <span className="text-neutral-500">→</span>
                            <span className="text-white font-bold">
                              {JSON.stringify(log.after)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9AA6C4]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#9AA6C4] whitespace-nowrap">
                        {log.actor}
                      </td>
                      <td className="py-3 px-4 text-neutral-300 max-w-xs truncate">
                        {log.reason}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {matchingRev && (
                          <button
                            onClick={() => handleRollback(matchingRev.id)}
                            className="px-2 py-1 rounded bg-[#1B2238] hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 text-xs font-mono text-[#E6EAF5] border border-[#27304A] transition-colors"
                            title="Restore previous value (creates new audit revision)"
                          >
                            Rollback
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
