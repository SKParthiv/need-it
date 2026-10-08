import React, { useState } from 'react';
import { StatusChip } from '../../components/common/StatusChip';
import { useWebApp } from '../../context/WebAppContext';
import { Briefcase, Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';

interface MyJobsProps {
  onNavigate: (path: string) => void;
}

export const MyJobs: React.FC<MyJobsProps> = ({ onNavigate }) => {
  const { orders } = useWebApp();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Filter jobs where helper is assigned
  const activeJobs = orders.filter(
    (o) => o.status === 'accepted' || o.status === 'purchased' || o.status === 'handed_over'
  );
  const pastJobs = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  const displayedJobs = activeTab === 'active' ? activeJobs : pastJobs;

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
            My Delivery Jobs
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary">
            Manage your accepted orders, chat with peers, and confirm handovers.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/app/helper/availability')}
          className="h-10 px-4 rounded-btn border border-brand-teal/40 bg-brand-teal-light text-brand-teal dark:bg-brand-teal/20 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span>I'm Going Out</span>
        </button>
      </div>

      {/* Tabs: Active / Past (Section 7.3) */}
      <div className="flex border-b border-neutral-border dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-neutral-secondary hover:text-neutral-ink'
          }`}
        >
          <span>Active Jobs</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-brand-teal-light text-brand-teal font-mono">
            {activeJobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'past'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-neutral-secondary hover:text-neutral-ink'
          }`}
        >
          <span>Past Jobs</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary font-mono">
            {pastJobs.length}
          </span>
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {displayedJobs.length === 0 ? (
          <div className="p-12 text-center rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 space-y-3">
            <Briefcase className="w-10 h-10 text-neutral-placeholder mx-auto" />
            <h3 className="font-heading font-semibold text-neutral-ink dark:text-neutral-dark-text text-base">
              No {activeTab} delivery jobs
            </h3>
            <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'You haven’t claimed any orders yet. Check the Live Campus Feed to pick up errands on your route.'
                : 'Your fulfilled delivery history and earned helper fees will appear here.'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => onNavigate('/app/helper/feed')}
                className="mt-2 h-10 px-5 rounded-btn bg-brand-teal text-white text-xs font-semibold shadow-sm hover:bg-teal-700 transition-colors"
              >
                Browse Campus Feed
              </button>
            )}
          </div>
        ) : (
          displayedJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onNavigate(`/app/helper/jobs/${job.id}`)}
              className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 hover:shadow-e2 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-neutral-placeholder">
                    #{job.id}
                  </span>
                  <StatusChip status={job.status} size="sm" />
                  <span className="text-xs text-neutral-secondary font-medium">
                    {job.customerAlias}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-brand-teal font-mono block">
                    Fee: ₹{job.helperFee}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-teal transition-colors">
                    {job.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                  </h3>
                  <p className="text-xs text-neutral-secondary flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                    <span>Deliver to: {job.pickupPoint}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-brand-teal font-semibold">
                  <span>Open Job →</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
