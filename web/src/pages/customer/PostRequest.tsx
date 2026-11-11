import React, { useState, useMemo } from 'react';
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
  ShieldAlert,
  ShoppingBag,
  Store,
  Loader2,
} from 'lucide-react';
import { campusPickupPoints } from '../../data/mockData';
import { useWebApp } from '../../context/WebAppContext';

interface PostRequestProps {
  onNavigate: (path: string) => void;
  onPostSuccess: (newOrderId: string) => void;
}

interface ErrandItemInput {
  id: string;
  name: string;
  quantity: number;
  expectedPrice: number;
  notes: string;
  category: 'Food' | 'Snacks' | 'Personal care' | 'Stationery' | 'Academic supplies';
}

export type DeliveryTiming =
  | 'Within 1 day'
  | 'Within 2 days'
  | 'Within 3 days'
  | 'Within 4 days'
  | 'Within 5 days'
  | 'More than 5 days';

const DELIVERY_TIMING_OPTIONS: { id: DeliveryTiming; label: string; desc: string }[] = [
  { id: 'Within 1 day', label: 'Within 1 day', desc: 'Fastest peer delivery (24 hrs)' },
  { id: 'Within 2 days', label: 'Within 2 days', desc: 'Standard 2-day delivery' },
  { id: 'Within 3 days', label: 'Within 3 days', desc: 'Flexible 3-day window' },
  { id: 'Within 4 days', label: 'Within 4 days', desc: 'Relaxed 4-day delivery' },
  { id: 'Within 5 days', label: 'Within 5 days', desc: 'Delivered within 5 days' },
  { id: 'More than 5 days', label: 'More than 5 days', desc: 'No rush / flexible date' },
];

const POPULAR_CAMPUS_PRESETS = [
  { name: 'A4 Spiral Notebook', price: 60, category: 'Stationery' as const },
  { name: 'Blue Gel Pens (Pack of 3)', price: 45, category: 'Stationery' as const },
  { name: 'Veg Puff + Cold Coffee', price: 55, category: 'Food' as const },
  { name: 'Biscuits & Cookies', price: 30, category: 'Snacks' as const },
  { name: 'Paracetamol & Bandages', price: 35, category: 'Personal care' as const },
  { name: 'Scientific Calculator', price: 620, category: 'Academic supplies' as const },
];

const maxItemsAllowed = 10;
const maxOrderValueAllowed = 1000;

export const PostRequest: React.FC<PostRequestProps> = ({
  onNavigate,
  onPostSuccess,
}) => {
  const { addOrder, currentUser } = useWebApp();

  // Progressive Steps: 1: Items -> 2: Pickup & Timing -> 3: Review & Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // STEP 1 STATE: Repeating Item Cards
  const [items, setItems] = useState<ErrandItemInput[]>([
    {
      id: `item-${Date.now()}-0`,
      name: '',
      quantity: 1,
      expectedPrice: 40,
      notes: '',
      category: 'Food',
    },
  ]);
  const [prohibitedError, setProhibitedError] = useState<string | null>(null);
  const [blockedError, setBlockedError] = useState<{ reason: string; appealHint?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // STEP 2 STATE: Pickup & Timing Options
  const [pickupPoint, setPickupPoint] = useState<string>(
    currentUser.pickupPoint || campusPickupPoints[0].name
  );
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [timePreset, setTimePreset] = useState<DeliveryTiming>('Within 1 day');
  const [preferredStore, setPreferredStore] = useState<string>('Canopy Canteen & Refreshments');

  // Filtered campus locations
  const filteredPickupLocations = useMemo(() => {
    if (!searchLocation.trim()) return campusPickupPoints;
    return campusPickupPoints.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
        p.area.toLowerCase().includes(searchLocation.toLowerCase())
    );
  }, [searchLocation]);

  // Policy check against non-veg / prohibited keywords
  const checkProhibitedTerms = (text: string): string | null => {
    const prohibitedKeywords = [
      'chicken', 'mutton', 'meat', 'fish', 'egg', 'beef', 'pork', 'non-veg',
      'alcohol', 'beer', 'cigarette', 'vape', 'tobacco', 'beedi',
      'weed', 'hookah', 'lighter', 'knife', 'firecracker'
    ];
    const lower = text.toLowerCase();
    for (const kw of prohibitedKeywords) {
      if (lower.includes(kw)) {
        if (['chicken', 'mutton', 'meat', 'fish', 'egg', 'beef', 'pork', 'non-veg'].includes(kw)) {
          return `"${kw}" is prohibited. SASTRA campus policy is strictly vegetarian.`;
        }
        return `"${kw}" is restricted under campus safety rules.`;
      }
    }
    return null;
  };

  const handleItemNameChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].name = val;
    setItems(updated);

    const error = checkProhibitedTerms(val);
    setProhibitedError(error);
  };

  const handleItemQuantityChange = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = Math.max(1, Math.min(10, updated[index].quantity + delta));
    updated[index].quantity = newQty;
    setItems(updated);
  };

  const handleItemPriceChange = (index: number, priceStr: string) => {
    const updated = [...items];
    const num = Math.max(0, parseInt(priceStr, 10) || 0);
    updated[index].expectedPrice = num;
    setItems(updated);
  };

  const handleItemCategoryChange = (index: number, cat: ErrandItemInput['category']) => {
    const updated = [...items];
    updated[index].category = cat;
    setItems(updated);
  };

  const handleItemNotesChange = (index: number, notes: string) => {
    const updated = [...items];
    updated[index].notes = notes;
    setItems(updated);
  };

  const addItemRow = () => {
    if (items.length >= maxItemsAllowed) return;
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length}`,
        name: '',
        quantity: 1,
        expectedPrice: 30,
        notes: '',
        category: 'Food',
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      const remaining = items.filter((_, i) => i !== idx);
      setItems(remaining);
      let foundErr: string | null = null;
      for (const it of remaining) {
        const e = checkProhibitedTerms(it.name);
        if (e) {
          foundErr = e;
          break;
        }
      }
      setProhibitedError(foundErr);
    }
  };

  const applyPresetItem = (preset: typeof POPULAR_CAMPUS_PRESETS[0]) => {
    if (items.length === 1 && items[0].name.trim() === '') {
      setItems([
        {
          id: items[0].id,
          name: preset.name,
          quantity: 1,
          expectedPrice: preset.price,
          notes: '',
          category: preset.category,
        },
      ]);
    } else if (items.length < maxItemsAllowed) {
      setItems([
        ...items,
        {
          id: `item-${Date.now()}-${items.length}`,
          name: preset.name,
          quantity: 1,
          expectedPrice: preset.price,
          notes: '',
          category: preset.category,
        },
      ]);
    }
  };

  // Calculations
  const calculatedItemsTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.expectedPrice * it.quantity, 0);
  }, [items]);

  const isValueExceeded = calculatedItemsTotal > maxOrderValueAllowed;
  const isFirstItemEmpty = items[0].name.trim().length === 0;

  // Submit Order - One Confirmation Action on Final Review
  const handleSubmitOrder = async () => {
    if (prohibitedError || isValueExceeded || isFirstItemEmpty || isSubmitting) return;

    setBlockedError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    const validItems = items.filter((it) => it.name.trim().length > 0);
    const primaryCategory = validItems[0]?.category || 'Food';

    try {
      const newOrder = await addOrder({
        customerName: currentUser.name,
        customerAlias: currentUser.alias || 'Student Requester',
        customerHostel: currentUser.hostel || 'Campus Hostel',
        pickupPoint,
        items: validItems.map((it) => ({
          id: it.id,
          name: it.name.trim(),
          quantity: it.quantity,
          expectedPrice: it.expectedPrice,
          actualPrice: it.expectedPrice,
          notes: it.notes || '',
          category: it.category,
          status: 'pending',
        })),
        category: primaryCategory as any,
        sizeTag: validItems.length > 2 ? 'M' : 'S',
        neededBy: timePreset,
        isUrgent: timePreset === 'Within 1 day',
        isWaitingLong: false,
        suggestedStore: preferredStore,
        helperFee: 25,
        itemCost: calculatedItemsTotal,
        totalCost: calculatedItemsTotal + 25,
        status: 'open',
      });

      onPostSuccess(newOrder.id);
      onNavigate(`/app/orders/${newOrder.id}`);
    } catch (err: any) {
      if (err?.isForbidden || err?.status === 403) {
        setBlockedError({
          reason: err?.reason || err?.message || 'Posting requests is restricted.',
          appealHint: err?.appealHint || 'Please file an appeal through the Report a Problem page.',
        });
      } else {
        setSubmitError(err?.message || 'Failed to create request. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Blocked banner if 403 */}
      {blockedError && (
        <div className="p-4 rounded-panel bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-800 dark:text-rose-200 block">
                Request Posting Restricted
              </span>
              <p className="text-neutral-secondary dark:text-rose-300/90 leading-relaxed">
                {blockedError.reason}
              </p>
              {blockedError.appealHint && (
                <p className="text-[11px] text-neutral-body dark:text-rose-200/80 font-medium">
                  {blockedError.appealHint}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigate('/app/report')}
            className="px-3.5 py-1.5 rounded-btn bg-rose-600 hover:bg-rose-700 text-white font-semibold shrink-0 text-xs transition-colors"
          >
            File Appeal
          </button>
        </div>
      )}

      {/* Stepper Progress Bar (3 Simple Stages) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-neutral-secondary">
            Step {currentStep} of 3:{' '}
            {currentStep === 1
              ? 'Item List & Quantities'
              : currentStep === 2
              ? 'Pickup Spot & Delivery Window'
              : 'Review & Confirm'}
          </span>
          <span className="text-brand-indigo dark:text-brand-indigo-darkmode font-mono font-bold">
            {currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%'}
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-surface-alt dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-indigo transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Repeating Item Cards */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-border/60 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-neutral-ink dark:text-neutral-dark-text">
                What do you need?
              </h2>
              <p className="text-xs text-neutral-secondary mt-0.5">
                Add each errand item with estimated price and quantity. (Max {maxItemsAllowed} items)
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Strictly Vegetarian Campus</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-neutral-secondary uppercase tracking-wider mb-2">
              Popular Campus Essentials (One-Tap Add)
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CAMPUS_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPresetItem(preset)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-surface-alt dark:bg-slate-800 hover:bg-brand-indigo-light hover:text-brand-indigo border border-neutral-border dark:border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{preset.name}</span>
                  <span className="font-mono text-neutral-secondary">₹{preset.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prohibited Items Warning */}
          {prohibitedError && (
            <div className="p-3.5 rounded-card bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{prohibitedError}</span>
            </div>
          )}

          {/* Repeating Item Cards */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-neutral-border dark:border-slate-700 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-secondary">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="text-neutral-secondary hover:text-rose-600 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Item Name */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="block text-xs font-medium text-neutral-ink dark:text-neutral-dark-text">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A4 Record Note, Paracetamol strip, Cold Coffee"
                      value={item.name}
                      onChange={(e) => handleItemNameChange(index, e.target.value)}
                      className="w-full h-10 px-3 rounded-input bg-white dark:bg-slate-900 border border-neutral-border text-xs focus:outline-none focus:border-brand-indigo"
                    />
                  </div>

                  {/* Quantity Counter */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-medium text-neutral-ink dark:text-neutral-dark-text">
                      Quantity
                    </label>
                    <div className="flex items-center h-10 border border-neutral-border rounded-input bg-white dark:bg-slate-900 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleItemQuantityChange(index, -1)}
                        className="w-8 h-full flex items-center justify-center hover:bg-neutral-surface-alt text-neutral-secondary"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-mono font-bold text-xs text-neutral-ink dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleItemQuantityChange(index, 1)}
                        className="w-8 h-full flex items-center justify-center hover:bg-neutral-surface-alt text-neutral-secondary"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Estimated Price */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-medium text-neutral-ink dark:text-neutral-dark-text">
                      Estimated Cost (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.expectedPrice || ''}
                      onChange={(e) => handleItemPriceChange(index, e.target.value)}
                      placeholder="40"
                      className="w-full h-10 px-3 rounded-input bg-white dark:bg-slate-900 border border-neutral-border text-xs font-mono focus:outline-none focus:border-brand-indigo"
                    />
                  </div>
                </div>

                {/* Specific brand / flavor instructions */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Brand preference, size, or replacement note (optional)"
                    value={item.notes}
                    onChange={(e) => handleItemNotesChange(index, e.target.value)}
                    className="w-full h-8 px-3 rounded-input bg-white dark:bg-slate-900 border border-neutral-border/60 text-[11px] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Item Button */}
          {items.length < maxItemsAllowed && (
            <button
              type="button"
              onClick={addItemRow}
              className="w-full py-2.5 rounded-btn border-2 border-dashed border-neutral-border hover:border-brand-indigo text-xs font-bold text-brand-indigo flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item</span>
            </button>
          )}

          {/* Item Subtotal Bar */}
          <div className="p-4 rounded-xl bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-secondary">
              Total Estimated Items Cost ({items.reduce((s, it) => s + it.quantity, 0)} pcs):
            </span>
            <span className="font-mono font-bold text-base text-neutral-ink dark:text-white">
              ₹{calculatedItemsTotal}
            </span>
          </div>

          {/* Step 1 Next Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isFirstItemEmpty || !!prohibitedError || isValueExceeded}
              onClick={() => setCurrentStep(2)}
              className="h-11 px-6 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-semibold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
            >
              <span>Continue to Pickup & Timing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Pickup & Delivery Timing Options */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
          <div className="border-b border-neutral-border/60 dark:border-slate-800 pb-4">
            <h2 className="font-heading font-extrabold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Where & when should it arrive?
            </h2>
            <p className="text-xs text-neutral-secondary mt-0.5">
              Select your delivery window preset and preferred campus handover point.
            </p>
          </div>

          {/* Timing Options */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-secondary uppercase tracking-wider">
              When do you need this delivered?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DELIVERY_TIMING_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setTimePreset(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    timePreset === opt.id
                      ? 'border-brand-indigo bg-brand-indigo-light/40 dark:bg-brand-indigo/15 ring-2 ring-brand-indigo shadow-sm'
                      : 'border-neutral-border dark:border-slate-700 hover:border-neutral-disabled'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-neutral-ink dark:text-neutral-dark-text">
                      {opt.label}
                    </span>
                    <Clock className={`w-4 h-4 ${timePreset === opt.id ? 'text-brand-indigo' : 'text-neutral-secondary'}`} />
                  </div>
                  <p className="text-[11px] text-neutral-secondary mt-1">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Handover Point */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-secondary uppercase tracking-wider">
                Campus Handover Meeting Point
              </label>
              <span className="text-[11px] text-brand-indigo font-semibold">
                Default: {currentUser.hostel || 'Hostel Area'}
              </span>
            </div>

            {/* Quick search */}
            <input
              type="text"
              placeholder="Search hostel blocks, libraries, canteens..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full h-9 px-3 rounded-input bg-neutral-surface-alt/60 dark:bg-slate-900 border border-neutral-border text-xs focus:outline-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredPickupLocations.map((point) => (
                <div
                  key={point.name}
                  onClick={() => setPickupPoint(point.name)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    pickupPoint === point.name
                      ? 'border-brand-indigo bg-brand-indigo-light/30 text-brand-indigo font-semibold dark:bg-brand-indigo/15'
                      : 'border-neutral-border dark:border-slate-800 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-indigo" />
                    <span>{point.name}</span>
                  </div>
                  {pickupPoint === point.name && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-border/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-10 px-4 rounded-btn border border-neutral-border text-xs font-semibold text-neutral-body hover:bg-neutral-surface-alt flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Items</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="h-10 px-6 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <span>Review Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Final Review & Confirmation Action */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-6 sm:p-8 shadow-e2 space-y-6">
          <div className="border-b border-neutral-border/60 dark:border-slate-800 pb-4">
            <h2 className="font-heading font-extrabold text-xl text-neutral-ink dark:text-neutral-dark-text">
              Review & Confirm Request
            </h2>
            <p className="text-xs text-neutral-secondary mt-0.5">
              Check your errand items and delivery spot before posting to the peer feed.
            </p>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-card bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Order Details Summary Card */}
          <div className="p-4 rounded-xl border border-neutral-border dark:border-slate-700 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-border/60 dark:border-slate-800 pb-2">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-neutral-secondary">
                Errand Summary ({items.length} items)
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-brand-indigo hover:underline"
              >
                Edit Items
              </button>
            </div>

            <div className="space-y-2">
              {items
                .filter((it) => it.name.trim().length > 0)
                .map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-body dark:text-slate-300">
                      {it.quantity}x {it.name}{' '}
                      {it.notes ? <span className="text-neutral-secondary">({it.notes})</span> : null}
                    </span>
                    <span className="font-mono font-semibold text-neutral-ink dark:text-white">
                      ₹{it.expectedPrice * it.quantity}
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex items-center justify-between text-neutral-secondary">
                <span>Handover Location:</span>
                <span className="font-semibold text-neutral-ink dark:text-white">{pickupPoint}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-secondary">
                <span>Delivery Window:</span>
                <span className="font-semibold text-neutral-ink dark:text-white">{timePreset}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-secondary">
                <span>Peer Delivery Fee:</span>
                <span className="font-semibold text-neutral-ink dark:text-white">₹25</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800 flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-neutral-ink dark:text-white">
                Total Estimated Cost:
              </span>
              <span className="font-mono font-extrabold text-lg text-brand-indigo dark:text-brand-indigo-darkmode">
                ₹{calculatedItemsTotal + 25}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="h-11 px-4 rounded-btn border border-neutral-border text-xs font-semibold text-neutral-body hover:bg-neutral-surface-alt flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="h-12 px-8 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-heading font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Post Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
