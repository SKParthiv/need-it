import React, { useState, useEffect } from 'react';
import { usePlatformConfig } from '../../context/DevAdminContext';
import { UserRole } from '../../types';

interface CampusClockWidgetProps {
  currentRole: UserRole;
  compact?: boolean;
}

export const CampusClockWidget: React.FC<CampusClockWidgetProps> = ({ currentRole, compact = false }) => {
  const { activeClock } = usePlatformConfig();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPassed: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!activeClock.targetTime) return;

      const now = new Date();
      const parts = activeClock.targetTime.split(':');
      const targetHours = parseInt(parts[0] || '21', 10);
      const targetMinutes = parseInt(parts[1] || '30', 10);

      const target = new Date();
      target.setHours(targetHours, targetMinutes, 0, 0);

      let diff = target.getTime() - now.getTime();
      let isPassed = false;

      if (diff <= 0) {
        // Target time has passed for today
        diff = 0;
        isPassed = true;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isPassed });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [activeClock.targetTime]);

  if (!activeClock.enabled || isDismissed) {
    return null;
  }

  // Audience filtering
  if (activeClock.audience === 'customer' && currentRole !== 'customer') {
    return null;
  }
  if (activeClock.audience === 'helper' && currentRole !== 'helper') {
    return null;
  }

  const isLowTime = !timeLeft.isPassed && timeLeft.hours === 0 && timeLeft.minutes < 30;
  const isCritical = !timeLeft.isPassed && timeLeft.hours === 0 && timeLeft.minutes < 10;

  // Format countdown string
  const format2Digit = (n: number) => String(n).padStart(2, '0');
  const countdownString = timeLeft.isPassed
    ? '00:00:00 (Window Closed)'
    : `${format2Digit(timeLeft.hours)}:${format2Digit(timeLeft.minutes)}:${format2Digit(timeLeft.seconds)}`;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-surface dark:bg-neutral-dark-surface border border-neutral-border dark:border-neutral-dark-border shadow-sm">
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${
            timeLeft.isPassed
              ? 'bg-rose-500'
              : isCritical
              ? 'bg-rose-500'
              : isLowTime
              ? 'bg-amber-400'
              : 'bg-emerald-500'
          }`}
        />
        <span className="text-neutral-muted dark:text-neutral-dark-muted font-mono">{activeClock.title}:</span>
        <span className="font-mono font-bold text-neutral-dark-text dark:text-neutral-text tracking-wider">
          {countdownString}
        </span>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Campus Order Countdown Clock"
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 ${
        timeLeft.isPassed
          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
          : isCritical
          ? 'bg-rose-950/25 border-rose-600/50 text-rose-100 ring-1 ring-rose-500/30'
          : isLowTime
          ? 'bg-amber-950/20 border-amber-600/40 text-amber-200'
          : 'bg-indigo-950/20 dark:bg-[#141A2E] border-indigo-500/30 text-indigo-100'
      }`}
    >
      {/* Background soft glow accent */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none ${
          timeLeft.isPassed ? 'bg-rose-500' : isCritical ? 'bg-rose-500' : isLowTime ? 'bg-amber-400' : 'bg-indigo-500'
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              timeLeft.isPassed
                ? 'bg-rose-900/40 border-rose-700/50 text-rose-400'
                : isCritical
                ? 'bg-rose-900/40 border-rose-600/60 text-rose-300 animate-pulse'
                : isLowTime
                ? 'bg-amber-900/40 border-amber-600/50 text-amber-300'
                : 'bg-indigo-900/40 border-indigo-600/40 text-indigo-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide text-neutral-100 flex items-center gap-1.5">
                {activeClock.title}
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    timeLeft.isPassed
                      ? 'bg-rose-500'
                      : isCritical
                      ? 'bg-rose-500 animate-ping'
                      : isLowTime
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-neutral-900/60 border border-neutral-700/50 text-neutral-300">
                Target {activeClock.targetTime} IST
              </span>
            </div>

            <p className="text-xs text-neutral-300/80 mt-0.5 max-w-xl">
              {activeClock.description}
            </p>
          </div>
        </div>

        {/* Live Countdown Display */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/40">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              {timeLeft.isPassed ? 'Status' : 'Time Remaining'}
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-lg sm:text-xl tracking-wider text-white">
              {timeLeft.isPassed ? (
                <span className="text-rose-400 text-sm font-semibold">Curfew Window Active</span>
              ) : (
                <>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-950/70 border border-neutral-800/60">
                    {format2Digit(timeLeft.hours)}
                  </span>
                  <span className="text-neutral-500">:</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-950/70 border border-neutral-800/60">
                    {format2Digit(timeLeft.minutes)}
                  </span>
                  <span className="text-neutral-500">:</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-950/70 border border-neutral-800/60 text-indigo-400">
                    {format2Digit(timeLeft.seconds)}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/50 transition-colors"
            title="Dismiss timer for this session"
            aria-label="Dismiss countdown widget"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
