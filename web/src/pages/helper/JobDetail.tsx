import React, { useState } from 'react';
import {
  ArrowLeft,
  CircleDot,
  Handshake,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  Camera,
  MessageSquare,
  QrCode,
  KeyRound,
  AlertTriangle,
  Send,
  Lock,
  Phone,
  Store,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  ThumbsUp
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { useWebApp } from '../../context/WebAppContext';
import { OrderStatus } from '../../types';

interface JobDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({
  orderId,
  onNavigate
}) => {
  const { getOrderById, updateOrderStatus, getChatByOrderId, sendMessage } = useWebApp();
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-surface-alt dark:bg-slate-800 flex items-center justify-center text-neutral-secondary">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
          Job Not Found
        </h2>
        <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
          This delivery job may have been completed, released, or expired.
        </p>
        <button
          onClick={() => onNavigate('/app/helper/jobs')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-teal text-white text-xs font-semibold shadow-sm hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Jobs</span>
        </button>
      </div>
    );
  }

  const chatData = getChatByOrderId(order.id) || {
    id: `chat-${order.id}`,
    orderId: order.id,
    counterpartName: order.customerAlias || 'Student Customer',
    counterpartRole: 'customer',
    lastMessage: 'Job accepted.',
    lastMessageTime: 'Just now',
    unreadCount: 0,
    isReadOnly: false,
    messages: [
      {
        id: `msg-${Date.now()}`,
        senderRole: 'system',
        senderName: 'System',
        text: `You accepted Job #${order.id}. Phone numbers masked by default for student privacy.`,
        timestamp: 'Just now',
        isSystemNotice: true,
      },
    ],
  };

  const [activeArea, setActiveArea] = useState<
    'chat' | 'check_items' | 'item_missing' | 'price_confirm' | 'buy_qr' | 'handover' | 'wrap_up'
  >('check_items');

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({ 'item-1': true });
  const [missingReason, setMissingReason] = useState('Out of stock at store');
  const [replacementName, setReplacementName] = useState('Alternative brand spiral notebook');
  const [replacementPrice, setReplacementPrice] = useState('65');
  const [replacementProposed, setReplacementProposed] = useState(false);

  const [enteredCode, setEnteredCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const statusSteps: { status: OrderStatus; label: string }[] = [
    { status: 'accepted', label: 'Accepted' },
    { status: 'purchased', label: 'Purchased' },
    { status: 'handed_over', label: 'Handed over' },
    { status: 'completed', label: 'Completed' }
  ];

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Breadcrumb & Release Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/app/helper/jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Delivery Jobs</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReleaseModal(true)}
            className="text-xs font-semibold text-neutral-secondary hover:text-semantic-danger transition-colors"
          >
            Release Request (No Penalty)
          </button>
          <button
            onClick={() => onNavigate('/app/report')}
            className="text-xs text-semantic-danger font-semibold flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* 1. Status Tracker on Top (Section 7.4) */}
      <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-border dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Job #{order.id}
              </h1>
              <StatusChip status={order.status} size="sm" />
              <span className="text-xs font-mono text-neutral-secondary font-medium">
                Customer: {order.customerAlias}
              </span>
            </div>
            <p className="text-xs text-neutral-secondary mt-0.5">
              Drop-off spot: <strong>{order.pickupPoint}</strong> • Needed by: <strong>{order.neededBy}</strong>
            </p>
          </div>

          <div className="p-2.5 rounded-card bg-brand-teal-light/50 dark:bg-brand-teal/20 border border-brand-teal/30 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-brand-teal block">
              Helper Fee Payout
            </span>
            <span className="font-heading font-extrabold text-xl font-mono text-brand-teal-dark dark:text-emerald-300">
              ₹{order.helperFee}
            </span>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          {statusSteps.map((st, i) => (
            <div key={st.status} className="flex flex-col items-center space-y-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  st.status === order.status
                    ? 'bg-brand-teal text-white ring-4 ring-brand-teal/20'
                    : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-secondary border border-neutral-border dark:border-slate-700'
                }`}
              >
                {i + 1}
              </div>
              <span className="text-[11px] font-semibold text-neutral-secondary capitalize">
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Helper Workflow Tabs (Section 7.4) */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border overflow-hidden shadow-e1">
        <div className="flex border-b border-neutral-border dark:border-slate-800 overflow-x-auto scrollbar-none bg-neutral-surface-alt/40 dark:bg-slate-900/40 px-2 pt-2 text-xs">
          {[
            { id: 'check_items', label: '1. Check Items', icon: Camera },
            { id: 'item_missing', label: '2. Item Missing / Swap', icon: AlertTriangle },
            { id: 'price_confirm', label: '3. Price Confirm', icon: ShoppingBag },
            { id: 'buy_qr', label: '4. Send Shop QR', icon: QrCode },
            { id: 'handover', label: '5. Verify Code', icon: KeyRound },
            { id: 'wrap_up', label: '6. Payout & Wrap-up', icon: CheckCircle2 },
            { id: 'chat', label: 'Chat with Customer', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeArea === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveArea(tab.id as any)}
                className={`px-3.5 py-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'border-brand-teal text-brand-teal bg-white dark:bg-neutral-dark-card font-bold'
                    : 'border-transparent text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Area Contents */}
        <div className="p-5 sm:p-8">
          {/* AREA 1: CHECK ITEMS */}
          {activeArea === 'check_items' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Compare Shelf Items with Requester List
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Check off items as you locate them in the store. Take photos if clarification is required.
                </p>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <label
                    key={item.id}
                    className={`p-4 rounded-card border flex items-start gap-3 cursor-pointer transition-colors ${
                      checkedItems[item.id]
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 border-neutral-border dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={(e) =>
                        setCheckedItems({ ...checkedItems, [item.id]: e.target.checked })
                      }
                      className="w-4 h-4 mt-1 rounded text-brand-teal focus:ring-brand-teal"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <strong className="font-semibold text-sm text-neutral-ink dark:text-neutral-dark-text">
                          {item.name}
                        </strong>
                        <span className="font-mono font-bold text-xs text-neutral-secondary">
                          Qty: {item.quantity} • ~₹{item.expectedPrice}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-neutral-secondary mt-1">
                          Requester note: <em>"{item.notes}"</em>
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => alert('Simulating photo upload from store camera...')}
                  className="h-10 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-surface-alt"
                >
                  <Camera className="w-4 h-4" /> Take Shelf Photo
                </button>
                <button
                  onClick={() => setActiveArea('buy_qr')}
                  className="h-10 px-5 rounded-btn bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-dark ml-auto"
                >
                  All Items Found → Proceed to Pay
                </button>
              </div>
            </div>
          )}

          {/* AREA 2: ITEM MISSING / SWAP */}
          {activeArea === 'item_missing' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Mark "Couldn't Find It" & Propose Replacement
                </h3>
                <p className="text-xs text-neutral-secondary">
                  If an item is out of stock, propose a substitute with photo or release the request without penalty.
                </p>
              </div>

              {replacementProposed ? (
                <div className="p-4 rounded-card bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Replacement Sent to Customer Chat</span>
                  </div>
                  <p>
                    Proposed <strong>{replacementName}</strong> (₹{replacementPrice}). Customer has received Approve / Decline buttons in their view.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      Reason Item is Missing
                    </label>
                    <select
                      value={missingReason}
                      onChange={(e) => setMissingReason(e.target.value)}
                      className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
                    >
                      <option>Out of stock at store</option>
                      <option>Store does not stock this brand</option>
                      <option>Price exceeds campus budget limit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      Proposed Replacement Name
                    </label>
                    <input
                      type="text"
                      value={replacementName}
                      onChange={(e) => setReplacementName(e.target.value)}
                      className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text mb-1">
                      Replacement Actual Price (₹)
                    </label>
                    <input
                      type="number"
                      value={replacementPrice}
                      onChange={(e) => setReplacementPrice(e.target.value)}
                      className="w-full h-10 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
                    />
                  </div>

                  <button
                    onClick={() => setReplacementProposed(true)}
                    className="w-full h-11 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold"
                  >
                    Send Replacement Card to Customer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AREA 3: PRICE CONFIRMATION */}
          {activeArea === 'price_confirm' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Price Confirmation Before Purchase
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Item price and fee confirmed in chat before buying; customer approval needed if price differs.
                </p>
              </div>

              <div className="p-4 rounded-card bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-secondary">Expected Total:</span>
                  <span className="font-mono font-bold">₹170</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-secondary">Actual Store Total:</span>
                  <span className="font-mono font-bold text-brand-teal">₹180</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-border dark:border-slate-700">
                  <span className="text-brand-teal font-semibold">Helper Fee:</span>
                  <span className="font-mono font-bold text-brand-teal">₹30</span>
                </div>
              </div>

              <div className="p-3 rounded-card bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Customer already approved ₹180 in chat. You are cleared to buy!</span>
              </div>

              <button
                onClick={() => setActiveArea('buy_qr')}
                className="w-full h-11 rounded-btn bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-dark"
              >
                Proceed to Send Shop QR →
              </button>
            </div>
          )}

          {/* AREA 4: BUY & SEND QR */}
          {activeArea === 'buy_qr' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Send Shop's Payment QR
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Never front personal cash. Take a photo of the cashier's UPI QR standee and send it to the customer.
                </p>
              </div>

              <div className="p-6 rounded-card border-2 border-dashed border-neutral-border dark:border-slate-700 text-center space-y-3">
                <QrCode className="w-12 h-12 text-brand-teal mx-auto" />
                <div>
                  <span className="text-xs font-bold text-neutral-ink dark:text-neutral-dark-text block">
                    Cashier UPI QR Standee
                  </span>
                  <p className="text-[11px] text-neutral-secondary">
                    Bits & Bytes Stationery (UPI ID: merchant@okaxis)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Simulating photo capture of store QR code...')}
                  className="px-4 py-2 rounded-btn bg-brand-teal text-white text-xs font-semibold"
                >
                  Snap & Send QR to Chat
                </button>
              </div>

              <button
                onClick={() => setActiveArea('handover')}
                className="w-full h-11 rounded-btn border border-brand-teal text-brand-teal font-semibold text-xs hover:bg-brand-teal-light"
              >
                Customer Paid • Head Back to Campus Handover →
              </button>
            </div>
          )}

          {/* AREA 5: HANDOVER CODE */}
          {activeArea === 'handover' && (
            <div className="space-y-5 max-w-md mx-auto text-center">
              <div>
                <h3 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                  Campus Handover at {order.pickupPoint}
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Ask the customer for their 4-digit code and enter it below.
                </p>
              </div>

              {codeVerified ? (
                <div className="p-6 rounded-panel bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-fade-in relative overflow-hidden">
                  {/* Section 10.4: Check draws in 500ms + confetti-free soft ring pulse */}
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500 ring-pulse pointer-events-none" />
                    <svg
                      className="w-12 h-12 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" className="check-draw" />
                    </svg>
                  </div>
                  <h4 className="font-heading font-bold text-base text-emerald-900 dark:text-emerald-300">
                    Handover Code Verified!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">
                    Package successfully confirmed by {order.customerAlias}.
                  </p>
                  <button
                    onClick={() => setActiveArea('wrap_up')}
                    className="mt-2 h-10 px-5 rounded-btn bg-brand-teal text-white text-xs font-semibold active:scale-[0.97] transition-all"
                  >
                    Confirm Payout & Close Job →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-center text-neutral-secondary uppercase tracking-wider mb-2">
                      Enter 4-Digit Handover Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                      className="w-48 h-14 mx-auto text-center font-mono font-extrabold text-2xl rounded-input border-2 border-brand-teal text-neutral-ink dark:text-neutral-dark-text tracking-widest focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (enteredCode === order.handoverCode || enteredCode.length === 4) {
                        setCodeVerified(true);
                        updateOrderStatus(order.id, 'completed');
                      } else {
                        alert(`Please enter code "${order.handoverCode}" for this simulation.`);
                      }
                    }}
                    className="w-full h-11 rounded-btn bg-brand-teal hover:bg-brand-teal-dark active:scale-[0.98] transition-all duration-150 text-white text-xs font-semibold shadow-sm"
                  >
                    Verify Code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AREA 6: WRAP-UP & PAYOUT CONFIRMATION */}
          {activeArea === 'wrap_up' && (
            <div className="space-y-5 max-w-md mx-auto text-center">
              <div>
                <h3 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
                  Delivery Complete & Payout
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Both sides confirm payment; job moves to Completed and leaves dashboard.
                </p>
              </div>

              <div className="p-6 rounded-panel bg-neutral-surface-alt dark:bg-slate-800/80 border border-neutral-border dark:border-slate-700 space-y-3">
                <span className="text-xs text-neutral-secondary block font-semibold">
                  Helper Fee Credited
                </span>
                <div className="font-heading font-extrabold text-3xl font-mono text-brand-teal">
                  ₹{order.helperFee}
                </div>
                <span className="text-xs text-emerald-600 font-medium block">
                  ✓ Received via Student UPI
                </span>
              </div>

              {/* Short feedback prompt per spec 7.4 & 16 */}
              {!feedbackSent ? (
                <div className="space-y-3 text-left">
                  <label className="block text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text">
                    Short Feedback on Customer (Optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full p-2.5 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs"
                  />
                  <button
                    onClick={() => setFeedbackSent(true)}
                    className="w-full h-10 rounded-btn bg-brand-teal hover:bg-brand-teal-dark active:scale-[0.98] transition-all duration-150 text-white text-xs font-semibold"
                  >
                    Submit Feedback & Finish Job
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-600 font-semibold">
                    Feedback saved! This job is now archived.
                  </p>
                  <button
                    onClick={() => onNavigate('/app/helper/feed')}
                    className="h-10 px-6 rounded-btn bg-brand-teal text-white text-xs font-semibold"
                  >
                    Return to Request Feed
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AREA 7: CHAT */}
          {activeArea === 'chat' && (
            <div className="space-y-4">
              <div className="p-3 rounded-card bg-neutral-surface-alt dark:bg-slate-800 text-xs text-neutral-secondary flex items-center justify-between">
                <span>Interacting with {order.customerAlias} • Phone numbers hidden</span>
                <span className="text-brand-teal font-semibold">Order #{order.id}</span>
              </div>
              <div className="h-64 overflow-y-auto p-4 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
                {chatData.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.senderRole === 'helper' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] text-neutral-placeholder mb-0.5">
                      {m.senderName} • {m.timestamp}
                    </span>
                    <div
                      className={`p-3 rounded-2xl max-w-[80%] ${
                        m.senderRole === 'helper'
                          ? 'bg-brand-teal text-white rounded-tr-sm'
                          : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-ink dark:text-neutral-dark-text border rounded-tl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Release Request (Section 7.4) */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-neutral-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-slate-800 p-6 shadow-e3 space-y-4">
            <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
              Release Request #{order.id}?
            </h3>
            <p className="text-xs text-neutral-secondary leading-relaxed">
              Before purchasing, you can release the order with <strong>zero penalty</strong>. It will immediately return to the campus feed for other peers.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="flex-1 h-10 rounded-btn border border-neutral-border text-xs font-semibold"
              >
                Keep Job
              </button>
              <button
                onClick={() => {
                  setShowReleaseModal(false);
                  alert('Request released back to campus feed.');
                  onNavigate('/app/helper/feed');
                }}
                className="flex-1 h-10 rounded-btn bg-semantic-danger text-white text-xs font-semibold"
              >
                Release Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
