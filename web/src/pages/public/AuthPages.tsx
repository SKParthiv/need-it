import React, { useEffect, useRef, useState } from 'react';
import { Logo } from '../../components/common/Logo';
import {
  ShieldCheck,
  AlertCircle,
  Lock,
  Ban,
  ShoppingBag,
  Truck,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { UserRole } from '../../types';
import { useWebApp } from '../../context/WebAppContext';

// Real Google Workspace sign-in (GIS). Renders Google's own button; the
// returned ID token goes to POST /api/auth/google/, which enforces the
// @sastra.ac.in hosted domain server-side. Renders nothing when the build
// has no VITE_GOOGLE_CLIENT_ID (local dev without Google setup).
const GoogleSignInButton: React.FC<{ onCredential: (idToken: string) => void }> = ({ onCredential }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId || !divRef.current) return;
    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !divRef.current) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          if (resp?.credential) callbackRef.current(resp.credential);
        },
      });
      divRef.current.innerHTML = '';
      g.accounts.id.renderButton(divRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    };
    if ((window as any).google?.accounts?.id) {
      init();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [clientId]);

  if (!clientId) return null;
  return <div ref={divRef} className="flex justify-center" />;
};

interface AuthPagesProps {
  initialRole?: UserRole;
  onNavigate: (path: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialRole = 'customer',
  onNavigate
}) => {
  // Pre-login question: Step 1 = select-role, Step 2 = credentials
  const [authStage, setAuthStage] = useState<'select-role' | 'credentials'>('select-role');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { googleLogin } = useWebApp();

  const handleSelectRoleAndProceed = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setAuthStage('credentials');
    setError(null);
  };

  const navigateForRole = (resolved: UserRole) => {
    if (resolved === 'helper') onNavigate('/app/helper/feed');
    else if (resolved === 'club') onNavigate('/club');
    else onNavigate('/app/home');
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const resolved = await googleLogin(idToken, role === 'helper' ? 'helper' : 'customer');
      navigateForRole(resolved);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Use your SASTRA Workspace account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Logo size="md" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
            {authStage === 'select-role'
              ? 'Which Portal Are You Accessing?'
              : role === 'club'
              ? 'Campus Admin Sign In'
              : role === 'helper'
              ? 'Delivery Agent Sign In'
              : 'Customer Portal Sign In'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary max-w-md mx-auto">
            {authStage === 'select-role'
              ? 'NEEDIT isolates student customers, peer delivery agents, and campus safety admins into dedicated interfaces.'
              : 'Sign in with your SASTRA Google Workspace account. New here? Your account is created automatically on first sign-in.'}
          </p>
        </div>

        {/* STEP 1: PRE-LOGIN QUESTION (Customer vs Delivery Agent vs Admin) */}
        {authStage === 'select-role' ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
                Step 1 of 2: Select Your Role
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Customer */}
              <button
                type="button"
                onClick={() => handleSelectRoleAndProceed('customer')}
                className="w-full p-4 rounded-xl border-2 border-neutral-border dark:border-slate-700 hover:border-brand-indigo dark:hover:border-brand-indigo bg-neutral-surface-alt/40 dark:bg-slate-800/40 hover:bg-brand-indigo-light/20 transition-all text-left flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-indigo-light dark:bg-brand-indigo/20 text-brand-indigo dark:text-brand-indigo-darkmode flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm sm:text-base text-neutral-ink dark:text-neutral-dark-text">
                      Customer
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/30 dark:text-brand-indigo-darkmode">
                      All Students
                    </span>
                  </div>
                  <p className="text-xs text-neutral-secondary mt-1">
                    Request canteen snacks, printouts, notes, stationery, and dorm deliveries.
                  </p>
                </div>
              </button>

              {/* Option 2: Delivery Agent */}
              <button
                type="button"
                onClick={() => handleSelectRoleAndProceed('helper')}
                className="w-full p-4 rounded-xl border-2 border-neutral-border dark:border-slate-700 hover:border-brand-teal dark:hover:border-brand-teal bg-neutral-surface-alt/40 dark:bg-slate-800/40 hover:bg-brand-teal-light/20 transition-all text-left flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-teal-light dark:bg-brand-teal/20 text-brand-teal dark:text-brand-teal-dark flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm sm:text-base text-neutral-ink dark:text-neutral-dark-text">
                      Delivery Agent
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      Peer Courier
                    </span>
                  </div>
                  <p className="text-xs text-neutral-secondary mt-1">
                    Pick up requests from campus stores on your walks and earn ₹20–₹50 per delivery.
                  </p>
                </div>
              </button>

              {/* Option 3: Admin */}
              <button
                type="button"
                onClick={() => handleSelectRoleAndProceed('club')}
                className="w-full p-4 rounded-xl border-2 border-purple-200 dark:border-purple-900/60 hover:border-purple-600 dark:hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all text-left flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm sm:text-base text-purple-900 dark:text-purple-200">
                      Campus Admin
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                      Only 3 Admins
                    </span>
                  </div>
                  <p className="text-xs text-neutral-secondary mt-1">
                    Council safety moderation, prohibited item audits, and student dispute resolution.
                  </p>
                </div>
              </button>
            </div>

          </div>
        ) : (
          /* STEP 2: CREDENTIALS & OTP AUTHENTICATION */
          <div className="space-y-5">
            {/* Back Button to Role Selection */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-border dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthStage('select-role');
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-brand-indigo transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Portal / Role</span>
              </button>

              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  role === 'club'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : role === 'helper'
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                Active: {role === 'helper' ? 'Delivery Agent' : role === 'club' ? 'Admin' : 'Customer'}
              </span>
            </div>

            {/* Admin Restriction Banner */}
            {role === 'club' && (
              <div className="p-3 rounded-card bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Campus Admin Whitelist Enforced</div>
                  <div className="text-[11px] text-purple-800 dark:text-purple-300">
                    Only authorized campus administrators can access this interface.
                  </div>
                </div>
              </div>
            )}

            {/* Google Workspace sign-in — the only way in */}
            <div className="space-y-4">
              <GoogleSignInButton onCredential={handleGoogleCredential} />

              {submitting && (
                <p className="text-center text-xs text-neutral-secondary">Verifying with Google…</p>
              )}

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-input bg-semantic-danger-tint/60 dark:bg-semantic-danger/20 border border-semantic-danger/30 text-xs text-semantic-danger dark:text-semantic-danger-dark flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-[11px] text-neutral-secondary text-center leading-relaxed">
                Only <span className="font-mono font-semibold text-brand-indigo">@sastra.ac.in</span> Workspace
                accounts are let in — the server checks the Google hosted-domain claim, not just the address.
                First sign-in creates your account automatically.
              </p>
            </div>
          </div>
        )}

        {/* Campus Pilot & Policy Notices */}
        <div className="pt-4 border-t border-neutral-border dark:border-slate-800 space-y-2">
          <div className="p-3 rounded-card bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-start gap-2 text-[11px] text-red-800 dark:text-red-300">
            <Ban className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
            <span>
              <strong>Campus Rule:</strong> Non-vegetarian food items strictly prohibited. 13 approved public campus pickup spots only.
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-secondary pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              Verified SASTRA Network
            </span>
            <button
              type="button"
              onClick={() => onNavigate('/terms')}
              className="text-brand-indigo hover:underline font-medium"
            >
              Pilot Terms & Privacy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
