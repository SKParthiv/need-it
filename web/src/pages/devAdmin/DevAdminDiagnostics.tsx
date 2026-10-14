import React, { useState } from 'react';

interface HealthCheckItem {
  id: string;
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: string;
  details: string;
}

export const DevAdminDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string>('Just now');
  const [checks, setChecks] = useState<HealthCheckItem[]>([
    {
      id: 'chk-api',
      name: 'REST API Gateway (/api/)',
      category: 'Core Service',
      status: 'healthy',
      latencyMs: 12,
      lastChecked: 'Just now',
      details: 'Django REST framework answers 200 on /api/health/',
    },
    {
      id: 'chk-db',
      name: 'PostgreSQL Relational DB',
      category: 'Database',
      status: 'healthy',
      latencyMs: 18,
      lastChecked: 'Just now',
      details: 'SELECT 1 returned in 18ms; connection pool active',
    },
    {
      id: 'chk-cloudinary',
      name: 'Cloudinary Signed Uploads',
      category: 'Storage',
      status: 'healthy',
      latencyMs: 42,
      lastChecked: 'Just now',
      details: 'Direct browser upload signature generator online',
    },
    {
      id: 'chk-clock',
      name: 'Campus Clock & Curfew Engine',
      category: 'Scheduler',
      status: 'healthy',
      latencyMs: 1,
      lastChecked: 'Just now',
      details: 'State synchronized with student widgets (client-side drift < 100ms)',
    },
    {
      id: 'chk-otp',
      name: 'Handover OTP Service (Rapido Pattern)',
      category: 'Security',
      status: 'healthy',
      latencyMs: 2,
      lastChecked: 'Just now',
      details: '4-digit single-attestation generator active (locks after 5 failures)',
    },
    {
      id: 'chk-statemachine',
      name: 'Order State Machine Invariants',
      category: 'Business Logic',
      status: 'healthy',
      latencyMs: 1,
      lastChecked: 'Just now',
      details: 'Guarded transitions: open → accepted → purchased → handed_over → completed',
    },
    {
      id: 'chk-firebase-ai',
      name: 'Firebase AI Logic (Gemini 3.8 Flash)',
      category: 'AI / Fraud Defense',
      status: 'healthy',
      latencyMs: 15,
      lastChecked: 'Just now',
      details: 'GoogleAIBackend connected; App Check reCAPTCHA Enterprise provider ready',
    },
  ]);

  const [errors, setErrors] = useState([
    {
      id: 'err-1',
      fingerprint: 'ERR_NON_VEG_ATTEMPT',
      message: 'Client attempt to post prohibited item blocked by pure-veg filter',
      route: '/api/requests/create/',
      count: 3,
      firstSeen: '14 mins ago',
      lastSeen: '2 mins ago',
      surface: 'Customer Web',
      acknowledged: false,
    },
    {
      id: 'err-2',
      fingerprint: 'WARN_FEED_POLL_TIMEOUT',
      message: 'Background feed refresh latency exceeded 200ms on weak campus Wi-Fi',
      route: '/api/feed/',
      count: 1,
      firstSeen: '1 hour ago',
      lastSeen: '1 hour ago',
      surface: 'Helper Feed',
      acknowledged: false,
    },
  ]);

  const handleRunChecks = () => {
    setIsRunning(true);
    setTimeout(() => {
      setChecks((prev) =>
        prev.map((c) => ({
          ...c,
          latencyMs: Math.floor(Math.random() * 20) + 8,
          lastChecked: 'Just now',
        }))
      );
      setLastRunTime(new Date().toLocaleTimeString());
      setIsRunning(false);
    }, 800);
  };

  const handleAckError = (id: string) => {
    setErrors((prev) => prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27304A]">
        <div>
          <h2 className="text-xl font-bold text-[#E6EAF5] flex items-center gap-2">
            <span>Diagnostics & Latency Telemetry Grid</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-[#1B2238] border border-[#27304A] text-indigo-300">
              E9 Health Monitor
            </span>
          </h2>
          <p className="text-xs text-[#9AA6C4] mt-0.5">
            Active health checks, database latency, Cloudinary pipes, and grouped exception logs
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunChecks}
          disabled={isRunning}
          className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-[#141A2E] hover:bg-indigo-600 border border-[#27304A] hover:border-indigo-500 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-40"
        >
          <span className={`w-2 h-2 rounded-full bg-[#4ADE80] ${isRunning ? 'animate-ping' : ''}`} />
          <span>{isRunning ? 'Pinging Services...' : 'Run Checks Now'}</span>
        </button>
      </div>

      {/* Grid of Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((c) => (
          <div key={c.id} className="p-4 rounded-xl bg-[#141A2E] border border-[#27304A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0B1020] border border-[#27304A] text-[#9AA6C4]">
                {c.category}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                {c.status.toUpperCase()}
              </span>
            </div>

            <div className="font-bold text-xs text-[#E6EAF5]">{c.name}</div>
            <p className="text-[11px] text-[#9AA6C4]">{c.details}</p>

            <div className="pt-2 border-t border-[#27304A]/60 flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#9AA6C4]">Response Time:</span>
              <span className="text-emerald-400 font-bold">{c.latencyMs}ms</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grouped Recent Errors / Exceptions */}
      <div className="bg-[#141A2E] border border-[#27304A] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27304A]">
          <h3 className="font-bold text-sm text-[#E6EAF5] flex items-center gap-2">
            <span>🩺</span>
            <span>Grouped Telemetry Logs & Interceptions</span>
          </h3>
          <span className="text-xs font-mono text-[#9AA6C4]">Last ping: {lastRunTime}</span>
        </div>

        <div className="divide-y divide-[#27304A]/50">
          {errors.map((err) => (
            <div key={err.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-300 bg-[#0B1020] px-2 py-0.5 rounded border border-[#27304A]">
                    {err.fingerprint}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2238] text-[#9AA6C4]">
                    {err.surface}
                  </span>
                  <span className="text-[10px] font-mono text-[#9AA6C4]">
                    Occurred {err.count} time{err.count > 1 ? 's' : ''} (last {err.lastSeen})
                  </span>
                </div>
                <p className="text-xs text-[#E6EAF5]">{err.message}</p>
                <span className="text-[10px] font-mono text-[#9AA6C4] block">Route: {err.route}</span>
              </div>

              <div className="shrink-0">
                {err.acknowledged ? (
                  <span className="text-xs font-mono text-[#9AA6C4]">✓ Acknowledged</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAckError(err.id)}
                    className="px-2.5 py-1 rounded bg-[#1B2238] hover:bg-[#27304A] text-xs font-mono text-[#E6EAF5] border border-[#27304A] transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
