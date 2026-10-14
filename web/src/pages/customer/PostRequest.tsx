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
  Zap,
  ShoppingBag,
  Store,
  Sparkles,
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

const POPULAR_CAMPUS_PRESETS = [
  { name: 'A4 Spiral Notebook', price: 60, category: 'Stationery' as const },
  { name: 'Blue Gel Pens (Pack of 3)', price: 45, category: 'Stationery' as const },
  { name: 'Veg Puff + Cold Coffee', price: 55, category: 'Food' as const },
  { name: 'Biscuits & Cookies', price: 30, category: 'Snacks' as const },
  { name: 'Paracetamol & Bandages', price: 35, category: 'Personal care' as const },
  { name: 'Engineering Calculator FX-82MS', price: 620, category: 'Academic supplies' as const },
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

  // STEP 2 STATE: Pickup (Profile-based default) & Timing Presets (ASAP / Tonight / Tomorrow evening)
  const [pickupPoint, setPickupPoint] = useState<string>(
    currentUser.pickupPoint || campusPickupPoints[0].name
  );
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [timePreset, setTimePreset] = useState<'ASAP' | 'Tonight' | 'Tomorrow evening'>('ASAP');
  const [preferredStore, setPreferredStore] = useState<string>('Canopy Canteen & Refreshments');

  // Filtered 13 campus locations
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
          return `"${nv}" is strictly prohibited. Non-vegetarian food items are NOT allowed anywhere on SASTRA campus premises.`;
        }
      }
    }

    const bannedSubstances = [
      'alcohol', 'beer', 'vodka', 'whiskey', 'wine', 'cigarette', 'cigarettes', 'vape',
      'tobacco', 'weed', 'knife', 'knives', 'drug', 'drugs', 'prescription'
    ];
    for (const b of bannedSubstances) {
      if (lower.includes(b)) {
        return `"${b}" is prohibited by university regulations. Orders for restricted substances cannot be posted.`;
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

  const getPresetLabel = (preset: 'ASAP' | 'Tonight' | 'Tomorrow evening'): string => {
    switch (preset) {
      case 'ASAP':
        return 'ASAP (Within 45 mins, Rush)';
      case 'Tonight':
        return 'Tonight (Before 9:00 PM)';
      case 'Tomorrow evening':
        return 'Tomorrow evening (Before 8:00 PM)';
    }
  };

  // Submit Order - One Confirmation Action on Final Review
  const handleSubmitOrder = () => {
    if (prohibitedError || isValueExceeded || isFirstItemEmpty) return;

    const validItems = items.filter((it) => it.name.trim().length > 0);
    const primaryCategory = validItems[0]?.category || 'Food';
    const neededByText = getPresetLabel(timePreset);

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
      neededBy: neededByText,
      isUrgent: timePreset === 'ASAP',
      isWaitingLong: false,
      suggestedStore: preferredStore,
      helperFee: 0, // Fee is settled directly via UPI after price approval per v2 contract
      itemCost: calculatedItemsTotal,
      totalCost: calculatedItemsTotal,
      status: 'open',
    });

    onPostSuccess(newOrder.id);
    onNavigate(`/app/orders/${newOrder.id}`);
  };

  // Graceful kill switch banner if admin paused requests
  if (!isPostingAllowed) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/20 text-rose-500 border border-rose-800/40 flex items-center justify-center text-2xl">
          ⏸️
        </div>
        <h2 className="font-heading font-bold text-2xl text-neutral-ink dark:text-neutral-dark-text">
          Errand Posting Temporarily Paused
        </h2>
        <p className="text-sm text-neutral-secondary max-w-md mx-auto">
          The campus administration has temporarily locked new errand submissions. Please check back shortly or review ongoing orders in your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('/app/home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-ink dark:text-neutral-dark-text">
          Post an Errand Request
        </h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Request items from campus canteens and stores for peer delivery.
        </p>
      </div>

      {/* Progressive Step Progress Indicator */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              currentStep === 1
                ? 'bg-brand-indigo text-white shadow-sm'
                : 'text-neutral-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-mono">
              1
            </span>
            <span className="truncate">Items</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFirstItemEmpty && !prohibitedError) setCurrentStep(2);
            }}
            disabled={isFirstItemEmpty || !!prohibitedError}
            className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              currentStep === 2
                ? 'bg-brand-indigo text-white shadow-sm'
                : 'text-neutral-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-mono">
              2
            </span>
            <span className="truncate">Pickup & Timing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isFirstItemEmpty && !prohibitedError) setCurrentStep(3);
            }}
            disabled={isFirstItemEmpty || !!prohibitedError}
            className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              currentStep === 3
                ? 'bg-brand-indigo text-white shadow-sm'
                : 'text-neutral-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-mono">
              3
            </span>
            <span className="truncate">Review</span>
          </button>
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-2xl border border-neutral-border dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">

        {/* ======================================================== */}
        {/* STEP 1: REPEATING ITEM CARDS & STRICT VEG VALIDATION    */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-indigo" />
                <span>What items do you need?</span>
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Add each errand item, estimated price, and optional flavor/brand notes.
              </p>
            </div>

            {/* MANDATORY VEGETARIAN POLICY BANNER */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs flex items-start gap-2.5">
              <span className="text-base shrink-0">🌱</span>
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  Strict Campus Mandate: 100% Vegetarian Only
                </span>
                <p className="text-emerald-800 dark:text-emerald-300/90 text-[11px] mt-0.5">
                  SASTRA University regulations strictly prohibit all non-vegetarian items (meat, chicken, fish, egg, seafood). Non-veg requests will be rejected.
                </p>
              </div>
            </div>

            {/* Prohibited Alert when user types non-veg or banned word */}
            {prohibitedError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold block">Policy Violation Detected</span>
                  <p>{prohibitedError}</p>
                </div>
              </div>
            )}

            {/* Popular Quick-Add Presets */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-secondary font-bold block mb-2">
                Popular Quick-Add Items:
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CAMPUS_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPresetItem(p)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-body dark:text-slate-200 hover:border-brand-indigo hover:text-brand-indigo transition-colors flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>{p.name}</span>
                    <span className="font-mono text-[10px] text-neutral-secondary">₹{p.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Repeating Item Cards */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-neutral-surface-alt/60 dark:bg-slate-800/40 border border-neutral-border dark:border-slate-700 space-y-3"
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

                  {/* Item Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleItemNameChange(idx, e.target.value)}
                      placeholder="e.g. A4 Ruled Notebook, Cold Coffee, Veg Puff"
                      className="w-full h-11 px-3.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs font-medium text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                    />
                  </div>

                  {/* Quantity & Estimated Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity with +/- Stepper */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center border border-neutral-border dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 h-11">
                        <button
                          type="button"
                          onClick={() => handleItemQuantityChange(idx, -1)}
                          className="px-3 h-full hover:bg-neutral-surface-alt dark:hover:bg-slate-700 text-neutral-ink dark:text-white font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-mono font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleItemQuantityChange(idx, 1)}
                          className="px-3 h-full hover:bg-neutral-surface-alt dark:hover:bg-slate-700 text-neutral-ink dark:text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Estimated Unit Price */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                        Estimated Price (₹) *
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

                    {/* Category Selector */}
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

                  {/* Notes / Variant */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-secondary mb-1">
                      Brand / Flavor or Sizing Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                      placeholder="e.g. Chilled bottle, Classmate brand if available"
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-ink dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              {/* Add Item Button */}
              {items.length < maxItemsAllowed && (
                <button
                  type="button"
                  onClick={addItemRow}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-brand-indigo/30 hover:border-brand-indigo text-brand-indigo dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Item ({items.length}/{maxItemsAllowed})</span>
                </button>
              )}
            </div>

            {/* Estimated Subtotal */}
            <div className="p-3.5 rounded-xl bg-neutral-surface-alt dark:bg-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-secondary">
                Estimated Items Total:
              </span>
              <span className="font-mono font-bold text-sm text-neutral-ink dark:text-white">
                ₹{calculatedItemsTotal}
              </span>
            </div>

            {/* Stepper Next Button */}
            <div className="pt-4 flex justify-end border-t border-neutral-border dark:border-slate-800">
              <button
                type="button"
                disabled={isFirstItemEmpty || !!prohibitedError || isValueExceeded}
                onClick={() => setCurrentStep(2)}
                className={`h-11 px-6 rounded-btn text-xs font-bold text-white flex items-center gap-2 transition-all ${
                  isFirstItemEmpty || !!prohibitedError || isValueExceeded
                    ? 'bg-neutral-300 dark:bg-slate-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-brand-indigo hover:bg-brand-indigo-dark shadow-sm active:scale-95'
                }`}
              >
                <span>Continue to Pickup & Timing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: PROFILE PICKUP DEFAULTS & TIMING PRESETS         */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-indigo" />
                <span>Pickup Location & Delivery Timing</span>
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Deliveries take place at official public campus locations. Defaulted to your profile pickup spot.
              </p>
            </div>

            {/* Timing Presets: ASAP / Tonight / Tomorrow evening */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text uppercase tracking-wider block">
                Needed-By Timeframe (Select Preset) *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTimePreset('ASAP')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    timePreset === 'ASAP'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30'
                      : 'border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800/60 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-600" />
                      ASAP
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                      Rush
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-secondary dark:text-slate-400">
                    Within 45 mins. Prioritized in feed for immediate shopping.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTimePreset('Tonight')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    timePreset === 'Tonight'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-brand-indigo text-brand-indigo dark:text-indigo-200 ring-2 ring-brand-indigo/30'
                      : 'border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800/60 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-indigo" />
                      Tonight
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      Pre-Curfew
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-secondary dark:text-slate-400">
                    Delivered tonight before 9:00 PM hostel check-in.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTimePreset('Tomorrow evening')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    timePreset === 'Tomorrow evening'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-brand-teal text-brand-teal dark:text-teal-200 ring-2 ring-brand-teal/30'
                      : 'border-neutral-border dark:border-slate-700 bg-white dark:bg-slate-800/60 text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-teal" />
                      Tomorrow evening
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                      Next Day
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-secondary dark:text-slate-400">
                    Tomorrow before 8:00 PM. Perfect for planned study supplies.
                  </p>
                </button>
              </div>
            </div>

            {/* Profile-Based Pickup Point Selection */}
            <div className="space-y-3 pt-4 border-t border-neutral-border dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text uppercase tracking-wider block">
                    Campus Pickup Spot (13 Official Spots) *
                  </label>
                  <span className="text-[11px] text-neutral-secondary">
                    Defaulted to your profile setting. Click below to switch if needed.
                  </span>
                </div>
                <span className="text-[11px] font-mono text-brand-indigo font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60">
                  {pickupPoint}
                </span>
              </div>

              {/* Search Filter for Pickup Locations */}
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Search campus spot (e.g. Canopy, Library, Ananda Vihar)..."
                className="w-full h-10 px-3.5 rounded-lg bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />

              {/* 13 Official Locations Selection Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1">
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
                Preferred Store / Canteen (Optional)
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

            {/* Stepper Navigation */}
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
                className="h-11 px-6 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: FINAL REVIEW & ONE CONFIRMATION ACTION           */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Review Your Errand Request</span>
              </h2>
              <p className="text-xs text-neutral-secondary mt-1">
                Confirm your request details below. Once posted, it will be visible to nearby campus helpers.
              </p>
            </div>

            {/* Errand Summary Card */}
            <div className="p-5 rounded-2xl bg-neutral-surface-alt/70 dark:bg-slate-800/70 border border-neutral-border dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-border dark:border-slate-700">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-secondary">
                  Order Summary
                </span>
                <span className="text-xs font-semibold text-brand-indigo font-mono">
                  {items.filter((it) => it.name.trim()).length} Item(s)
                </span>
              </div>

              {/* Items Breakdown */}
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
                          Category: {it.category}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-neutral-ink dark:text-white text-sm shrink-0">
                        ₹{it.expectedPrice * it.quantity}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Logistics Details */}
              <div className="pt-3 border-t border-neutral-border dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-secondary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                    Pickup Meeting Spot:
                  </span>
                  <span className="font-bold text-neutral-ink dark:text-white text-right">
                    {pickupPoint}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Target Timeframe:
                  </span>
                  <span className="font-bold text-neutral-ink dark:text-white text-right">
                    {getPresetLabel(timePreset)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-secondary flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-teal-600" />
                    Preferred Store:
                  </span>
                  <span className="font-semibold text-neutral-ink dark:text-white text-right">
                    {preferredStore}
                  </span>
                </div>
              </div>

              {/* Total Estimated Cost Bar - No invented fee data */}
              <div className="pt-3 border-t border-neutral-border dark:border-slate-700 flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs text-neutral-secondary block font-sans">
                    Estimated Items Total:
                  </span>
                  <span className="text-[11px] text-neutral-placeholder font-sans">
                    (Paid direct to cashier via UPI QR)
                  </span>
                </div>
                <span className="font-heading font-extrabold text-2xl text-brand-indigo">
                  ₹{calculatedItemsTotal}
                </span>
              </div>
            </div>

            {/* Transparent Protocol Notice (No invented fees) */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-brand-indigo">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Platform Fee • Direct Student Handover</span>
              </div>
              <p className="text-[11px] text-neutral-secondary dark:text-slate-400 leading-relaxed">
                Helper fee (₹20–₹50) is set and paid directly to your helper via UPI once actual item prices and shelf photo evidence are approved in chat. The platform takes zero cut.
              </p>
            </div>

            {/* Stepper Navigation with ONE Final Confirmation Action */}
            <div className="pt-4 flex items-center justify-between border-t border-neutral-border dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="h-11 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Timing</span>
              </button>

              {/* Single Confirmation Action */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                className="h-12 px-7 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2"
              >
                <span>Confirm & Post Errand →</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
