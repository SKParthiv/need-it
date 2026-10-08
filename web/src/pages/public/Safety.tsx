import React from 'react';
import {
  ShieldCheck,
  Lock,
  MapPin,
  KeyRound,
  AlertTriangle,
  Scale,
  LifeBuoy,
  FileText,
  ArrowRight
} from 'lucide-react';
import { campusPickupPoints } from '../../data/mockData';

interface SafetyProps {
  onNavigate: (path: string) => void;
}

export const Safety: React.FC<SafetyProps> = ({ onNavigate }) => {
  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
            Campus Protection Architecture
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            Safety & Trust Framework
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            Student-to-student transactions must be grounded in transparency, verified identity, and physical security.
          </p>
        </div>

        {/* 1. Verified Students Only & Private Chat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 sm:p-8 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              1. Verified Students Only
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              Every single user on NEEDIT must authenticate using their official institutional SASTRA email (<code className="font-mono text-xs bg-neutral-surface-alt px-1.5 py-0.5 rounded">your_reg_no@sastra.ac.in</code>). Outside commercial couriers, random visitors, or unverified emails cannot register or see open requests.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              2. Private Alias Chat (Masked Phones)
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              You never have to share personal phone numbers or social media handles. Order chats use anonymous student aliases (e.g. <em>Student #4092</em>). Only if both parties explicitly agree can phone numbers be optionally revealed. Chat archives lock into read-only mode immediately after delivery.
            </p>
          </div>
        </div>

        {/* 2. Approved Public Campus Pickup Points */}
        <div className="bg-neutral-surface-alt dark:bg-slate-900 rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-10 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-light text-brand-teal text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Public Campus Points Only</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-neutral-ink dark:text-neutral-dark-text">
              3. Vetted Physical Handover Locations
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary max-w-2xl leading-relaxed">
              Deliveries are restricted to well-lit, public campus locations with security presence. Deliveries inside personal hostel dorm rooms are prohibited under university policy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusPickupPoints.map((point) => (
              <div
                key={point.id}
                className="p-4 rounded-card bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-slate-800 flex items-start gap-3 shadow-sm"
              >
                <div className="p-2 rounded-lg bg-brand-indigo-light text-brand-indigo dark:bg-slate-800 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                    {point.name}
                  </h4>
                  <span className="block text-[11px] text-emerald-600 font-medium mt-1">
                    ✓ Verified Campus Spot
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. One-Time Handover Code & Pilot Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 sm:p-8 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              4. One-Time Handover Code
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              Every request generates a random 4-digit code shown only on the customer’s phone. Handover is finalized only after the student helper inputs this code into their app, preventing wrongful parcel handovers.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
              5. Size, Weight & Value Caps
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
              To protect student helpers who travel on foot or cycle, pilot orders have hard limits: max weight <strong>5kg</strong> and max price value <strong>₹1,500</strong>. Oversized luggage or expensive electronics cannot be posted.
            </p>
          </div>
        </div>

        {/* 4. Reporting & Responsibility Links */}
        <div className="p-6 sm:p-8 rounded-panel bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-e2">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <LifeBuoy className="w-4 h-4" />
              <span>Campus Student Club Moderation</span>
            </div>
            <h3 className="font-heading font-bold text-xl text-white">
              Have an issue or dispute?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              The student club team actively monitors order timelines, handles broken items, and mediates price disputes manually with immediate resolution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => onNavigate('/contact')}
              className="w-full sm:w-auto h-11 px-5 rounded-btn bg-semantic-danger hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              Report a Problem
            </button>
            <button
              onClick={() => onNavigate('/terms')}
              className="w-full sm:w-auto h-11 px-5 rounded-btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              Read Responsibility Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
