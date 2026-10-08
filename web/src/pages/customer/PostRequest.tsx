import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Info
} from 'lucide-react';
import { campusPickupPoints, prohibitedItemsList } from '../../data/mockData';
import { useWebApp } from '../../context/WebAppContext';

interface PostRequestProps {
  onNavigate: (path: string) => void;
  onPostSuccess: (newOrderId: string) => void;
}

export const PostRequest: React.FC<PostRequestProps> = ({
  onNavigate,
  onPostSuccess
}) => {
  const { addOrder, currentUser } = useWebApp();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [items, setItems] = useState([
    { name: '', quantity: 1, expectedPrice: '', notes: '' }
  ]);
  const [prohibitedError, setProhibitedError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('Stationery');
  const [neededByTime, setNeededByTime] = useState('Today, 7:30 PM');
  const [isUrgent, setIsUrgent] = useState(false);

  const [alternativesAllowed, setAlternativesAllowed] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState('250');
  const [brandNotes, setBrandNotes] = useState('Any reputable brand is fine if Classmate is out of stock');

  const [pickupPoint, setPickupPoint] = useState(campusPickupPoints[2].name);

  // Suggested Fee (Pilot range ₹20 - ₹50)
  const suggestedFee = isUrgent ? 45 : 30;
  const sizeTag: 'S' | 'M' | 'L' = items.length > 2 ? 'M' : 'S';

  const categories = [
    'Food',
    'Snacks',
    'Personal care',
    'Stationery',
    'Academic supplies'
  ];

  // Prohibited items keywords
  const checkProhibited = (text: string) => {
    const lower = text.toLowerCase();
    
    // Strict non-veg prohibition rule
    const nonVegKeywords = [
      'chicken', 'meat', 'mutton', 'fish', 'egg', 'eggs', 'non-veg', 'nonveg', 'non veg',
      'beef', 'pork', 'seafood', 'prawn', 'prawns', 'crab', 'shawarma', 'biryani (non-veg)'
    ];
    for (const nv of nonVegKeywords) {
      if (lower.includes(nv)) {
        return `"${nv}" is strictly prohibited. Non-vegetarian food items are NOT permitted on campus premises.`;
      }
    }

    const banned = ['alcohol', 'beer', 'vodka', 'whiskey', 'wine', 'cigarette', 'vape', 'tobacco', 'weed', 'knife', 'drug', 'medicine', 'prescription'];
    for (const b of banned) {
      if (lower.includes(b)) {
        return `"${b}" is prohibited under university campus rules. Orders containing banned substances cannot be posted.`;
      }
    }
    return null;
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);

    if (field === 'name') {
      const err = checkProhibited(value);
      setProhibitedError(err);
    }
  };

  const addItemRow = () => {
    setItems([...items, { name: '', quantity: 1, expectedPrice: '', notes: '' }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleSubmitOrder = () => {
    const validItems = items.filter((it) => it.name.trim().length > 0);
    const orderItems = validItems.length > 0 ? validItems : items;

    const calculatedItemCost = orderItems.reduce(
      (sum, it) => sum + (Number(it.expectedPrice) || 40) * (Number(it.quantity) || 1),
      0
    );

    const createdOrder = addOrder({
      customerName: currentUser.name,
      customerAlias: currentUser.alias || 'Student Requester',
      customerHostel: currentUser.hostel || 'Hostel Block A',
      pickupPoint,
      items: orderItems.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        name: it.name.trim() || 'Campus essentials',
        quantity: Number(it.quantity) || 1,
        expectedPrice: Number(it.expectedPrice) || 40,
        actualPrice: Number(it.expectedPrice) || 40,
        notes: it.notes || brandNotes,
        category: category,
        status: 'pending',
      })),
      category: category as any,
      sizeTag,
      neededBy: neededByTime,
      isUrgent,
      isWaitingLong: false,
      helperFee: suggestedFee,
      itemCost: calculatedItemCost,
      totalCost: calculatedItemCost + suggestedFee,
      status: 'open',
    });

    onPostSuccess(createdOrder.id);
    onNavigate(`/app/orders/${createdOrder.id}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Stepper Progress Bar (6 Steps) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-neutral-secondary">
            Step {currentStep} of 6: {
              ['Add items', 'Category', 'Time window', 'Preferences', 'Pickup point', 'Review & fee'][currentStep - 1]
            }
          </span>
          <span className="text-brand-indigo dark:text-brand-indigo-darkmode font-mono">
            {Math.round((currentStep / 6) * 100)}%
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-surface-alt dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-indigo transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
        {/* STEP 1: Add Items */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                What items do you need?
              </h2>
              <p className="text-xs text-neutral-secondary mb-2">
                Specify item names, estimated store prices, and quantity.
              </p>
              <div className="p-2.5 rounded-input bg-semantic-danger-tint/60 dark:bg-semantic-danger/15 border border-semantic-danger/30 text-xs text-semantic-danger dark:text-semantic-danger-dark font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-semantic-danger" />
                <span>Strict Rule: Any non-vegetarian items (meat, chicken, fish, egg, etc.) are strictly prohibited.</span>
              </div>
            </div>

            {/* Inline Prohibited Error Warning (Section 10.4: field border colour + message slides down 150ms) */}
            {prohibitedError && (
              <div className="p-3.5 rounded-input bg-semantic-danger-tint border border-semantic-danger/30 text-xs text-semantic-danger flex items-start gap-2 animate-shake error-msg-enter">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Prohibited Item Detected</span>
                  <p>{prohibitedError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-card bg-neutral-surface-alt/50 dark:bg-slate-800/50 border border-neutral-border dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-secondary">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-semantic-danger hover:text-red-700 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className={`w-full h-11 px-3 rounded-input bg-white dark:bg-slate-800 border text-sm focus:outline-none transition-colors duration-150 ${
                        prohibitedError && idx === 0
                          ? 'border-semantic-danger ring-1 ring-semantic-danger/30'
                          : 'border-neutral-border dark:border-slate-700 focus:ring-2 focus:ring-brand-indigo'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full h-11 px-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Expected Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={item.expectedPrice}
                        onChange={(e) => handleItemChange(idx, 'expectedPrice', e.target.value)}
                        className="w-full h-11 px-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-secondary mb-1">
                      Notes or Brand Preference (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                      className="w-full h-10 px-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItemRow}
                className="w-full h-10 rounded-input border-2 border-dashed border-brand-indigo/30 hover:border-brand-indigo text-brand-indigo dark:text-brand-indigo-darkmode text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Category */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Pick Main Category
              </h2>
              <p className="text-xs text-neutral-secondary">
                Helps helpers browsing the campus feed group their shopping stops.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-4 rounded-card border text-left transition-all ${
                    category === cat
                      ? 'border-brand-indigo bg-brand-indigo-light/30 dark:bg-brand-indigo/15 text-brand-indigo dark:text-brand-indigo-darkmode font-bold shadow-sm'
                      : 'border-neutral-border dark:border-slate-700 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                  }`}
                >
                  <span className="text-sm block">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Time & Urgent Flag */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                When is this needed by?
              </h2>
              <p className="text-xs text-neutral-secondary">
                Helpers take orders that match their current walking route.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Needed-By Time Window *
              </label>
              <select
                value={neededByTime}
                onChange={(e) => setNeededByTime(e.target.value)}
                className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              >
                <option>Within 45 mins (Urgent)</option>
                <option>Today, 7:00 PM – 8:00 PM</option>
                <option>Today, 9:00 PM – 10:00 PM (Late night)</option>
                <option>Tomorrow Morning (Before 10:00 AM)</option>
              </select>
            </div>

            {/* Urgent Flag Toggle per Section 3.6 & 5.2 */}
            <div className="p-4 rounded-card bg-semantic-danger-tint/30 dark:bg-semantic-danger/10 border border-semantic-danger/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-semantic-danger text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-semantic-danger dark:text-semantic-danger-dark block">
                    Mark as Urgent Request
                  </span>
                  <span className="text-[11px] text-neutral-secondary">
                    Flags red on feed. Slightly higher suggested fee (+₹15).
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-5 h-5 rounded text-semantic-danger focus:ring-semantic-danger"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Preferences */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Substitution & Budget Preferences
              </h2>
              <p className="text-xs text-neutral-secondary">
                Guide your helper if the exact brand or size is out of stock.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Are alternatives allowed?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlternativesAllowed(true)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    alternativesAllowed
                      ? 'bg-brand-indigo text-white border-brand-indigo'
                      : 'border-neutral-border text-neutral-secondary'
                  }`}
                >
                  Yes, with photo approval
                </button>
                <button
                  type="button"
                  onClick={() => setAlternativesAllowed(false)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    !alternativesAllowed
                      ? 'bg-brand-indigo text-white border-brand-indigo'
                      : 'border-neutral-border text-neutral-secondary'
                  }`}
                >
                  No, exact items only
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                Maximum Budget Limit (₹)
              </label>
              <input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
              <span className="text-[11px] text-neutral-secondary mt-1 block">
                Helper will not proceed if total exceeds this amount without prior approval.
              </span>
            </div>

            <div>
              <label className="block text-xs text-neutral-secondary mb-1">
                Brand / Size Specific Notes
              </label>
              <textarea
                rows={2}
                value={brandNotes}
                onChange={(e) => setBrandNotes(e.target.value)}
                className="w-full p-2.5 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Pickup Point */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Select Approved Campus Pickup Point
              </h2>
              <p className="text-xs text-neutral-secondary">
                Deliveries must take place at public campus common spaces.
              </p>
            </div>

            <div className="space-y-2">
              {campusPickupPoints.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPickupPoint(p.name)}
                  className={`w-full p-3.5 rounded-card border text-left flex items-center gap-3 transition-colors ${
                    pickupPoint === p.name
                      ? 'border-brand-indigo bg-brand-indigo-light/30 dark:bg-brand-indigo/15 text-brand-indigo dark:text-brand-indigo-darkmode font-semibold'
                      : 'border-neutral-border dark:border-slate-700 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0 text-brand-indigo" />
                  <span className="text-sm font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Review & Suggested Fee */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Review & Confirm Request
              </h2>
              <p className="text-xs text-neutral-secondary">
                Only verified student helpers will see this request after posting.
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 space-y-3 text-xs">
              <div className="flex justify-between items-start pb-2 border-b border-neutral-border dark:border-slate-700">
                <div>
                  <span className="font-bold text-sm text-neutral-ink dark:text-neutral-dark-text block">
                    {items.map((it) => `${it.quantity}x ${it.name || 'Unnamed item'}`).join(', ')}
                  </span>
                  <span className="text-neutral-secondary">
                    Category: {category} • Size: <strong className="font-mono">{sizeTag}</strong>
                  </span>
                </div>
                <span className="text-brand-indigo dark:text-brand-indigo-darkmode font-bold">
                  {isUrgent ? '⚡ Urgent' : 'Standard'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-neutral-secondary">
                  <span>Pickup Location:</span>
                  <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text">{pickupPoint}</span>
                </div>
                <div className="flex justify-between text-neutral-secondary">
                  <span>Needed By:</span>
                  <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text">{neededByTime}</span>
                </div>
              </div>
            </div>

            {/* Suggested Helper Fee Box (Section 6.2 Pilot range ₹20 - ₹50) */}
            <div className="p-4 rounded-card bg-brand-teal-light/40 dark:bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand-teal uppercase tracking-wider block">
                  Suggested Helper Fee
                </span>
                <span className="text-xs text-neutral-secondary">
                  Pilot suggested rate (base + distance + size {sizeTag})
                </span>
              </div>
              <div className="text-right">
                <span className="font-heading font-extrabold text-2xl font-mono text-brand-teal block">
                  ₹{suggestedFee}
                </span>
                <span className="text-[10px] text-neutral-placeholder">Paid upon handover</span>
              </div>
            </div>

            <div className="p-3 rounded-input bg-brand-indigo-light/40 dark:bg-brand-indigo/10 border border-brand-indigo/20 text-xs text-brand-indigo flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Zero risk guarantee:</strong> You pay ₹0 if the item cannot be found or if you cancel before purchase.
              </span>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="pt-4 border-t border-neutral-border dark:border-slate-800 flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="h-11 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              disabled={currentStep === 1 && (items[0].name.trim() === '' || !!prohibitedError)}
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`h-11 px-6 rounded-btn text-xs font-semibold text-white flex items-center gap-1.5 transition-colors ${
                currentStep === 1 && (items[0].name.trim() === '' || !!prohibitedError)
                  ? 'bg-neutral-border text-neutral-disabled cursor-not-allowed'
                  : 'bg-brand-indigo hover:bg-brand-indigo-dark'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitOrder}
              className="h-12 px-7 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              Post Request to Helpers →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
