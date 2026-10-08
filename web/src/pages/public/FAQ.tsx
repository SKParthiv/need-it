import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, ArrowRight } from 'lucide-react';

interface FAQProps {
  onNavigate: (path: string) => void;
}

export const FAQ: React.FC<FAQProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ '0-0': true });
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      name: 'Getting started',
      questions: [
        {
          q: 'Can anyone outside college sign up?',
          a: 'No. NEEDIT is strictly limited to students and campus residents holding an active, verified institutional SASTRA email in the format your_reg_no@sastra.ac.in.'
        },
        {
          q: 'Can I switch between being a Customer and a Helper?',
          a: 'Yes! One account holds both capabilities. You can seamlessly switch between "Customer" and "Helper" modes using the persistent top toggle at any time.'
        },
        {
          q: 'Is there an upfront subscription fee?',
          a: 'No. NEEDIT is free to join. There are no monthly fees, membership dues, or hidden costs.'
        },
        {
          q: 'How does student verification work?',
          a: 'When signing up, you enter your SASTRA email address (your_reg_no@sastra.ac.in). A one-time verification code is sent directly to your inbox. Once verified, your student badge is activated.'
        }
      ]
    },
    {
      name: 'Requesting items',
      questions: [
        {
          q: 'What types of items can I order?',
          a: 'Permitted items include vegetarian food, snacks, beverages, stationery, course books, lab charts, personal care items, and OTC health supplies.'
        },
        {
          q: 'Are non-vegetarian food items permitted on NEEDIT?',
          a: 'No. Strictly prohibited. Under SASTRA campus regulations, non-vegetarian food items (chicken, mutton, meat, fish, egg, seafood, etc.) are strictly barred from being requested, transported, or delivered on campus.'
        },
        {
          q: 'What is the maximum allowed package weight?',
          a: 'For our campus pilot, the maximum weight is 5 kg. Items must be safely transportable by a student walking or cycling.'
        },
        {
          q: 'What happens if my order remains open for too long?',
          a: 'If no helper has accepted within 30 minutes, an amber "Waiting long" banner appears on your order card, allowing you to extend the needed-by time or raise the offered helper fee.'
        },
        {
          q: 'Can I request items from multiple stores in one post?',
          a: 'To keep orders fast and simple for helpers, each request should ideally be sourced from a single store or commercial cluster.'
        }
      ]
    },
    {
      name: 'Being a helper',
      questions: [
        {
          q: 'Do I get penalized if I do not accept orders?',
          a: 'Never. Helping is 100% voluntary. You only accept requests when it aligns with your existing trips outside the hostel.'
        },
        {
          q: 'What happens if I accept an order but can no longer fulfill it?',
          a: 'Before you make any purchases at the store counter, you can safely tap "Release request". The request immediately returns to the campus feed for another peer, with zero penalty.'
        },
        {
          q: 'How does the "Going out" availability feature work?',
          a: 'You can set a future time window (e.g., "Tonight 7 PM - 9 PM"). Other students in your hostel block will be alerted to schedule orders around your shopping trip.'
        },
        {
          q: 'Can day scholars deliver to hostel residents?',
          a: 'Absolutely. Many day scholars deliver items on their way to campus classes or during lunch breaks.'
        }
      ]
    },
    {
      name: 'Fees & payment',
      questions: [
        {
          q: 'How is the helper fee calculated?',
          a: 'The suggested fee is between ₹20 and ₹50, based on distance from campus gates to the hostel and package size (S/M/L).'
        },
        {
          q: 'How do I pay for the items purchased?',
          a: 'The helper sends the store’s actual cashier UPI QR code in the private chat. You scan and pay the merchant directly via your UPI app.'
        },
        {
          q: 'When do I pay the helper fee?',
          a: 'The helper fee is paid directly to the helper via UPI only after the physical handover is confirmed using the 4-digit code.'
        },
        {
          q: 'Does NEEDIT charge a platform fee or transaction commission?',
          a: 'During the pilot phase, 0% commission is taken. 100% of the helper fee goes directly to the student peer.'
        }
      ]
    },
    {
      name: 'Safety & privacy',
      questions: [
        {
          q: 'Are non-vegetarian food items permitted on NEEDIT?',
          a: 'Strictly prohibited. Under campus regulations, all non-vegetarian food items (chicken, mutton, fish, egg, meat, seafood) are strictly prohibited on campus grounds.'
        },
        {
          q: 'Are my phone number and room number visible to others?',
          a: 'No. Order chats use anonymous student aliases (e.g. Student #4092). Personal phone numbers remain masked unless both parties agree to reveal them.'
        },
        {
          q: 'Can deliveries happen inside private hostel dorm rooms?',
          a: 'Strictly prohibited. All handovers must occur at designated public campus locations (e.g. hostel block ground lounges, library porticos).'
        },
        {
          q: 'What is the purpose of the 4-digit handover code?',
          a: 'The code confirms that the helper handed the correct package to the verified requester before payments are completed.'
        },
        {
          q: 'What happens to chat history after delivery?',
          a: 'As soon as an order is marked Completed, the chat becomes permanently read-only to preserve privacy and prevent unwanted contact.'
        }
      ]
    },
    {
      name: 'Problems & cancellations',
      questions: [
        {
          q: 'What if the store is out of stock?',
          a: 'The helper takes a quick photo of available alternatives. You receive equal "Approve" or "Decline" buttons. If you decline, you pay ₹0.'
        },
        {
          q: 'Can I cancel an order after the helper has already bought the items?',
          a: 'After purchase, cancellation requires mutual helper agreement through chat or club team escalation, since the helper has already purchased the goods.'
        },
        {
          q: 'What if an item is damaged during transit?',
          a: 'Use the persistent "Report a problem" button. The student club review team will inspect photos and mediate a fair resolution within 2 hours.'
        },
        {
          q: 'How do I report inappropriate behavior?',
          a: 'Tap "Report a problem" from any order or user profile. Violations of campus conduct result in immediate suspension and notification to hostel authorities.'
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((cat) => activeCategory === 'All' || cat.name === activeCategory);

  const toggleItem = (catIdx: number, qIdx: number) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header & Search */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-brand-indigo dark:text-brand-indigo-darkmode uppercase tracking-wider">
            Campus Knowledge Base
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-neutral-secondary dark:text-neutral-dark-secondary">
            Find quick answers regarding campus deliveries, pricing, safety, and helper rules.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 text-neutral-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search questions"
              className="w-full h-11 pl-10 pr-4 rounded-btn border border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === 'All'
                ? 'bg-brand-indigo text-white'
                : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary dark:text-neutral-dark-secondary hover:text-neutral-ink'
            }`}
          >
            All Categories
          </button>
          {faqCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.name
                  ? 'bg-brand-indigo text-white'
                  : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary dark:text-neutral-dark-secondary hover:text-neutral-ink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ List by Category */}
        <div className="space-y-8">
          {filteredCategories.map((cat, catIdx) => {
            if (cat.questions.length === 0) return null;
            return (
              <div key={cat.name} className="space-y-3">
                <h3 className="font-heading font-bold text-base uppercase tracking-wider text-brand-indigo dark:text-brand-indigo-darkmode">
                  {cat.name}
                </h3>
                <div className="space-y-2.5">
                  {cat.questions.map((q, qIdx) => {
                    const isOpen = !!openItems[`${catIdx}-${qIdx}`];
                    return (
                      <div
                        key={qIdx}
                        className="rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-neutral-dark-card overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(catIdx, qIdx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 font-heading font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text"
                        >
                          <span>{q.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-neutral-secondary shrink-0 transition-transform duration-250 ease-enter ${
                              isOpen ? 'rotate-180 text-brand-indigo' : ''
                            }`}
                          />
                        </button>
                        {/* Section 10.3: FAQ accordion height + chevron rotate 180° over 250ms */}
                        <div className={`accordion-grid ${isOpen ? 'accordion-grid-open' : 'accordion-grid-closed'}`}>
                          <div className="overflow-hidden">
                            <div className="px-4 pb-4 text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary leading-relaxed border-t border-neutral-border/40 dark:border-slate-800/40 pt-3">
                              {q.a}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Still Stuck? Box per spec */}
        <div className="p-6 sm:p-8 rounded-panel bg-neutral-surface-alt dark:bg-slate-900 border border-neutral-border dark:border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 mx-auto flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
            Still stuck with an unanswered question?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-secondary dark:text-neutral-dark-secondary max-w-md mx-auto">
            Our student club support team is active on WhatsApp and campus email to resolve queries.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/contact')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-btn bg-brand-indigo text-white text-xs font-semibold hover:bg-brand-indigo-dark transition-colors"
            >
              <span>Contact Campus Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
