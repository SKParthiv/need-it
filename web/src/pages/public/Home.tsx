import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Lock,
  CheckCircle2,
  ChevronDown,
  Coffee,
  BookOpen,
  Apple,
  Pencil,
  HeartPulse,
  QrCode,
  DollarSign,
  MapPin,
  PackageCheck,
  MessageSquare
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { SplitPricingCalculator } from '../../components/common/SplitPricingCalculator';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [activeSideTab, setActiveSideTab] = useState<'customer' | 'helper'>('customer');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Section 10.3: Hero demo loop (~12s loop: 4 steps x 3s each, pauses on hover / reduced motion)
  const [demoStep, setDemoStep] = useState<number>(0);
  const [isDemoPaused, setIsDemoPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isDemoPaused) return;
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [isDemoPaused]);

  const categories = [
    { name: 'Food & Meals', icon: Coffee, desc: 'Hot takeaway rolls, canteen meals, dining hall sides' },
    { name: 'Snacks & Drinks', icon: Apple, desc: 'Biscuits, chips, soft drinks, iced tea, chocolate' },
    { name: 'Personal Care', icon: HeartPulse, desc: 'Soaps, hand sanitizer, band-aids, shampoo, OTC relief' },
    { name: 'Stationery', icon: Pencil, desc: 'Notebooks, pens, xerox printouts, lab charts' },
    { name: 'Academic Supplies', icon: BookOpen, desc: 'Scientific calculators, drafting sheets, project kits' }
  ];

  const topFaqs = [
    {
      q: 'Who can place orders or deliver on NEEDIT?',
      a: 'Only students with an active, verified SASTRA email (your_reg_no@sastra.ac.in) can use NEEDIT. Non-campus individuals are strictly barred from signing up or seeing open requests.'
    },
    {
      q: 'How does the helper get paid?',
      a: 'Payment is cleanly split: You pay the shop directly via UPI QR code for the items bought. After handover is verified with your one-time code, you pay the separate ₹20–₹50 helper fee via UPI.'
    },
    {
      q: 'Where do student handovers take place?',
      a: 'All deliveries take place at pre-approved public campus locations such as hostel block ground lobbies, library porticos, or student center pavilions. Handovers inside private hostel dorm rooms are prohibited.'
    },
    {
      q: 'What if an item is out of stock?',
      a: 'Your helper takes a quick photo of available alternatives. You receive equal "Approve" or "Decline" buttons in chat. If you decline, you pay ₹0 for unbought items—guaranteed.'
    }
  ];

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-24 bg-gradient-to-b from-brand-indigo-light/30 via-neutral-page-bg to-neutral-page-bg dark:from-brand-indigo/10 dark:via-neutral-dark-page dark:to-neutral-dark-page border-b border-neutral-border dark:border-neutral-dark-border">
        {/* Section 10.7: Hero Ambient Background ("Campus in motion" 4-layer composition) */}
        {/* Layer 1: Soft gradient glow (3 blurred shapes on 18-28s alternate drift cycles) */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="hero-glow-1 absolute top-10 left-1/4 w-[500px] h-[350px] bg-brand-indigo/18 dark:bg-brand-indigo/25 rounded-full blur-[90px]" />
          <div className="hero-glow-2 absolute top-1/3 right-1/4 w-[450px] h-[320px] bg-violet-600/14 dark:bg-violet-600/22 rounded-full blur-[80px]" />
          <div className="hero-glow-3 absolute -bottom-10 left-1/3 w-[400px] h-[280px] bg-brand-teal/10 dark:bg-brand-teal/18 rounded-full blur-[80px]" />
          
          {/* Layer 2: Dot grid (24px spacing, slate dots at 8% opacity with vignette mask) */}
          <div 
            className="absolute inset-0 opacity-[0.08] dark:opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, #475569 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
            }}
          />

          {/* Layer 3: Delivery routes (animated continuous flowing dashed lines with pulsing endpoints) */}
          <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 120,180 Q 380,80 620,240 T 1100,160"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
              className="route-flow-1"
            />
            <circle cx="1100" cy="160" r="5" fill="#4F46E5" />
            <circle cx="1100" cy="160" r="14" fill="none" stroke="#4F46E5" strokeWidth="1.5" className="route-ping-circle" />

            <path
              d="M 200,420 Q 500,320 850,440"
              fill="none"
              stroke="#0F766E"
              strokeWidth="2"
              className="route-flow-2"
            />
            <circle cx="850" cy="440" r="5" fill="#0F766E" />
            <circle cx="850" cy="440" r="14" fill="none" stroke="#0F766E" strokeWidth="1.5" className="route-ping-circle" />
          </svg>

          {/* Layer 4: Floating outline icons (outline icons at 20-30% opacity near edges) */}
          <div className="float-icon-1 absolute top-20 left-12 text-brand-indigo opacity-25 hidden xl:block">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="float-icon-2 absolute bottom-24 left-24 text-brand-teal opacity-25 hidden xl:block">
            <MapPin className="w-7 h-7" />
          </div>
          <div className="float-icon-1 absolute top-32 right-16 text-brand-indigo opacity-20 hidden xl:block">
            <PackageCheck className="w-8 h-8" />
          </div>
          <div className="float-icon-2 absolute bottom-20 right-28 text-emerald-600 opacity-25 hidden xl:block">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        <div className="max-w-hero mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content (Section 10.3: Staggered load) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust pill */}
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-brand-indigo/20 shadow-e1 animate-fade-in"
              >
                <ShieldCheck className="w-4 h-4 text-brand-indigo dark:text-brand-indigo-darkmode" />
                <span className="text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text">
                  Verified SASTRA campus students only
                </span>
              </div>

              {/* Display Headline (10.3: lines fade-up 16px, 60ms stagger) */}
              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-neutral-ink dark:text-neutral-dark-text tracking-tight leading-[1.1] animate-slide-up">
                Get what you need <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-violet-600 dark:from-brand-indigo-darkmode dark:to-violet-400">
                  without leaving campus
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-neutral-secondary dark:text-neutral-dark-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in" style={{ animationDelay: '120ms' }}>
                Exam prep? Late study night? Student peers who are already heading out pick up your food, stationery, and medicines for a modest ₹20–₹50 helper fee.
              </p>

              {/* CTAs (10.3: CTA fade-up after headline) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up" style={{ animationDelay: '180ms' }}>
                <button
                  onClick={() => onNavigate('/register')}
                  className="w-full sm:w-auto h-12 px-7 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-medium shadow-e2 flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-100"
                >
                  <span>Request an item</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('/become-a-helper')}
                  className="w-full sm:w-auto h-12 px-7 rounded-btn bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-neutral-ink dark:text-neutral-dark-text font-medium hover:bg-neutral-surface-alt dark:hover:bg-slate-750 active:scale-[0.97] transition-all duration-100 flex items-center justify-center"
                >
                  Become a helper
                </button>
              </div>

              {/* Social Proof Line */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-neutral-secondary dark:text-neutral-dark-secondary animate-fade-in" style={{ animationDelay: '240ms' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon" />
                  <span>350+ Verified Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-indigo animate-beacon" />
                  <span>Avg. Delivery &lt; 35 mins</span>
                </div>
              </div>

              {/* Dynamic live campus errand floating card */}
              <div className="pt-2 flex justify-center lg:justify-start">
                <div className="float-hero-badge-1 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-brand-indigo/30 shadow-e2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-brand-indigo-light text-brand-indigo flex items-center justify-center font-bold text-[11px]">
                    ⚡
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-neutral-ink dark:text-neutral-dark-text block">Live Campus Order Handover</span>
                    <span className="text-[11px] text-neutral-secondary">KC Canteen → Boys’ Hostel Area (8 mins)</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon ml-1" />
                </div>
              </div>
            </div>

            {/* Right: Section 10.3 Hero Demo Loop (12s animated journey mockup) */}
            <div 
              className="lg:col-span-5 animate-slide-up relative"
              style={{ animationDuration: '600ms' }}
              onMouseEnter={() => setIsDemoPaused(true)}
              onMouseLeave={() => setIsDemoPaused(false)}
            >
              {/* Floating Live Courier Status Pill */}
              <div className="float-hero-badge-2 absolute -top-3.5 -right-2 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-brand-teal/40 shadow-e2 text-xs">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-beacon" />
                <span className="font-bold text-neutral-ink dark:text-neutral-dark-text text-[11px]">
                  🛵 Peer Courier Active
                </span>
                <span className="text-[10px] text-brand-teal font-mono font-bold">₹30 Fee</span>
              </div>

              <div className="relative mx-auto max-w-sm rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border p-5 shadow-e3 space-y-4">
                {/* Step indicator pills */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {[
                      { idx: 0, label: 'Post' },
                      { idx: 1, label: 'Accepted' },
                      { idx: 2, label: 'Store QR' },
                      { idx: 3, label: 'Code' },
                    ].map((step) => (
                      <button
                        key={step.idx}
                        onClick={() => setDemoStep(step.idx)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-200 ${
                          demoStep === step.idx
                            ? 'bg-brand-indigo text-white shadow-sm'
                            : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary'
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-secondary">
                    {isDemoPaused ? 'Paused' : 'Demo Loop'}
                  </span>
                </div>

                {/* Simulated Order Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-neutral-secondary">#ORD-1092</span>
                    <StatusChip 
                      status={
                        demoStep === 0 ? 'open' :
                        demoStep === 1 ? 'accepted' :
                        demoStep === 2 ? 'purchased' : 'handed_over'
                      } 
                      size="sm" 
                    />
                  </div>
                  <span className="text-xs text-neutral-secondary font-medium">Needed by 7:00 PM</span>
                </div>

                {/* Animated Dynamic Body based on demoStep */}
                {demoStep === 0 && (
                  <div className="bg-neutral-surface-alt dark:bg-slate-800/60 p-3.5 rounded-card space-y-2 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text">
                          A4 Ruled Notebook + Blue Pens
                        </h4>
                        <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
                          Bits & Bytes Stationery • Qty: 2
                        </p>
                      </div>
                      <span className="text-sm font-bold font-mono text-neutral-ink dark:text-neutral-dark-text">₹180</span>
                    </div>

                    <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-neutral-secondary">Helper fee (Size S)</span>
                      <span className="font-semibold text-brand-teal font-mono">+ ₹30</span>
                    </div>
                  </div>
                )}

                {demoStep === 1 && (
                  <div className="p-3.5 rounded-card bg-brand-teal-light/50 dark:bg-brand-teal/15 border border-brand-teal/20 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-teal-dark dark:text-emerald-300">
                        Peer Accepted Your Request
                      </span>
                      <VerifiedBadge size="sm" showText={false} />
                    </div>
                    <p className="text-xs text-brand-teal-dark dark:text-emerald-200">
                      <strong>Priya K.</strong> (Hostel Block C) has locked this request and is walking to Bits & Bytes Stationery.
                    </p>
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="space-y-2 pt-1 text-xs animate-fade-in">
                    <div className="p-2.5 rounded-xl rounded-tl-sm bg-brand-teal-light/50 dark:bg-brand-teal/15 text-brand-teal-dark dark:text-emerald-300 border border-brand-teal/20">
                      <div className="flex items-center justify-between font-semibold text-[11px] mb-0.5">
                        <span>Priya K. (Helper)</span>
                        <VerifiedBadge size="sm" showText={false} />
                      </div>
                      <p>Got the Classmate notebook! Scan shop standee below:</p>
                    </div>
                    <div className="p-2.5 rounded-card bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-surface-alt flex items-center justify-center text-brand-indigo">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-neutral-ink dark:text-neutral-dark-text block">Bits & Bytes UPI Standee</span>
                        <span className="text-[10px] text-neutral-secondary">Pay ₹180 direct to shop</span>
                      </div>
                    </div>
                  </div>
                )}

                {demoStep === 3 && (
                  <div className="p-3.5 rounded-card bg-brand-indigo-light/60 dark:bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-between animate-fade-in">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-indigo dark:text-brand-indigo-darkmode tracking-wider block">
                        One-Time Handover Code
                      </span>
                      <div className="font-mono text-xl font-extrabold text-neutral-ink dark:text-neutral-dark-text tracking-widest flex gap-1 pt-0.5">
                        {['4', '8', '2', '1'].map((d, i) => (
                          <span key={i} className={`inline-block digit-fade-${i}`}>{d}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-secondary font-medium">Boys’ Hostel Area</span>
                  </div>
                )}

                {/* Progress dot bar for demo */}
                <div className="pt-2 flex justify-center gap-1.5">
                  {[0, 1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        demoStep === s ? 'w-6 bg-brand-indigo' : 'w-1.5 bg-neutral-border dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (3 Steps) */}
      <section className="py-16 md:py-24 bg-white dark:bg-neutral-dark-page border-b border-neutral-border dark:border-neutral-dark-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
              Simple 3-Step Flow
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-neutral-ink dark:text-neutral-dark-text">
              How NEEDIT works on your campus
            </h2>
            <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
              Designed around student trust, transparent prices, and campus routine.
            </p>
          </div>

          <div className="relative">
            {/* Section 10.3: Step connector line draws between 'How it works' steps */}
            <div className="hidden md:block absolute top-12 left-12 right-12 h-1 pointer-events-none z-0">
              <svg className="w-full h-4 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                <line
                  x1="12%"
                  y1="6"
                  x2="88%"
                  y2="6"
                  stroke="#4F46E5"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  className="route-flow-1 opacity-50 dark:opacity-40"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="p-6 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card hover:shadow-e2 hover:-translate-y-1 transition-all duration-250 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-indigo text-white flex items-center justify-center font-heading font-bold text-lg shadow-sm">
                  1
                </div>
                <h3 className="font-heading font-semibold text-lg text-neutral-ink dark:text-neutral-dark-text">
                  Post your request
                </h3>
                <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                  Add the item name, expected price, and select your approved campus pickup spot. Set whether alternatives are acceptable.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card hover:shadow-e2 hover:-translate-y-1 transition-all duration-250 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-teal text-white flex items-center justify-center font-heading font-bold text-lg shadow-sm">
                  2
                </div>
                <h3 className="font-heading font-semibold text-lg text-neutral-ink dark:text-neutral-dark-text">
                  A student accepts
                </h3>
                <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                  A peer who is already visiting local shops locks your request. Private alias chat opens with photo item verification.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card hover:shadow-e2 hover:-translate-y-1 transition-all duration-250 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-heading font-bold text-lg shadow-sm">
                  3
                </div>
                <h3 className="font-heading font-semibold text-lg text-neutral-ink dark:text-neutral-dark-text">
                  Meet & confirm code
                </h3>
                <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                  Meet at your hostel lobby or library portico. Share your 4-digit code, confirm delivery, and pay the ₹20–₹50 helper fee.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('/how-it-works')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
            >
              <span>See full detailed walkthrough</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Two Sides (For Customers / For Helpers) */}
      <section className="py-16 md:py-24 bg-neutral-surface-alt dark:bg-slate-900 border-b border-neutral-border dark:border-neutral-dark-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
              Built for both sides of campus
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary">
              Whether you need something urgently or want to pocket extra cash on trips outside.
            </p>

            {/* Segmented Switcher */}
            <div className="inline-flex p-1 rounded-full bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 shadow-sm mt-4">
              <button
                onClick={() => setActiveSideTab('customer')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeSideTab === 'customer'
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'text-neutral-secondary dark:text-neutral-dark-secondary'
                }`}
              >
                For Customers
              </button>
              <button
                onClick={() => setActiveSideTab('helper')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeSideTab === 'helper'
                    ? 'bg-brand-teal text-white shadow-sm'
                    : 'text-neutral-secondary dark:text-neutral-dark-secondary'
                }`}
              >
                For Helpers
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-10 shadow-e2">
            {activeSideTab === 'customer' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                      Never leave your desk when deadlines hit
                    </h3>
                    <p className="text-xs text-neutral-secondary">Why students order with NEEDIT</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Zero Surge Pricing
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      Commercial delivery apps charge high platform fees and surge. NEEDIT helpers charge a flat ₹20–₹50.
                    </p>
                  </div>

                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Direct Shop QR Payment
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      Pay the exact retail price shown on the shop's cashier QR code. No markup or hidden cuts.
                    </p>
                  </div>

                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Hostel & Library Drop-offs
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      No need to trek to the campus outer perimeter. Meet at safe, approved spots inside your block.
                    </p>
                  </div>

                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ₹0 if Not Purchased
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      If the item is unavailable or you decline proposed substitutes, you pay absolutely nothing.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-border dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => onNavigate('/register')}
                    className="h-11 px-6 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-sm font-medium transition-colors"
                  >
                    Start Requesting Items →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal-light text-brand-teal flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
                      Earn while you're already stepping out
                    </h3>
                    <p className="text-xs text-neutral-secondary">Flexible, voluntary earnings for students</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                      100% Voluntary, No Penalty
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      Accept orders only when you feel like it. No shifts, minimums, or algorithmic penalties.
                    </p>
                  </div>

                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                      Never Front Your Own Cash
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      Send the store's UPI QR in chat. The customer pays the shop directly before you leave the counter.
                    </p>
                  </div>

                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                      Going-Out Availability
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      Broadcast "I'm heading out at 7 PM" so you get grouped requests along your walking route.
                    </p>
                  </div>

                  <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/50 space-y-1">
                    <h4 className="text-sm font-semibold text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                      Keep 100% of Helper Fee
                    </h4>
                    <p className="text-xs text-neutral-secondary">
                      Every rupee of the ₹20–₹50 helper fee goes directly to you via UPI right after the handover.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-border dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => onNavigate('/become-a-helper')}
                    className="h-11 px-6 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-medium transition-colors"
                  >
                    Join as a Helper →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. What You Can Request */}
      <section className="py-16 md:py-24 bg-white dark:bg-neutral-dark-page border-b border-neutral-border dark:border-neutral-dark-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
              Permitted Categories
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
              What you can request on campus
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary">
              Essentials that helpers can easily carry on foot or bicycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 hover:border-brand-indigo/30 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-e1 flex items-center justify-center text-brand-indigo dark:text-brand-indigo-darkmode">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prohibited items callout per spec */}
          <div className="mt-10 p-4 rounded-card bg-semantic-danger-tint/50 dark:bg-semantic-danger/10 border border-semantic-danger/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-semantic-danger dark:text-semantic-danger-dark font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Alcohol, tobacco, vapes, prescription drugs, and packages &gt;5kg are strictly prohibited.</span>
            </div>
            <button
              onClick={() => onNavigate('/prohibited-items')}
              className="text-semantic-danger dark:text-semantic-danger-dark font-bold hover:underline shrink-0"
            >
              See what's not allowed →
            </button>
          </div>
        </div>
      </section>

      {/* 5. Transparent Pricing Section */}
      <section className="py-16 md:py-24 bg-neutral-surface-alt dark:bg-slate-900 border-b border-neutral-border dark:border-neutral-dark-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
                Fair & Open Pricing
              </span>
              <h2 className="font-heading font-bold text-2xl sm:text-4xl text-neutral-ink dark:text-neutral-dark-text">
                Item cost + Helper fee. <br />
                Nothing hidden.
              </h2>
              <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                You never pay random service surcharges or inflated prices. Every order shows the exact split before the helper purchases anything.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-body dark:text-neutral-dark-text">
                    <strong>Shop QR directly to cashier:</strong> Pay the actual printed receipt total directly through UPI.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-body dark:text-neutral-dark-text">
                    <strong>Helper fee (₹20–₹50):</strong> Suggested based on walking distance and package size (S/M/L).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-body dark:text-neutral-dark-text">
                    <strong>Price protection guarantee:</strong> If the shop price is higher than expected, purchase is halted until you tap "Approve".
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/pricing')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
                >
                  <span>Read how fees are calculated</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split receipt visual card (Section 10.3: Split bars slide into place, total counts up 800ms) */}
            <div className="lg:col-span-6">
              <SplitPricingCalculator initialItemCost={105} initialHelperFee={25} allowCustomization={true} />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trust & Safety (4 Pillars) */}
      <section className="py-16 md:py-24 bg-white dark:bg-neutral-dark-page border-b border-neutral-border dark:border-neutral-dark-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
              Safety by Design
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
              Four trust pillars keeping campus secure
            </h2>
            <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary">
              We eliminate peer anxiety through verified credentials and privacy safeguards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                Verified Students
              </h3>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                Mandatory institutional email verification (your_reg_no@sastra.ac.in). No anonymous outsiders allowed.
              </p>
            </div>

            <div className="p-5 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                Private Alias Chat
              </h3>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                Personal phone numbers stay hidden. Chats close and become read-only immediately after delivery.
              </p>
            </div>

            <div className="p-5 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                Public Pickup Points
              </h3>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                Handovers happen exclusively at vetted campus locations like hostel block lobbies and library gates.
              </p>
            </div>

            <div className="p-5 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-indigo-light text-brand-indigo flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-neutral-ink dark:text-neutral-dark-text">
                One-Time Handover Code
              </h3>
              <p className="text-xs text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                A 4-digit code generated for each order guarantees items are handed to the correct requester.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => onNavigate('/safety')}
              className="text-xs font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
            >
              Learn about our complete trust framework →
            </button>
          </div>
        </div>
      </section>

      {/* 7. FAQ Preview Accordion */}
      <section className="py-16 md:py-24 bg-neutral-surface-alt dark:bg-slate-900 border-b border-neutral-border dark:border-neutral-dark-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {topFaqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-semibold text-sm sm:text-base text-neutral-ink dark:text-neutral-dark-text"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-secondary shrink-0 transition-transform duration-250 ease-enter ${
                      openFaq === i ? 'rotate-180 text-brand-indigo' : ''
                    }`}
                  />
                </button>
                {/* Section 10.3: FAQ accordion height + chevron rotate 180° over 250ms */}
                <div className={`accordion-grid ${openFaq === i ? 'accordion-grid-open' : 'accordion-grid-closed'}`}>
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed border-t border-neutral-border/40 dark:border-slate-800/40 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => onNavigate('/faq')}
              className="text-xs sm:text-sm font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline"
            >
              View all 20+ campus FAQs →
            </button>
          </div>
        </div>
      </section>

      {/* 8. Final CTA (Section 10.7: Lighter ambient glow version) */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-brand-indigo text-white">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="hero-glow-1 absolute -top-12 left-1/4 w-[400px] h-[300px] bg-white/10 rounded-full blur-[80px]" />
          <div className="hero-glow-2 absolute -bottom-10 right-1/4 w-[400px] h-[260px] bg-brand-teal/20 rounded-full blur-[70px]" />
        </div>

        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl tracking-tight">
            Ready to get campus essentials delivered?
          </h2>
          <p className="text-brand-indigo-light text-sm sm:text-base max-w-xl mx-auto opacity-90">
            Sign in with your verified college email to post your first request or start earning as a student helper today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/register')}
              className="w-full sm:w-auto h-12 px-8 rounded-btn bg-white text-brand-indigo font-bold hover:bg-neutral-surface-alt shadow-e2 transition-transform active:scale-[0.97]"
            >
              Sign up with SASTRA Email
            </button>
            <button
              onClick={() => onNavigate('/become-a-helper')}
              className="w-full sm:w-auto h-12 px-8 rounded-btn bg-brand-indigo-dark/70 hover:bg-brand-indigo-dark text-white font-medium border border-white/20 transition-all active:scale-[0.97]"
            >
              Become a Helper
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
