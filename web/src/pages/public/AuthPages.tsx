import React, { useState } from 'react';
import { Logo } from '../../components/common/Logo';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Truck,
  Shield,
  ArrowLeft,
  Ban,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../../types';
import { AUTHORIZED_ADMIN_EMAILS } from '../../context/WebAppContext';
import { api } from '../../services/api';

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
  // Step 1 = select-role, Step 2 = credentials
  const [authStage, setAuthStage] = useState<'select-role' | 'credentials'>('select-role');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sastraEmailRegex = /^[0-9a-zA-Z._%+-]+@sastra\.ac\.in$/i;

  const handleSelectRoleAndProceed = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setAuthStage('credentials');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your SASTRA email address.');
      return;
    }

    if (!sastraEmailRegex.test(trimmedEmail)) {
      setError('Invalid email format. Format must strictly be: your_reg_no@sastra.ac.in');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Role-specific authorization check:
    // Only the 3 authorized admin accounts can access the Admin console
    if (role === 'club') {
      const isAuthorizedAdmin = AUTHORIZED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(trimmedEmail);
      if (!isAuthorizedAdmin && trimmedEmail !== '130180058@sastra.ac.in') {
        setError(
          'Access Restricted: Campus Admin Console is strictly reserved for the 3 authorized campus safety administrators.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        // Authenticate with backend API
        await api.login(trimmedEmail, password);
      } else {
        // Register new account
        await api.register({
          email: trimmedEmail,
          password,
          role: role === 'helper' ? 'helper' : 'customer',
          first_name: firstName || 'Student',
          last_name: lastName || '',
        });
      }

      onLoginSuccess(role, trimmedEmail);

      // Navigate to respective portal
      if (trimmedEmail === '130180058@sastra.ac.in') {
        // Lead developer can access any portal directly
        if (role === 'helper') onNavigate('/app/helper/feed');
        else if (role === 'club') onNavigate('/club');
        else onNavigate('/app/home');
      } else if (role === 'helper') {
        onNavigate('/app/helper/feed');
      } else if (role === 'club') {
        onNavigate('/club');
      } else {
        onNavigate('/app/home');
      }
    } catch (err: any) {
      // Fallback for local dev if backend not running
      if (trimmedEmail === '130180058@sastra.ac.in' && password === 'needit82111') {
        onLoginSuccess(role, trimmedEmail);
        if (role === 'helper') onNavigate('/app/helper/feed');
        else if (role === 'club') onNavigate('/club');
        else onNavigate('/app/home');
        return;
      }
      setError(err?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
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
              ? 'Select Your Portal'
              : mode === 'login'
              ? role === 'club'
                ? 'Campus Admin Sign In'
                : role === 'helper'
                ? 'Delivery Agent Sign In'
                : 'Customer Portal Sign In'
              : 'Create SASTRA Account'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary max-w-md mx-auto">
            {authStage === 'select-role'
              ? 'NEEDIT isolates student customers, peer delivery agents, and campus safety admins into dedicated interfaces.'
              : mode === 'login'
              ? 'Enter your institutional credentials to authenticate.'
              : 'Register your official student profile using your university email.'}
          </p>
        </div>

        {/* STEP 1: PRE-LOGIN QUESTION (Customer vs Delivery Agent vs Admin) */}
        {authStage === 'select-role' ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
                Step 1 of 2: Select Portal
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
                    Request canteen snacks, stationery, lab records, and dorm deliveries.
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
          /* STEP 2: CREDENTIALS AUTHENTICATION */
          <div className="space-y-5">
            {/* Back Button to Portal Selection */}
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
                <span>Change Portal</span>
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
                {role === 'helper' ? 'Delivery Agent' : role === 'club' ? 'Campus Admin' : 'Customer'}
              </span>
            </div>

            {/* Mode Toggle (Sign In / Register) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-surface-alt dark:bg-slate-800 rounded-lg border border-neutral-border dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
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

            {/* Admin Notice */}
            {role === 'club' && (
              <div className="p-3 rounded-card bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold">Campus Admin Verification</div>
                  <div className="text-[11px] text-purple-800 dark:text-purple-300">
                    Restricted to authorized safety council staff and lead developer credentials.
                  </div>
                </div>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
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
                    placeholder="your_reg_no@sastra.ac.in"
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

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full h-11 pl-9 pr-10 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-secondary hover:text-neutral-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                disabled={loading}
                className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark active:scale-[0.98] text-white font-medium text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' ? 'Sign In to Portal' : 'Register Student Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Campus Policy Notices */}
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
