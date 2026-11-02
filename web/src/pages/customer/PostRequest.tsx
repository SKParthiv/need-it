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
  ShoppingBag,
  Store,
} from 'lucide-react';
import { campusPickupPoints } from '../../data/mockData';
import { useWebApp } from '../../context/WebAppContext';
import { usePlatformConfig } from '../../context/DevAdminContext';

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

export const PostRequest: React.FC<PostRequestProps> = ({
  onNavigate,
  onPostSuccess,
}) => {
  const { addOrder, currentUser } = useWebApp();
  const { getConfig } = usePlatformConfig();

  // Platform configs
  const isPostingAllowed = getConfig<boolean>('flag.requests_posting') ?? true;
  const isStrictVegEnforced = getConfig<boolean>('flag.strict_veg_filter') ?? true;
  const maxItemsAllowed = getConfig<number>('orders.max_items_per_request') ?? 10;
  const maxOrderValueAllowed = getConfig<number>('orders.max_order_value_inr') ?? 1000;

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
    const q = searchLocation.toLowerCase();
    return campusPickupPoints.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchLocation]);

  // Strict Vegetarian & Banned Items Check
  const checkProhibitedTerms = (text: string): string | null => {
    const lower = text.toLowerCase();

    if (isStrictVegEnforced) {
      const nonVegKeywords = [
        'chicken', 'meat', 'mutton', 'fish', 'egg', 'eggs', 'non-veg', 'nonveg', 'non veg',
        'beef', 'pork', 'seafood', 'prawn', 'prawns', 'crab', 'shawarma', 'biryani (non-veg)',
        'omelette', 'omlet', 'bacon', 'ham'
      ];
      for (const nv of nonVegKeywords) {
        if (lower.includes(nv)) {
          return `"${nv}" is strictly prohibited. Non-vegetarian food items are NOT allowed on campus premises.`;
        }
      }
    }

    const bannedSubstances = [
      'alcohol', 'beer', 'vodka', 'whiskey', 'wine', 'cigarette', 'cigarettes', 'vape',
      'tobacco', 'weed', 'knife', 'knives', 'drug', 'drugs', 'prescription'
    ];
    for (const b of bannedSubstances) {
      if (lower.includes(b)) {
        return `"${b}" is prohibited by campus regulations.`;
      }
    }

    return null;
  };

  const handleItemNameChange = (index: number, newName: string) => {
    const updated = [...items];
    updated[index].name = newName;
    setItems(updated);

    const error = checkProhibitedTerms(newName);
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
  const handleSubmitOrder = () => {
    if (prohibitedError || isValueExceeded || isFirstItemEmpty) return;

    const validItems = items.filter((it) => it.name.trim().length > 0);
    const primaryCategory = validItems[0]?.category || 'Food';

    const newOrder = addOrder({
      customerName: currentUser.name,
      customerAlias: currentUser.alias || 'Student Requester',
      customerHostel: currentUser.hostel || 'Ananda Vihar (BH)',
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
  };

  if (!isPostingAllowed) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/20 text-rose-500 border border-rose-800/40 flex items-center justify-center text-2xl">
          ⏸️
        </div>
        <h2 className="font-heading font-bold text-2xl text-neutral-ink dark:text-neutral-dark-text">
          Orders Temporarily Paused
        </h2>
        <p className="text-sm text-neutral-secondary max-w-md mx-auto">
          New requests are temporarily locked. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('/app/home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Post a Request
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Request items from campus canteens and shops. A peer will pick them up for you.
        </p>
      </div>

      {/* Step Progress Indicator */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              currentStep === 1
                ? 'bg-brand-indigo text-white shadow-sm'
                : 'text-neutral-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0">
              1
            </span>
            <span>Items</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFirstItemEmpty && !prohibitedError) setCurrentStep(2);
            }}
            disabled={isFirstItemEmpty || !!prohibitedError}
            className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              currentStep === 2
                ? 'bg-brand-indigo text-white shadow-sm'
                : 'text-neutral-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0">
              2
            </span>
            <span>Timing & Pickup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFirstItemEmpty && !prohibitedError) setCurrentStep(3);
            }}
            disabled={isFirstItemEmpty || !!prohibitedError}
            className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              currentStep === 3
                ? 'bg-brand-indigo text-white shadow-sm'
                : 'text-neutral-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0">
              3
            </span>
            <span>Review & Confirm</span>
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-2xl border border-neutral-border dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">

        {/* STEP 1: ITEMS */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-indigo" />
                <span>What items do you need?</span>
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Enter item name, quantity, and approximate price.
              </p>
            </div>

            {/* Concise Vegetarian Notice */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <span className="text-sm shrink-0">🌱</span>
              <span><strong>100% Vegetarian Campus:</strong> Non-vegetarian food and restricted goods are not permitted.</span>
            </div>

            {/* Policy Violation Alert */}
            {prohibitedError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold block">Restricted Item</span>
                  <p>{prohibitedError}</p>
                </div>
              </div>
            )}

            {/* Quick-Add Popular Items */}
            <div>
              <span className="text-xs font-semibold text-neutral-secondary block mb-2">
                Quick-Add Items:
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CAMPUS_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPresetItem(p)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-body dark:text-slate-200 hover:border-brand-indigo hover:text-brand-indigo transition-colors flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>{p.name}</span>
                    <span className="font-mono text-[10px] text-neutral-secondary">₹{p.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Item Cards */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-xl bg-neutral-surface-alt/60 dark:bg-slate-800/40 border border-neutral-border dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-indigo font-mono">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
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
                      onChange={(e) => handleItemNameChange(idx, e.target.value)}
                      placeholder="e.g. A4 Notebook, Cold Coffee, Veg Puff"
                      className="w-full h-11 px-3.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs font-medium text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center border border-neutral-border dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 h-11">
                        <button
                          type="button"
                          onClick={() => handleItemQuantityChange(idx, -1)}
                          className="px-3.5 h-full hover:bg-neutral-surface-alt dark:hover:bg-slate-700 text-neutral-ink dark:text-white font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-mono font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleItemQuantityChange(idx, 1)}
                          className="px-3.5 h-full hover:bg-neutral-surface-alt dark:hover:bg-slate-700 text-neutral-ink dark:text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Estimated Unit Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-xs text-neutral-secondary font-mono">₹</span>
                        <input
                          type="number"
                          min={5}
                          max={maxOrderValueAllowed}
                          value={item.expectedPrice || ''}
                          onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                          className="w-full h-11 pl-7 pr-3 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs font-mono font-bold text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemCategoryChange(idx, e.target.value as any)}
                        className="w-full h-11 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs font-medium text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                      >
                        <option value="Food">Food / Canteen</option>
                        <option value="Snacks">Snacks & Drinks</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Personal care">Personal Care</option>
                        <option value="Academic supplies">Academic Supplies</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-secondary mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                      placeholder="e.g. Cold bottle, brand preference"
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-ink dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              {items.length < maxItemsAllowed && (
                <button
                  type="button"
                  onClick={addItemRow}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-brand-indigo/30 hover:border-brand-indigo text-brand-indigo dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Item ({items.length}/{maxItemsAllowed})</span>
                </button>
              )}
            </div>

            {/* Total Estimated Subtotal */}
            <div className="p-4 rounded-xl bg-neutral-surface-alt dark:bg-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-secondary">
                Estimated Items Total:
              </span>
              <span className="font-mono font-bold text-base text-neutral-ink dark:text-white">
                ₹{calculatedItemsTotal}
              </span>
            </div>

            {/* Continue Button */}
            <div className="pt-4 flex justify-end border-t border-neutral-border dark:border-slate-800">
              <button
                type="button"
                disabled={isFirstItemEmpty || !!prohibitedError || isValueExceeded}
                onClick={() => setCurrentStep(2)}
                className={`h-11 px-7 rounded-btn text-xs font-bold text-white flex items-center gap-2 transition-all ${
                  isFirstItemEmpty || !!prohibitedError || isValueExceeded
                    ? 'bg-neutral-300 dark:bg-slate-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-brand-indigo hover:bg-brand-indigo-dark shadow-sm active:scale-95'
                }`}
              >
                <span>Continue to Timing & Pickup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TIMING & PICKUP */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-indigo" />
                <span>Delivery Timing & Pickup Location</span>
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Choose when you need the items and where you'll meet your helper.
              </p>
            </div>

            {/* Delivery Timing Options: Requirement 7 */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text uppercase tracking-wider block">
                Delivery Timing (Select One) *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {DELIVERY_TIMING_OPTIONS.map((opt) => {
                  const isSelected = timePreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimePreset(opt.id)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-brand-indigo text-brand-indigo dark:text-indigo-200 ring-2 ring-brand-indigo/30 shadow-sm'
                          : 'border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800/60 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${isSelected ? 'text-brand-indigo' : 'text-neutral-secondary'}`} />
                          {opt.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-brand-indigo shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-secondary dark:text-slate-400">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pickup Location Selection */}
            <div className="space-y-3 pt-4 border-t border-neutral-border dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text uppercase tracking-wider block">
                    Campus Meeting Point *
                  </label>
                  <span className="text-[11px] text-neutral-secondary">
                    Official public pickup spots across campus.
                  </span>
                </div>
                <span className="text-xs font-mono text-brand-indigo font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-brand-indigo/20">
                  {pickupPoint}
                </span>
              </div>

              {/* Location Search Input */}
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Search meeting point (e.g. Canopy, Library, Hostel)..."
                className="w-full h-11 px-3.5 rounded-lg bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />

              {/* Location Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {filteredPickupLocations.map((p) => {
                  const isSelected = pickupPoint === p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPickupPoint(p.name)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-brand-indigo text-brand-indigo dark:text-indigo-300 ring-2 ring-brand-indigo/30'
                          : 'border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800/60 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                      }`}
                    >
                      <MapPin
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isSelected ? 'text-brand-indigo' : 'text-neutral-secondary'
                        }`}
                      />
                      <span className="leading-tight">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Store Selection */}
            <div className="pt-4 border-t border-neutral-border dark:border-slate-800">
              <label className="block text-xs font-bold text-neutral-ink dark:text-neutral-dark-text uppercase tracking-wider mb-2">
                Preferred Store (Optional)
              </label>
              <select
                value={preferredStore}
                onChange={(e) => setPreferredStore(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              >
                <option value="Canopy Canteen & Refreshments">Canopy Canteen & Refreshments</option>
                <option value="Central Library Stationery & Reprographics">Central Library Stationery & Reprographics</option>
                <option value="KC Food Court & Juices">KC Food Court & Juices</option>
                <option value="Campus Health Centre & Essentials">Campus Health Centre & Essentials</option>
                <option value="Any Nearby Campus Stall">Any Nearby Campus Stall</option>
              </select>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-neutral-border dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="h-11 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Items</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="h-11 px-7 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & CONFIRM */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Review Your Request</span>
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Confirm your order details. Your request will be shared with student helpers nearby.
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="p-5 rounded-2xl bg-neutral-surface-alt/70 dark:bg-slate-800/70 border border-neutral-border dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-slate-700">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-secondary">
                  Order Items
                </span>
                <span className="text-xs font-semibold text-brand-indigo font-mono">
                  {items.filter((it) => it.name.trim()).length} item(s)
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                {items
                  .filter((it) => it.name.trim())
                  .map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-neutral-border/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-neutral-ink dark:text-white block">
                          {it.quantity}x {it.name}
                        </span>
                        {it.notes && (
                          <span className="text-[11px] text-neutral-secondary block italic">
                            Note: {it.notes}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-placeholder font-mono">
                          {it.category}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-neutral-ink dark:text-white text-sm shrink-0">
                        ₹{it.expectedPrice * it.quantity}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Delivery Info */}
              <div className="pt-3 border-t border-neutral-border dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-indigo" />
                    Delivery Time:
                  </span>
                  <span className="font-bold text-neutral-ink dark:text-white">
                    {timePreset}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-secondary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                    Pickup Spot:
                  </span>
                  <span className="font-bold text-neutral-ink dark:text-white">
                    {pickupPoint}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-secondary flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-neutral-placeholder" />
                    Store:
                  </span>
                  <span className="font-semibold text-neutral-ink dark:text-white">
                    {preferredStore}
                  </span>
                </div>
              </div>

              {/* Estimated Total Bar */}
              <div className="pt-3 border-t border-neutral-border dark:border-slate-700 flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs text-neutral-secondary block font-sans">
                    Estimated Items Total:
                  </span>
                  <span className="text-[11px] text-neutral-placeholder font-sans">
                    (UPI payment to helper upon store price confirmation)
                  </span>
                </div>
                <span className="font-heading font-extrabold text-2xl text-brand-indigo">
                  ₹{calculatedItemsTotal}
                </span>
              </div>
            </div>

            {/* Platform Guarantee */}
            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30 text-xs flex items-center gap-2 text-brand-indigo">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>₹0 Platform Fee. You pay your helper directly via UPI once store prices are confirmed in chat.</span>
            </div>

            {/* Final Action Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-neutral-border dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="h-11 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitOrder}
                className="h-12 px-8 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2"
              >
                <span>Confirm & Post Request →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
