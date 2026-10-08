import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Layers,
  Settings,
  MapPin,
  Store,
  Radio,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Send,
  Lock,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import {
  mockClubReports,
  mockClubUsers,
  campusPickupPoints,
  mockShops,
  prohibitedItemsList
} from '../../data/mockData';
import { useWebApp } from '../../context/WebAppContext';

interface ClubConsoleProps {
  section?: string;
  reportId?: string;
  onNavigate: (path: string) => void;
}

export const ClubConsole: React.FC<ClubConsoleProps> = ({
  section = 'dashboard',
  reportId,
  onNavigate
}) => {
  const { orders } = useWebApp();
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [userSearch, setUserSearch] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Editable rules state
  const [minFee, setMinFee] = useState(20);
  const [maxFee, setMaxFee] = useState(50);
  const [weightCap, setWeightCap] = useState(5);
  const [priceCap, setPriceCap] = useState(1500);

  const selectedReport = reportId
    ? mockClubReports.find((r) => r.id === reportId) || mockClubReports[0]
    : mockClubReports[0];

  return (
    <div className="w-full max-w-hero mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-sm">
      {/* Club Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-panel bg-slate-900 text-white shadow-e2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h1 className="font-heading font-bold text-xl text-white">
              Student Council & Welfare — Operations Console
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            Supervising campus pilot peer deliveries, mediating dispute tickets, and managing safety caps.
          </p>
        </div>

        {/* Quick section pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'dashboard', label: 'Dashboard', path: '/club' },
            { id: 'reports', label: 'Reports Queue', path: '/club/reports' },
            { id: 'users', label: 'Verified Users', path: '/club/users' },
            { id: 'requests', label: 'All Requests', path: '/club/requests' },
            { id: 'rules', label: 'Rules & Caps', path: '/club/rules' },
            { id: 'pickup-points', label: 'Pickup Points', path: '/club/pickup-points' },
            { id: 'shops', label: 'Shop Moderation', path: '/club/shops' },
            { id: 'broadcast', label: 'Broadcast', path: '/club/broadcast' },
            { id: 'insights', label: 'Insights', path: '/club/insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.path)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                section === tab.id
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. DASHBOARD VIEW (`/club`) */}
      {section === 'dashboard' && (
        <div className="space-y-6">
          {/* 4 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-neutral-secondary font-medium block">Open Dispute Reports</span>
              <div className="font-heading font-extrabold text-2xl sm:text-3xl text-semantic-danger font-mono">
                {mockClubReports.filter((r) => r.status === 'Open').length}
              </div>
              <span className="text-[11px] text-neutral-placeholder">Requiring council review</span>
            </div>

            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-neutral-secondary font-medium block">Active Campus Orders</span>
              <div className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-indigo font-mono">
                {orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length}
              </div>
              <span className="text-[11px] text-neutral-placeholder">Currently in transit or open</span>
            </div>

            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-neutral-secondary font-medium block">Verified Campus Users</span>
              <div className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-600 font-mono">
                {mockClubUsers.length}
              </div>
              <span className="text-[11px] text-neutral-placeholder">98% verified college emails</span>
            </div>

            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs text-neutral-secondary font-medium block">Completed Today</span>
              <div className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text font-mono">
                18
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">100% handover code verified</span>
            </div>
          </div>

          {/* Quick Action Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Urgent Priority Reports
                </h3>
                <button
                  onClick={() => onNavigate('/club/reports')}
                  className="text-xs text-brand-indigo font-semibold hover:underline"
                >
                  View full queue →
                </button>
              </div>

              <div className="space-y-2.5">
                {mockClubReports.slice(0, 2).map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => onNavigate(`/club/reports/${rep.id}`)}
                    className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 flex justify-between items-center cursor-pointer hover:border-brand-indigo transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-placeholder">#{rep.id}</span>
                        <span className="text-xs font-bold text-semantic-danger bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                          {rep.priority} Priority
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text mt-1">
                        {rep.issueType} (Order #{rep.orderReference})
                      </h4>
                      <p className="text-[11px] text-neutral-secondary">{rep.details.slice(0, 60)}...</p>
                    </div>
                    <span className="text-xs text-brand-indigo font-bold">Review →</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Live Request Monitor
                </h3>
                <button
                  onClick={() => onNavigate('/club/requests')}
                  className="text-xs text-brand-indigo font-semibold hover:underline"
                >
                  Inspect all requests →
                </button>
              </div>

              <div className="space-y-2.5">
                {orders.length === 0 ? (
                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/40 text-center text-xs text-neutral-secondary">
                    No active requests being monitored currently. New campus errand requests will appear in real time.
                  </div>
                ) : (
                  orders.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      className="p-3 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">#{o.id}</span>
                          <StatusChip status={o.status} size="sm" />
                        </div>
                        <span className="text-neutral-secondary text-[11px] block mt-0.5">
                          {o.items.map((it) => it.name).join(', ')}
                        </span>
                      </div>
                      <span className="font-mono font-bold">₹{o.totalCost}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORTS QUEUE & DETAIL (`/club/reports` & `/:id`) */}
      {(section === 'reports' || reportId) && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                "Report a Problem" Moderation Queue
              </h2>
              <p className="text-xs text-neutral-secondary">
                Sorted by priority and age. Click any case to inspect timeline, chat transcript, and take actions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Reports List (5 cols) */}
            <div className="lg:col-span-5 space-y-2">
              {mockClubReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onNavigate(`/club/reports/${rep.id}`)}
                  className={`p-4 rounded-card border shadow-sm cursor-pointer transition-all space-y-2 ${
                    selectedReport?.id === rep.id
                      ? 'border-brand-indigo bg-brand-indigo-light/30 dark:bg-brand-indigo/15'
                      : 'bg-white dark:bg-neutral-dark-card border-neutral-border dark:border-slate-800 hover:border-neutral-placeholder'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-neutral-placeholder">#{rep.id}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        rep.priority === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text">
                    {rep.issueType}
                  </h4>
                  <p className="text-[11px] text-neutral-secondary line-clamp-2">
                    {rep.details}
                  </p>
                  <div className="flex justify-between text-[11px] text-neutral-placeholder pt-1">
                    <span>Order: #{rep.orderReference}</span>
                    <span>Status: {rep.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Case Detail View (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 shadow-e2 space-y-5">
              <div className="flex justify-between items-start pb-3 border-b border-neutral-border dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">Case #{selectedReport.id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-indigo-light text-brand-indigo">
                      Order #{selectedReport.orderReference}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text mt-1">
                    {selectedReport.issueType}
                  </h3>
                  <span className="text-xs text-neutral-secondary">
                    Filed by {selectedReport.reporterName} ({selectedReport.reporterRole}) • {selectedReport.createdAt}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  {selectedReport.status}
                </span>
              </div>

              {/* Reported Details */}
              <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800 text-xs space-y-1">
                <span className="font-semibold text-neutral-secondary block">Description:</span>
                <p className="text-neutral-body dark:text-slate-200 leading-relaxed">
                  {selectedReport.details}
                </p>
              </div>

              {/* Timeline (Section 9) */}
              <div className="space-y-2">
                <h4 className="font-heading font-semibold text-xs uppercase tracking-wider text-neutral-secondary">
                  Case Investigation Timeline
                </h4>
                <div className="space-y-2 border-l-2 border-brand-indigo/30 pl-3">
                  {selectedReport.timeline.map((step, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <strong className="font-semibold text-neutral-ink dark:text-neutral-dark-text block">
                        {step.step} — <span className="text-neutral-placeholder font-normal">{step.timestamp}</span>
                      </strong>
                      <p className="text-neutral-secondary text-[11px]">{step.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderator Actions (Section 9) */}
              <div className="pt-4 border-t border-neutral-border dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-neutral-secondary block">
                  Club Council Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => alert('Order resolved manually. Notification dispatched.')}
                    className="px-4 py-2 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    Resolve Manually
                  </button>
                  <button
                    onClick={() => alert('Order cancelled by moderation. ₹0 charge verified.')}
                    className="px-4 py-2 rounded-btn border border-semantic-danger text-semantic-danger hover:bg-semantic-danger-tint text-xs font-semibold transition-colors"
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={() => alert('Email sent to student address.')}
                    className="px-4 py-2 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold hover:bg-neutral-surface-alt"
                  >
                    Contact Requester
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VERIFIED USERS (`/club/users`) */}
      {section === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Verified Campus Students
              </h2>
              <p className="text-xs text-neutral-secondary">
                Students authenticated with SASTRA emails (your_reg_no@sastra.ac.in).
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-neutral-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Search by student name or roll"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="border border-neutral-border dark:border-slate-800 rounded-panel bg-white dark:bg-neutral-dark-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-surface-alt dark:bg-slate-800 border-b border-neutral-border dark:border-slate-700">
                <tr>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Student Name</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">College Email</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Hostel</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Role</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Status</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border dark:divide-slate-800">
                {mockClubUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-surface-alt/40 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-semibold text-neutral-ink dark:text-neutral-dark-text">
                      {u.name}
                    </td>
                    <td className="p-3.5 font-mono text-neutral-secondary">{u.collegeEmail}</td>
                    <td className="p-3.5 text-neutral-secondary">{u.hostelBlock}</td>
                    <td className="p-3.5 capitalize font-medium">{u.role}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.status === 'Active' ? (
                        <button
                          onClick={() => alert(`Suspended user ${u.name}`)}
                          className="text-xs text-semantic-danger font-medium hover:underline"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Restored user ${u.name}`)}
                          className="text-xs text-emerald-600 font-medium hover:underline"
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ALL REQUESTS MONITOR (`/club/requests`) */}
      {section === 'requests' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              All Campus Requests Overview
            </h2>
            <p className="text-xs text-neutral-secondary">
              Track open, locked, and completed orders; spot stuck or waiting-long ones.
            </p>
          </div>

          <div className="border border-neutral-border dark:border-slate-800 rounded-panel bg-white dark:bg-neutral-dark-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-surface-alt dark:bg-slate-800 border-b border-neutral-border dark:border-slate-700">
                <tr>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Order ID</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Items</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Needed By</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Fee</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Status</th>
                  <th className="p-3.5 font-semibold text-neutral-secondary">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border dark:divide-slate-800">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-neutral-secondary">
                      No requests currently recorded in the campus system. New student requests will appear here dynamically.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-surface-alt/40 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold">#{o.id}</td>
                      <td className="p-3.5 font-medium">{o.items.map((it) => it.name).join(', ')}</td>
                      <td className="p-3.5 text-neutral-secondary">{o.neededBy}</td>
                      <td className="p-3.5 font-mono font-bold text-brand-teal">₹{o.helperFee}</td>
                      <td className="p-3.5">
                        <StatusChip status={o.status} size="sm" />
                      </td>
                      <td className="p-3.5">
                        {o.isWaitingLong && (
                          <span className="text-[11px] font-bold text-semantic-warning bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Waiting Long
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. RULES & CAPS CONFIGURATION (`/club/rules`) */}
      {section === 'rules' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Rules, Fees & Safety Caps Configuration
            </h2>
            <p className="text-xs text-neutral-secondary">
              Set pilot caps, helper fee bounds, and prohibited items list.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                Helper Fee Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-secondary mb-1">Minimum Base Fee (₹)</label>
                  <input
                    type="number"
                    value={minFee}
                    onChange={(e) => setMinFee(parseInt(e.target.value) || 20)}
                    className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block text-neutral-secondary mb-1">Maximum Cap Fee (₹)</label>
                  <input
                    type="number"
                    value={maxFee}
                    onChange={(e) => setMaxFee(parseInt(e.target.value) || 50)}
                    className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border"
                  />
                </div>
              </div>
              <p className="text-[11px] text-neutral-secondary">
                Pilot test range: ₹20–₹50 ensures willingness to pay while fairly rewarding walking helpers.
              </p>
            </div>

            <div className="p-6 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                Physical & Financial Caps
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-secondary mb-1">Max Weight Cap (kg)</label>
                  <input
                    type="number"
                    value={weightCap}
                    onChange={(e) => setWeightCap(parseInt(e.target.value) || 5)}
                    className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block text-neutral-secondary mb-1">Max Order Value Cap (₹)</label>
                  <input
                    type="number"
                    value={priceCap}
                    onChange={(e) => setPriceCap(parseInt(e.target.value) || 1500)}
                    className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border"
                  />
                </div>
              </div>
              <p className="text-[11px] text-neutral-secondary">
                Limits ensure items fit in backpacks and prevent high financial risk on peer purchases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. PICKUP POINTS (`/club/pickup-points`) */}
      {section === 'pickup-points' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Approved Campus Pickup Points
              </h2>
              <p className="text-xs text-neutral-secondary">
                Public common spaces approved for student handovers.
              </p>
            </div>

            <button
              onClick={() => alert('Add campus location modal')}
              className="h-9 px-3.5 rounded-btn bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Location
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusPickupPoints.map((point) => (
              <div
                key={point.id}
                className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm flex items-start justify-between gap-3"
              >
                <div>
                  <h4 className="font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                    {point.name}
                  </h4>
                  <span className="block text-[11px] text-emerald-600 font-semibold mt-1">
                    Active & Lit
                  </span>
                </div>
                <button className="text-xs text-neutral-secondary hover:text-neutral-ink">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SHOPS MODERATION (`/club/shops`) */}
      {section === 'shops' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Shop Database Moderation
            </h2>
            <p className="text-xs text-neutral-secondary">
              Review and verify shop entries submitted by student helpers to train the chatbot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockShops.map((shop) => (
              <div
                key={shop.id}
                className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                      {shop.name}
                    </h4>
                    <p className="text-xs text-neutral-secondary">{shop.location}</p>
                  </div>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    Approved
                  </span>
                </div>
                <div className="text-xs text-neutral-secondary">
                  Rating: <strong>{shop.rating} ★</strong> ({shop.reviewCount} peer votes)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. BROADCAST COMPOSER (`/club/broadcast`) */}
      {section === 'broadcast' && (
        <div className="space-y-4 max-w-xl">
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Campus WhatsApp Broadcast Composer
            </h2>
            <p className="text-xs text-neutral-secondary">
              Send announcements for evening shopping windows and high request clusters during pilot.
            </p>
          </div>

          <div className="p-6 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm space-y-4">
            <textarea
              rows={4}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              aria-label="Campus announcement message"
              className="w-full p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border text-xs"
            />

            {broadcastSent && (
              <div className="p-3 rounded-card bg-emerald-50 text-emerald-800 text-xs">
                ✓ Broadcast dispatched to campus student channel!
              </div>
            )}

            <button
              onClick={() => {
                setBroadcastSent(true);
                setTimeout(() => setBroadcastSent(false), 3000);
              }}
              className="h-10 px-5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp Broadcast</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. INSIGHTS & ANALYTICS (`/club/insights`) */}
      {section === 'insights' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Pilot Insights & Fee Calibration
            </h2>
            <p className="text-xs text-neutral-secondary">
              Orders, completion rates, cancellations, average fee level testing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm">
              <span className="text-xs text-neutral-secondary block">Completion Rate</span>
              <div className="font-heading font-extrabold text-2xl font-mono text-emerald-600 mt-1">
                94.2%
              </div>
              <span className="text-[11px] text-neutral-placeholder">Across 120 pilot orders</span>
            </div>

            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm">
              <span className="text-xs text-neutral-secondary block">Average Helper Fee</span>
              <div className="font-heading font-extrabold text-2xl font-mono text-brand-teal mt-1">
                ₹32.50
              </div>
              <span className="text-[11px] text-neutral-placeholder">Within ₹20–₹50 pilot test range</span>
            </div>

            <div className="p-5 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 shadow-sm">
              <span className="text-xs text-neutral-secondary block">Average Delivery Time</span>
              <div className="font-heading font-extrabold text-2xl font-mono text-brand-indigo mt-1">
                34 mins
              </div>
              <span className="text-[11px] text-neutral-placeholder">From acceptance to code verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
