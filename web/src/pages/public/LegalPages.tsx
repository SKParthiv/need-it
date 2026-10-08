import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

interface LegalPagesProps {
  type: 'privacy' | 'terms' | 'helper-rules';
  onNavigate: (path: string) => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ type, onNavigate }) => {
  const content = {
    privacy: {
      title: 'Privacy Policy & Student Data Protection',
      subtitle: 'Compliant with India\'s Digital Personal Data Protection (DPDP) Act',
      lastUpdated: 'October 2026',
      sections: [
        {
          id: 'collection',
          heading: '1. What We Collect and Why',
          text: 'We only collect data strictly necessary to facilitate verified peer logistics on campus: your institutional SASTRA email (your_reg_no@sastra.ac.in), full student name, hostel block or daytime pickup point, and transactional chat receipts. We do not track fine-grained GPS locations or request banking credentials.'
        },
        {
          id: 'visibility',
          heading: '2. Who Sees Your Information',
          text: 'Your phone number is hidden by default. In active orders, peers interact using masked student aliases (e.g. Student #4092). Full contact details are never made public. Only the student club team has access to order records for dispute mediation.'
        },
        {
          id: 'retention',
          heading: '3. Data Retention & Read-Only Archives',
          text: 'Order chat transcripts are preserved for 14 days after completion to handle any delayed disputes or item returns. After this period, chat messages are permanently deleted. Completed order summaries remain in your private archive.'
        },
        {
          id: 'rights',
          heading: '4. Student Rights under DPDP Act',
          text: 'You maintain the right to review the information associated with your account, correct inaccurate hostel block preferences, or request full account deletion upon graduation by emailing support.needit@sastra.ac.in.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service & Responsibility Policy',
      subtitle: 'Campus peer logistics rules and student mutual responsibilities',
      lastUpdated: 'October 2026',
      sections: [
        {
          id: 'eligibility',
          heading: '1. Student Eligibility & Verification',
          text: 'Access to NEEDIT is restricted to enrolled students, researchers, and campus faculty possessing a valid SASTRA email in the format your_reg_no@sastra.ac.in. Accounts found sharing credentials or misrepresenting identity will face immediate revocation.'
        },
        {
          id: 'prohibited',
          heading: '2. Prohibited Goods & Dietary Restrictions',
          text: 'All non-vegetarian food items (chicken, mutton, fish, egg, meat, seafood) are strictly prohibited on campus premises under university regulations. Alcohol, tobacco, vape cartridges, prescription narcotics, and hazardous items are also strictly barred. Pilot orders cannot exceed 5 kg in weight or ₹1,500 in total retail value.'
        },
        {
          id: 'cancellation',
          heading: '3. Cancellations & "Pay ₹0" Guarantee',
          text: 'Requesters may cancel without cost at any time prior to the helper purchasing items at the counter. If an item cannot be sourced or the store is closed, the requester owes ₹0. Post-purchase cancellations require mutual consent or club council review.'
        },
        {
          id: 'disputes',
          heading: '4. Dispute Resolution & Disciplinary Escalation',
          text: 'In the event of lost goods or physical damage, the campus student club team investigates chat transcripts and store receipts to issue fair determinations. Severe violations of campus conduct are reported directly to the Dean of Student Affairs.'
        }
      ]
    },
    'helper-rules': {
      title: 'Pilot Rules for Student Helpers',
      subtitle: 'Code of conduct for students providing delivery assistance',
      lastUpdated: 'October 2026',
      sections: [
        {
          id: 'voluntary',
          heading: '1. 100% Voluntary Participation',
          text: 'Accepting delivery requests is always voluntary. You are never obliged to accept orders, maintain minimum active hours, or take deliveries that deviate from your personal schedule.'
        },
        {
          id: 'cash',
          heading: '2. Zero Personal Cash Fronting',
          text: 'Helpers must never use personal money to purchase goods for unknown requesters. Always upload the retail store’s official cashier UPI QR code in the private chat, ensuring the customer pays the merchant directly.'
        },
        {
          id: 'handovers',
          heading: '3. Approved Campus Locations Only',
          text: 'Deliveries must take place at recognized public campus drop-offs (hostel block lounges, central library steps, gate pavilions). Never enter another student’s private dorm room to deliver parcels.'
        },
        {
          id: 'release',
          heading: '4. Safe Release with No Penalties',
          text: 'If you encounter long queues, out-of-stock items, or a sudden change of plans before purchasing goods, tap "Release request" immediately. There is zero penalty or negative rating for releasing unpurchased requests.'
        }
      ]
    }
  }[type];

  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Desktop Sticky Table of Contents (Section 17) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 p-5 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card space-y-4 shadow-e1">
              <span className="text-xs font-bold text-neutral-secondary uppercase tracking-wider block">
                Table of Contents
              </span>
              <ul className="space-y-2 text-xs">
                {content.sections.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="text-neutral-body dark:text-slate-300 hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode block py-1 font-medium transition-colors"
                    >
                      {sec.heading}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-neutral-border dark:border-slate-800 space-y-2">
                <span className="text-[11px] text-neutral-secondary block font-semibold">Related Policies:</span>
                <div className="flex flex-col gap-1.5 text-xs text-brand-indigo dark:text-brand-indigo-darkmode">
                  <button onClick={() => onNavigate('/privacy')} className="text-left hover:underline">
                    Privacy Policy (DPDP)
                  </button>
                  <button onClick={() => onNavigate('/terms')} className="text-left hover:underline">
                    Terms & Responsibility
                  </button>
                  <button onClick={() => onNavigate('/helper-rules')} className="text-left hover:underline">
                    Helper Pilot Rules
                  </button>
                  <button onClick={() => onNavigate('/prohibited-items')} className="text-left hover:underline">
                    Prohibited Items List
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Long-form readable prose (max-w 65ch per Section 17 & Section 4.3) */}
          <div className="lg:col-span-8 max-w-prose-custom space-y-8">
            <div className="space-y-2 pb-6 border-b border-neutral-border dark:border-slate-800">
              <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
                Official Campus Policy
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
                {content.title}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary">
                {content.subtitle} • Last reviewed: {content.lastUpdated}
              </p>
            </div>

            <div className="space-y-8">
              {content.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="space-y-2.5 scroll-mt-24">
                  <h2 className="font-heading font-bold text-lg sm:text-xl text-neutral-ink dark:text-neutral-dark-text">
                    {sec.heading}
                  </h2>
                  <p className="text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed">
                    {sec.text}
                  </p>
                </section>
              ))}
            </div>

            <div className="pt-8 border-t border-neutral-border dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-neutral-secondary">Need to report a violation?</span>
              <button
                onClick={() => onNavigate('/contact')}
                className="font-semibold text-brand-indigo dark:text-brand-indigo-darkmode hover:underline flex items-center gap-1"
              >
                <span>Contact Club Moderation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
