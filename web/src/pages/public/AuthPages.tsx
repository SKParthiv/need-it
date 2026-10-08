import React, { useState } from 'react';
import { Logo } from '../../components/common/Logo';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Sparkles,
  Lock,
  Ban,
  ShoppingBag,
  Truck,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { UserRole } from '../../types';
import { SUPER_ADMIN_EMAIL, AUTHORIZED_ADMIN_EMAILS } from '../../context/WebAppContext';

interface AuthPagesProps {
  mode: 'login' | 'register';
  initialRole?: UserRole;
  onNavigate: (path: string) => void;
  onLoginSuccess: (role: UserRole, customEmail?: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  mode: initialMode,
  initialRole = 'customer',
  onNavigate,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  // Pre-login question: Step 1 = select-role, Step 2 = credentials
  const [authStage, setAuthStage] = useState<'select-role' | 'credentials'>('select-role');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // SASTRA email validation: your_reg_no@sastra.ac.in
  const sastraEmailRegex = /^[0-9a-zA-Z._%+-]+@sastra\.ac\.in$/i;

  const handleSelectRoleAndProceed = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setAuthStage('credentials');
    setOtpStep(false);
    setError(null);
    if (selectedRole === 'customer') {
      setEmail('125004092@sastra.ac.in');
    } else if (selectedRole === 'helper') {
      setEmail('125004099@sastra.ac.in');
    } else {
      setEmail('130180058@sastra.ac.in');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your SASTRA email address.');
      return;
    }

    if (!sastraEmailRegex.test(trimmed)) {
      setError('Invalid email format. Format must strictly be: your_reg_no@sastra.ac.in');
      return;
    }

    // Role-specific authorization check:
    // Only the 3 authorized admin accounts can access the Admin console
    if (role === 'club') {
      const isAuthorizedAdmin = AUTHORIZED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(trimmed);
      if (!isAuthorizedAdmin) {
        setError(
          'Access Restricted: Admin Console is strictly reserved for the 3 authorized campus administrators. For developer testing, use 130180058@sastra.ac.in.'
        );
        return;
      }
    }

    // Proceed to OTP step
    setOtpStep(true);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.trim().length !== 4) {
      setError('Please enter the 4-digit verification code sent to your SASTRA email.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    onLoginSuccess(role, trimmedEmail);

    if (role === 'helper') {
      onNavigate('/app/helper/feed');
    } else if (role === 'club') {
      onNavigate('/club');
    } else {
      onNavigate('/app/home');
    }
  };

  const handleQuickDemoLogin = (demoRole: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setRole(demoRole);
    setError(null);
    onLoginSuccess(demoRole, demoEmail);
    if (demoRole === 'helper') {
      onNavigate('/app/helper/feed');
    } else if (demoRole === 'club') {
      onNavigate('/club');
    } else {
      onNavigate('/app/home');
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
              : mode === 'login'
              ? 'Verify your official SASTRA credentials to access your designated interface.'
              : 'Create your verified peer profile using your institutional university registration ID.'}
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

            {/* Quick Developer Super Admin Access */}
            <div className="pt-2 p-3 rounded-card bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Developer Testing Override:
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">All Interfaces Access</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('customer', SUPER_ADMIN_EMAIL)}
                className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-left flex items-center justify-between text-xs font-semibold text-neutral-ink dark:text-white"
              >
                <span>{SUPER_ADMIN_EMAIL} (Sri Thinesh)</span>
                <span className="text-[10px] text-amber-600 font-bold uppercase">Super Admin →</span>
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
                  setOtpStep(false);
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

            {/* Mode Toggle (Sign In / Register) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-surface-alt dark:bg-slate-800 rounded-lg border border-neutral-border dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setOtpStep(false);
                  setError(null);
                }}
                className={`py-2 rounded-md transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-neutral-ink dark:text-white shadow-sm'
                    : 'text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setOtpStep(false);
                  setError(null);
                }}
                className={`py-2 rounded-md transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-700 text-neutral-ink dark:text-white shadow-sm'
                    : 'text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Admin Restriction Banner */}
            {role === 'club' && (
              <div className="p-3 rounded-card bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Campus Admin Whitelist Enforced</div>
                  <div className="text-[11px] text-purple-800 dark:text-purple-300">
                    Only 3 authorized campus administrators can access this interface. Lead developer:{' '}
                    <span className="font-mono font-bold">130180058@sastra.ac.in</span>.
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Sign In Cards for Current Role */}
            <div className="space-y-2 p-3 rounded-card bg-neutral-surface-alt/60 dark:bg-slate-800/40 border border-neutral-border dark:border-slate-700">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-secondary">
                <span className="flex items-center gap-1 text-brand-indigo dark:text-brand-indigo-darkmode">
                  <Sparkles className="w-3.5 h-3.5" /> 1-Tap Quick Sign In:
                </span>
                <span className="text-[10px] text-neutral-secondary font-mono">Verified ID</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Developer Super Admin (Accesses all interfaces) */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(role, SUPER_ADMIN_EMAIL)}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-left transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                      ST
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text truncate">
                        Sri Thinesh
                      </div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        Super Admin (All Interfaces)
                      </div>
                    </div>
                  </div>
                </button>

                {/* Role Specific Demo User */}
                {role === 'customer' && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('customer', '125004092@sastra.ac.in')}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 hover:border-brand-indigo text-left transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-indigo-light text-brand-indigo flex items-center justify-center font-bold text-xs shrink-0">
                        AS
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text truncate">
                          Aarav S.
                        </div>
                        <div className="text-[10px] text-brand-indigo font-medium">Student Customer</div>
                      </div>
                    </div>
                  </button>
                )}

                {role === 'helper' && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('helper', '125004099@sastra.ac.in')}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 hover:border-brand-teal text-left transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center font-bold text-xs shrink-0">
                        PK
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text truncate">
                          Priya K.
                        </div>
                        <div className="text-[10px] text-brand-teal font-medium">Delivery Agent</div>
                      </div>
                    </div>
                  </button>
                )}

                {role === 'club' && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('club', 'needit.club@sastra.ac.in')}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 hover:border-purple-600 text-left transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        CA
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-xs text-neutral-ink dark:text-neutral-dark-text truncate">
                          Council Officer
                        </div>
                        <div className="text-[10px] text-purple-600 font-medium">Safety Council Admin</div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Email Input Form */}
            {!otpStep ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                    Official SASTRA Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="w-full h-11 pl-9 pr-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-secondary mt-1">
                    Format must strictly be:{' '}
                    <span className="font-mono text-brand-indigo font-semibold">
                      your_reg_no@sastra.ac.in
                    </span>
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-input bg-semantic-danger-tint/60 dark:bg-semantic-danger/20 border border-semantic-danger/30 text-xs text-semantic-danger dark:text-semantic-danger-dark flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark active:scale-[0.98] text-white font-medium text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Send 4-Digit Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="p-3 rounded-card bg-brand-indigo-light/40 dark:bg-brand-indigo/15 border border-brand-indigo/20 text-xs text-neutral-ink dark:text-neutral-dark-text">
                  <span className="text-neutral-secondary block text-[11px]">Verification code sent to:</span>
                  <span className="font-mono font-bold text-brand-indigo dark:text-brand-indigo-darkmode text-sm">
                    {email}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text">
                      Enter 4-Digit Verification Code
                    </label>
                    <span className="text-[11px] text-brand-indigo font-medium">Demo Code: 4092</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                        setError(null);
                      }}
                      className="w-full h-12 pl-9 pr-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-lg tracking-widest font-mono text-center text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-input bg-semantic-danger-tint/60 dark:bg-semantic-danger/20 border border-semantic-danger/30 text-xs text-semantic-danger dark:text-semantic-danger-dark flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark active:scale-[0.98] text-white font-medium text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  <span>
                    Verify & Continue to{' '}
                    {role === 'helper'
                      ? 'Delivery Agent Feed'
                      : role === 'club'
                      ? 'Admin Console'
                      : 'Customer Home'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpCode('');
                    setError(null);
                  }}
                  className="w-full text-center text-xs text-neutral-secondary hover:text-brand-indigo transition-colors"
                >
                  ← Edit email address
                </button>
              </form>
            )}
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
