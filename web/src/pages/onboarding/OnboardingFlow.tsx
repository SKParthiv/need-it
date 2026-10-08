import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  User,
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
  FileText,
  Briefcase,
  ShoppingBag
} from 'lucide-react';
import { UserRole } from '../../types';
import { campusPickupPoints, prohibitedItemsList } from '../../data/mockData';

interface OnboardingFlowProps {
  step: 'verify' | 'profile-setup' | 'policy' | 'role';
  onNavigate: (path: string) => void;
  onSetRole: (role: UserRole) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  step,
  onNavigate,
  onSetRole
}) => {
  // Step 1: Verify state
  const [email, setEmail] = useState('125004092@sastra.ac.in');
  const [otp, setOtp] = useState(['4', '8', '2', '1', '9', '0']);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Step 2: Profile setup state
  const [name, setName] = useState('Aarav Sharma');
  const [userType, setUserType] = useState<'hostel' | 'day_scholar'>('hostel');
  const [hostelBlock, setHostelBlock] = useState('Hostel Block A');
  const [pickupPoint, setPickupPoint] = useState('Boys’ Hostel Area');
  const [contactPref, setContactPref] = useState('In-app chat only');
  const [availPreset, setAvailPreset] = useState('Weekday evenings');

  // Step 3: Policy state
  const [hasScrolledPolicy, setHasScrolledPolicy] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  const stepNumbers = {
    verify: 1,
    'profile-setup': 2,
    policy: 3,
    role: 4
  };

  const currentStepNum = stepNumbers[step];

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-10 shadow-e2 space-y-6">
        {/* 4-Step Progress Indicator (Section 8) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-secondary">
            <span>Onboarding Progress</span>
            <span className="font-mono text-brand-indigo dark:text-brand-indigo-darkmode">
              Step {currentStepNum} of 4
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-surface-alt dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-indigo transition-all duration-300"
              style={{ width: `${(currentStepNum / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Verify */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-heading font-extrabold text-2xl text-neutral-ink dark:text-neutral-dark-text">
                Verify Your College Email
              </h2>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                We sent a 6-digit verification code to your student inbox.
              </p>
            </div>

            <div className="p-3 rounded-input bg-brand-indigo-light/50 dark:bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-between text-xs">
              <span className="text-neutral-secondary font-mono">{email}</span>
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-brand-indigo dark:text-brand-indigo-darkmode font-bold hover:underline"
              >
                Change
              </button>
            </div>

            {/* 6-Digit OTP Box (JetBrains Mono per Section 4.1) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-secondary uppercase tracking-wider text-center mb-2">
                Enter 6-Digit Handover Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[i] = e.target.value;
                      setOtp(newOtp);
                    }}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl rounded-input border border-neutral-border dark:border-slate-700 bg-neutral-surface-alt dark:bg-slate-800 text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo digit-fade-${i}`}
                  />
                ))}
              </div>
            </div>

            {verifyError && (
              <div className="p-3 rounded-input bg-semantic-danger-tint text-semantic-danger text-xs flex items-center gap-2 animate-shake error-msg-enter">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <button
              onClick={() => onNavigate('/app/profile-setup')}
              className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Confirm & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Profile Setup */}
        {step === 'profile-setup' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-heading font-extrabold text-2xl text-neutral-ink dark:text-neutral-dark-text">
                Complete Your Campus Profile
              </h2>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                Set your campus location so peers know where to deliver.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Student Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserType('hostel')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      userType === 'hostel'
                        ? 'bg-brand-indigo text-white border-brand-indigo'
                        : 'border-neutral-border dark:border-slate-700 text-neutral-body dark:text-slate-300'
                    }`}
                  >
                    Hostel Resident
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('day_scholar')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      userType === 'day_scholar'
                        ? 'bg-brand-indigo text-white border-brand-indigo'
                        : 'border-neutral-border dark:border-slate-700 text-neutral-body dark:text-slate-300'
                    }`}
                  >
                    Day Scholar Commuter
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Hostel Block or Department Building
                </label>
                <input
                  type="text"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                  Default Public Campus Pickup Point
                </label>
                <select
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                >
                  {campusPickupPoints.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Helper Extra: Availability & Preferences */}
              <div className="pt-2 border-t border-neutral-border dark:border-slate-800 space-y-2">
                <span className="block text-xs font-semibold text-brand-teal uppercase tracking-wider">
                  Helper Preferences (If delivering)
                </span>
                <div>
                  <label className="block text-xs text-neutral-secondary mb-1">
                    When are you usually stepping out to shops?
                  </label>
                  <select
                    value={availPreset}
                    onChange={(e) => setAvailPreset(e.target.value)}
                    className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
                  >
                    <option>Weekday evenings (6 PM – 9 PM)</option>
                    <option>Weekend afternoons (12 PM – 4 PM)</option>
                    <option>Late night study breaks (10 PM – 12 AM)</option>
                    <option>Morning lecture commutes (8 AM – 10 AM)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/app/policy')}
              className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Save & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Mandatory Policy & Prohibited Items Acceptance */}
        {step === 'policy' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-heading font-extrabold text-2xl text-neutral-ink dark:text-neutral-dark-text">
                Accept Campus Policy & Rules
              </h2>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                Mandatory step. You must review and agree to prohibited-item rules.
              </p>
            </div>

            {/* Scrollable Policy Box (Section 8) */}
            <div
              onScroll={() => setHasScrolledPolicy(true)}
              className="h-56 overflow-y-auto p-4 rounded-card border border-neutral-border dark:border-slate-700 bg-neutral-surface-alt/50 dark:bg-slate-800/50 text-xs text-neutral-secondary space-y-3 leading-relaxed"
            >
              <h4 className="font-heading font-bold text-neutral-ink dark:text-neutral-dark-text text-sm">
                NEEDIT Campus Honor Code & Responsibility
              </h4>
              <p>
                1. <strong>Zero Tolerance for Prohibited & Non-Vegetarian Items:</strong> You explicitly agree never to request or transport any non-vegetarian food items (meat, chicken, mutton, fish, egg, seafood), alcohol, cigarettes, vape supplies, prescription narcotics, weapons, or illegal substances on SASTRA premises.
              </p>
              <p>
                2. <strong>Public Pickup Points Only:</strong> All deliveries must take place at approved campus common spaces. Entering other students' private hostel dorm rooms is strictly forbidden under student conduct policies.
              </p>
              <p>
                3. <strong>Direct Shop UPI Payment:</strong> Helpers must never front personal cash. Requesters agree to pay the merchant directly via the QR code provided in chat.
              </p>
              <p>
                4. <strong>Handover Code Verification:</strong> Orders are only complete when both parties verify the random 4-digit code in-person at the drop-off location.
              </p>
              <p>
                5. <strong>Campus Disciplinary Escalation:</strong> Violations of this honor code will be immediately reported to the Student Innovation & Welfare Council and hostel wardens.
              </p>
            </div>

            {/* Required Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={policyAgreed}
                onChange={(e) => setPolicyAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-brand-indigo focus:ring-brand-indigo"
              />
              <span className="text-xs text-neutral-ink dark:text-neutral-dark-text font-medium leading-relaxed">
                I have reviewed the prohibited items list and agree to abide by the campus responsibility policy and helper pilot rules.
              </span>
            </label>

            <button
              disabled={!policyAgreed}
              onClick={() => onNavigate('/app/role')}
              className={`w-full h-12 rounded-btn font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                policyAgreed
                  ? 'bg-brand-indigo hover:bg-brand-indigo-dark text-white'
                  : 'bg-neutral-border text-neutral-disabled cursor-not-allowed'
              }`}
            >
              <span>Accept & Choose Role</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: Choose Initial Role */}
        {step === 'role' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-heading font-extrabold text-2xl text-neutral-ink dark:text-neutral-dark-text">
                How do you want to start?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-secondary">
                Select your starting dashboard view. You can freely switch anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Customer */}
              <button
                type="button"
                onClick={() => {
                  onSetRole('customer');
                  onNavigate('/app/home');
                }}
                className="p-5 rounded-panel border-2 border-brand-indigo/30 hover:border-brand-indigo bg-brand-indigo-light/20 dark:bg-brand-indigo/10 text-left space-y-3 transition-all hover:scale-[1.02] group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-indigo text-white flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-indigo">
                  Post Requests (Customer)
                </h3>
                <p className="text-xs text-neutral-secondary leading-relaxed">
                  Need midnight snacks, study stationery, or meals brought to your hostel? Go straight to customer home.
                </p>
                <span className="text-xs font-bold text-brand-indigo block pt-2">
                  Launch Customer Home →
                </span>
              </button>

              {/* Option 2: Helper */}
              <button
                type="button"
                onClick={() => {
                  onSetRole('helper');
                  onNavigate('/app/helper/feed');
                }}
                className="p-5 rounded-panel border-2 border-brand-teal/30 hover:border-brand-teal bg-brand-teal-light/20 dark:bg-brand-teal/10 text-left space-y-3 transition-all hover:scale-[1.02] group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-teal text-white flex items-center justify-center shadow-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text group-hover:text-brand-teal">
                  Deliver Items (Helper)
                </h3>
                <p className="text-xs text-neutral-secondary leading-relaxed">
                  Already heading out to shops? View open campus requests and earn ₹20–₹50 per delivery stop.
                </p>
                <span className="text-xs font-bold text-brand-teal block pt-2">
                  Launch Helper Feed →
                </span>
              </button>
            </div>

            <div className="p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 text-center text-xs text-neutral-secondary">
              💡 <strong>Remember:</strong> A persistent role switcher is always at the top of your screen.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
