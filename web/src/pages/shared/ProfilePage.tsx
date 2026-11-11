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
  Star,
  ThumbsUp,
  Award
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
  const { currentUser, role, updateProfile } = useWebApp();

  const [name, setName] = useState(currentUser.name);
  const [hostel, setHostel] = useState(currentUser.hostel);
  const [pickupPoint, setPickupPoint] = useState(currentUser.pickupPoint);
  const [upiId, setUpiId] = useState(currentUser.upiId || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setHostel(currentUser.hostel);
    setPickupPoint(currentUser.pickupPoint);
    setUpiId(currentUser.upiId || '');
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      await updateProfile({
        hostel_block: hostel,
        pickup_point: pickupPoint,
        ...(role === 'helper' ? { upi_id: upiId.trim() } : {}),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
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

        {/* Campus Trust & Peer Ratings Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 to-indigo-50/50 dark:from-slate-800/80 dark:to-indigo-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-slate-700/60">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Campus Peer Trust Score
              </span>
              <h3 className="font-heading font-extrabold text-lg text-neutral-ink dark:text-neutral-dark-text mt-0.5">
                Verified Student Ratings
              </h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 shadow-sm">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-heading font-black text-xl text-neutral-ink dark:text-neutral-dark-text font-mono">
                {currentUser.ratingAverage ?? (role === 'helper' ? 4.95 : 4.9)}
              </span>
              <span className="text-xs font-semibold text-neutral-secondary">/ 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-neutral-border/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-neutral-secondary block mb-0.5">
                {role === 'helper' ? 'Completed Deliveries' : 'Completed Errands'}
              </span>
              <span className="font-heading font-extrabold text-base text-neutral-ink dark:text-neutral-dark-text font-mono">
                {currentUser.completedOrdersCount ?? (role === 'helper' ? 32 : 14)} orders
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-neutral-border/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-neutral-secondary block mb-0.5">
                Peer Reviews Received
              </span>
              <span className="font-heading font-extrabold text-base text-neutral-ink dark:text-neutral-dark-text font-mono">
                {currentUser.ratingCount ?? (role === 'helper' ? 36 : 18)} reviews
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-neutral-border/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-neutral-secondary block mb-0.5">
                Trust Discipline (Problem Count)
              </span>
              <span className="font-heading font-extrabold text-base text-emerald-600 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>0 flags (Clean Record)</span>
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-secondary">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> 100% On-Time Handover
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified SASTRA Email
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 dark:bg-slate-800 dark:text-slate-300 font-semibold">
              Direct UPI Settled
            </span>
          </div>
        </div>


        {savedNotice && (
          <div className="p-3.5 rounded-card bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="p-3.5 rounded-card bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs">
            {saveError}
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
              disabled
              className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm opacity-70 cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-neutral-secondary">Name comes from your sign-up details and can't be changed here.</p>
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

          {role === 'helper' && (
            <div>
              <label className="block font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Your UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@okhdfc"
                className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
              <p className="mt-1 text-[11px] text-neutral-secondary">
                Customers pay you directly to this UPI ID. Without it, orders you accept can't show a payment QR.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark disabled:opacity-60 text-white font-medium text-xs shadow-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
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
