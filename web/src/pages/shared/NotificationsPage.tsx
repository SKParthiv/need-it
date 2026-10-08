import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Sparkles, MessageCircle, ChevronRight, Clock } from 'lucide-react';
import { useWebApp } from '../../context/WebAppContext';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, markNotificationRead } = useWebApp();

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Campus Notifications
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Live order updates, delivery handovers, and campus pilot broadcast alerts.
        </p>
      </div>

      {/* WhatsApp Broadcast Pilot Notice (Section 8 & 16) */}
      <div className="p-4 rounded-card bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3 shadow-sm">
        <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Campus Pilot WhatsApp Broadcast Active</span>
          <p>
            During the campus pilot phase, urgent order updates and evening delivery windows are mirrored to the verified student WhatsApp broadcast channel.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3">
            <Bell className="w-10 h-10 text-neutral-placeholder mx-auto" />
            <h3 className="font-heading font-semibold text-neutral-ink dark:text-neutral-dark-text text-base">
              No Notifications Yet
            </h3>
            <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
              Status updates, order receipts, and campus broadcast alerts will appear here as orders progress.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.orderId) onNavigate(`/app/orders/${notif.orderId}`);
              }}
              className={`p-4 sm:p-5 rounded-card border shadow-sm transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !notif.read
                  ? 'bg-brand-indigo-light/20 dark:bg-brand-indigo/10 border-brand-indigo/30'
                  : 'bg-white dark:bg-neutral-dark-card border-neutral-border dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'accepted'
                      ? 'bg-brand-teal-light text-brand-teal'
                      : notif.type === 'price_change'
                      ? 'bg-amber-100 text-amber-700'
                      : notif.type === 'broadcast'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-brand-indigo-light text-brand-indigo'
                  }`}
                >
                  {notif.type === 'broadcast' ? (
                    <MessageCircle className="w-4 h-4" />
                  ) : notif.type === 'price_change' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-coral" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-neutral-placeholder flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {notif.timestamp}
                  </span>
                </div>
              </div>

              {notif.orderId && (
                <div className="flex items-center gap-1 text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode shrink-0">
                  <span>View Order</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
