import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  MapPin,
  ShieldCheck,
  LogOut,
  FileText,
  CheckCircle2,
  Bell,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { campusPickupPoints } from '../../data/mockData';
import { UserRole } from '../../types';
import { useWebApp } from '../../context/WebAppContext';

interface ProfilePageProps {
  role: UserRole;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  role: passedRole,
  onNavigate,
  onLogout
}) => {
  const { currentUser, role, loginAsRole, isSuperAdmin } = useWebApp();

  const [name, setName] = useState(currentUser.name);
  const [hostel, setHostel] = useState(currentUser.hostel);
  const [pickupPoint, setPickupPoint] = useState(currentUser.pickupPoint);
  const [contactPref, setContactPref] = useState('In-app chat only (masked numbers)');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setHostel(currentUser.hostel);
    setPickupPoint(currentUser.pickupPoint);
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const initials =
    role === 'club'
      ? 'CA'
      : name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'AS';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Student Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Manage your verified college credentials and campus pickup locations.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
        {/* User Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-border dark:border-slate-800">
          <div
            className={`w-16 h-16 rounded-full text-white flex items-center justify-center font-heading font-extrabold text-xl shadow-sm ${
              role === 'club'
                ? 'bg-purple-600'
                : role === 'helper'
                ? 'bg-brand-teal'
                : 'bg-brand-indigo'
            }`}
          >
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                {name}
              </h2>
              <VerifiedBadge />
            </div>
            <p className="text-xs text-neutral-secondary font-mono">
              {currentUser.email}
            </p>
            <span
              className={`text-[11px] font-semibold capitalize inline-block px-2 py-0.5 rounded-full ${
                role === 'club'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  : role === 'helper'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              Active Persona: {role}
            </span>
          </div>
        </div>

        {/* Developer Super Admin Persona Switcher */}
        {isSuperAdmin && (
          <div className="p-4 rounded-card bg-neutral-surface-alt/60 dark:bg-slate-800/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-secondary">
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5" /> Developer Multi-Interface Switcher:
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">130180058@sastra.ac.in</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loginAsRole('customer')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  role === 'customer'
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => loginAsRole('helper')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  role === 'helper'
                    ? 'bg-brand-teal text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                Delivery Agent
              </button>
              <button
                type="button"
                onClick={() => loginAsRole('club')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  role === 'club'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {savedNotice && (
          <div className="p-3.5 rounded-card bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
              Hostel / Day Scholar Details
            </label>
            <input
              type="text"
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
              Primary Handover Campus Location
            </label>
            <select
              value={pickupPoint}
              onChange={(e) => setPickupPoint(e.target.value)}
              className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm"
            >
              {campusPickupPoints.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
              Contact & Notification Preference
            </label>
            <select
              value={contactPref}
              onChange={(e) => setContactPref(e.target.value)}
              className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm"
            >
              <option>In-app chat only (masked numbers)</option>
              <option>WhatsApp broadcast notification alerts</option>
              <option>Both in-app chat & SMS OTPs</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium text-xs shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </form>

        {/* Policy Links & Logout Section */}
        <div className="pt-6 border-t border-neutral-border dark:border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-neutral-secondary uppercase tracking-wider block">
            Policies & Student Rights
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigate('/privacy')}
              className="p-3 rounded-card border border-neutral-border dark:border-slate-700 text-left hover:bg-neutral-surface-alt flex items-center justify-between"
            >
              <span>Privacy Policy (DPDP)</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-secondary" />
            </button>
            <button
              onClick={() => onNavigate('/terms')}
              className="p-3 rounded-card border border-neutral-border dark:border-slate-700 text-left hover:bg-neutral-surface-alt flex items-center justify-between"
            >
              <span>Terms of Service</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={onLogout}
              className="h-10 px-4 rounded-btn border border-rose-300 dark:border-rose-900 text-semantic-danger text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out of account</span>
            </button>

            <span className="text-[11px] text-neutral-secondary">
              NEEDIT Campus Pilot v1.3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
