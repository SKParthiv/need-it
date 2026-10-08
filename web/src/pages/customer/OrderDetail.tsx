import React, { useState } from 'react';
import {
  ArrowLeft,
  CircleDot,
  Handshake,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  AlertTriangle,
  QrCode,
  Star,
  Clock,
  MapPin,
  Camera,
  ShieldAlert,
  Send,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Sparkles,
  Phone
} from 'lucide-react';
import { StatusChip } from '../../components/common/StatusChip';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { useWebApp } from '../../context/WebAppContext';
import { OrderStatus } from '../../types';

interface OrderDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
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
          Order Not Found
        </h2>
        <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
          This order does not exist or may have expired. Track your active requests in your orders tab.
        </p>
        <button
          onClick={() => onNavigate('/app/orders')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-indigo text-white text-xs font-semibold shadow-sm hover:bg-brand-indigo-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>
      </div>
    );
  }

  const chatData = getChatByOrderId(order.id) || {
    id: `chat-${order.id}`,
    orderId: order.id,
    counterpartName: order.helperName || 'Awaiting Helper',
    counterpartRole: 'helper',
    lastMessage: 'Order broadcasted.',
    lastMessageTime: 'Just now',
    unreadCount: 0,
    isReadOnly: false,
    messages: [
      {
        id: `msg-${Date.now()}`,
        senderRole: 'system',
        senderName: 'System',
        text: `Request #${order.id} posted. Phone numbers masked by default for student privacy.`,
        timestamp: 'Just now',
        isSystemNotice: true,
      },
    ],
  };

  const [activeTab, setActiveTab] = useState<
    'details' | 'chat' | 'item_checks' | 'price_approval' | 'payment' | 'handover' | 'rating'
  >('details');

  // Interactive UI Simulation states
  const [chatMessages, setChatMessages] = useState(chatData.messages);
  const [newMsgText, setNewMsgText] = useState('');
  const [itemApprovalStatus, setItemApprovalStatus] = useState<Record<string, 'approved' | 'declined'>>({});
  const [priceApproved, setPriceApproved] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  // Status timeline steps (Section 6.4 & 8)
  const statusSteps: { status: OrderStatus; label: string; icon: any }[] = [
    { status: 'open', label: 'Open', icon: CircleDot },
    { status: 'accepted', label: 'Accepted', icon: Handshake },
    { status: 'purchased', label: 'Purchased', icon: ShoppingBag },
    { status: 'handed_over', label: 'Handed over', icon: PackageCheck },
    { status: 'completed', label: 'Completed', icon: CheckCircle2 }
  ];

  const getStepIndex = (st: OrderStatus) => {
    switch (st) {
      case 'open': return 0;
      case 'accepted': return 1;
      case 'purchased': return 2;
      case 'handed_over': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;
    const msg = {
      id: `msg-${Date.now()}`,
      senderRole: 'customer' as const,
      senderName: order.customerName,
      text: newMsgText,
      timestamp: 'Just now'
    };
    setChatMessages([...chatMessages, msg]);
    setNewMsgText('');
  };

  return (
    <div className="w-full max-w-content mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/app/orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/app/report')}
            className="text-xs text-semantic-danger font-semibold hover:underline flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Report a problem</span>
          </button>
        </div>
      </div>

      {/* 1. Status Tracker Always on Top (Section 6.4) */}
      <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-border dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl text-neutral-ink dark:text-neutral-dark-text">
                Order #{order.id}
              </h1>
              <StatusChip status={order.status} size="sm" />
              {order.isUrgent && <StatusChip status="urgent" size="sm" />}
            </div>
            <p className="text-xs text-neutral-secondary mt-0.5">
              Needed by: <strong>{order.neededBy}</strong> • Drop-off at: <strong>{order.pickupPoint}</strong>
            </p>
          </div>

          {/* Helper First Name (Shown after acceptance per spec) */}
          {order.helperName ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-teal-light/60 dark:bg-brand-teal/15 border border-brand-teal/20 text-xs">
              <span className="text-brand-teal font-medium">Assigned Helper:</span>
              <strong className="text-brand-teal-dark dark:text-emerald-300 font-bold">{order.helperName}</strong>
              <VerifiedBadge size="sm" showText={false} />
            </div>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Awaiting student acceptance
            </span>
          )}
        </div>

        {/* Timeline Progress Bar (Goal-Gradient Effect) */}
        <div className="relative pt-2 pb-1">
          <div className="grid grid-cols-5 gap-2 text-center">
            {statusSteps.map((stepItem, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = stepItem.icon;

              return (
                <div key={stepItem.status} className="flex flex-col items-center space-y-1.5 relative">
                  {/* Connector line between dots (10.4: line grows 400ms) */}
                  {idx > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 w-full h-1 -z-0 transition-all duration-400 ease-enter ${
                        idx <= currentStepIdx
                          ? 'bg-brand-indigo'
                          : 'bg-neutral-border dark:bg-slate-700'
                      }`}
                    />
                  )}

                  {/* Dot / Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                      isCurrent
                        ? 'bg-brand-indigo text-white ring-4 ring-brand-indigo/20 shadow-sm scale-110'
                        : isPast
                        ? 'bg-brand-indigo text-white'
                        : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-disabled border border-neutral-border dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] sm:text-xs font-semibold ${
                      isCurrent
                        ? 'text-brand-indigo dark:text-brand-indigo-darkmode font-bold'
                        : isPast
                        ? 'text-neutral-body dark:text-slate-300'
                        : 'text-neutral-disabled'
                    }`}
                  >
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Waiting-Long Alert Banner (if applicable) */}
      {order.isWaitingLong && order.status === 'open' && (
        <div className="p-4 rounded-card bg-semantic-warning-tint border border-semantic-warning/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-semantic-warning font-semibold">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Open request waiting long. Consider extending the drop-off time or raising the fee to encourage helpers.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => alert('Time extended by 30 mins!')}
              className="px-3 py-1.5 rounded-btn bg-white dark:bg-slate-800 border border-neutral-border text-neutral-ink text-xs font-semibold"
            >
              Edit Time
            </button>
            <button
              onClick={() => alert('Helper fee increased by ₹15!')}
              className="px-3 py-1.5 rounded-btn bg-semantic-warning text-white text-xs font-semibold"
            >
              Raise Fee (+₹15)
            </button>
          </div>
        </div>
      )}

      {/* 2. Sub-Tabs inside one page (Section 6.4) */}
      <div className="bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-neutral-dark-border overflow-hidden shadow-e1">
        {/* Horizontal Tab Bar with overflow scroll */}
        <div className="flex border-b border-neutral-border dark:border-slate-800 overflow-x-auto scrollbar-none bg-neutral-surface-alt/40 dark:bg-slate-900/40 px-2 pt-2">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'chat', label: 'Chat', icon: MessageSquare, badge: chatData.unreadCount },
            { id: 'item_checks', label: 'Item Checks', icon: Camera },
            { id: 'price_approval', label: 'Price Approval', icon: ShoppingBag },
            { id: 'payment', label: 'Payment (UPI)', icon: QrCode },
            { id: 'handover', label: 'Handover Code', icon: PackageCheck },
            { id: 'rating', label: 'Review & Rating', icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-brand-indigo text-brand-indigo dark:text-brand-indigo-darkmode bg-white dark:bg-neutral-dark-card'
                    : 'border-transparent text-neutral-secondary hover:text-neutral-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="w-2 h-2 rounded-full bg-brand-coral" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Tab Content Areas */}
        <div className="p-5 sm:p-8">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                    Order Details & Specifications
                  </h3>
                  <p className="text-xs text-neutral-secondary">
                    {order.status !== 'open'
                      ? 'Locked from edits because a helper has accepted.'
                      : 'Open request visible to verified helpers.'}
                  </p>
                </div>
                {order.status !== 'open' && (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-secondary bg-neutral-surface-alt dark:bg-slate-800 px-2.5 py-1 rounded-full border border-neutral-border dark:border-slate-700">
                    <Lock className="w-3.5 h-3.5" /> Edits Locked
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="border border-neutral-border dark:border-slate-800 rounded-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-surface-alt dark:bg-slate-800 border-b border-neutral-border dark:border-slate-700">
                    <tr>
                      <th className="p-3 font-semibold text-neutral-secondary">Item Name</th>
                      <th className="p-3 font-semibold text-neutral-secondary">Qty</th>
                      <th className="p-3 font-semibold text-neutral-secondary">Est. Price</th>
                      <th className="p-3 font-semibold text-neutral-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border dark:divide-slate-800">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-surface-alt/40 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <strong className="font-semibold text-neutral-ink dark:text-neutral-dark-text block">
                            {item.name}
                          </strong>
                          {item.notes && (
                            <span className="text-neutral-secondary text-[11px] block">{item.notes}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono">{item.quantity}</td>
                        <td className="p-3 font-mono font-bold">₹{item.expectedPrice}</td>
                        <td className="p-3">
                          <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-brand-indigo-light text-brand-indigo">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 space-y-1">
                  <span className="text-neutral-secondary block font-semibold">Campus Drop-off Location</span>
                  <p className="font-medium text-neutral-ink dark:text-neutral-dark-text flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                    {order.pickupPoint}
                  </p>
                </div>

                <div className="p-3.5 rounded-card bg-neutral-surface-alt dark:bg-slate-800/60 border border-neutral-border dark:border-slate-700 space-y-1">
                  <span className="text-neutral-secondary block font-semibold">Delivery Time Window</span>
                  <p className="font-medium text-neutral-ink dark:text-neutral-dark-text flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-indigo" />
                    {order.neededBy}
                  </p>
                </div>
              </div>

              {/* Order Actions: Cancel / Cancellation Request (Section 6.4 & 16) */}
              <div className="pt-4 border-t border-neutral-border dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                {order.status === 'open' ? (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="h-10 px-4 rounded-btn border border-semantic-danger text-semantic-danger text-xs font-semibold hover:bg-semantic-danger-tint transition-colors"
                  >
                    Cancel Order (₹0 Owed)
                  </button>
                ) : order.status === 'purchased' ? (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="h-10 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-neutral-ink text-xs font-semibold transition-colors"
                  >
                    Request Cancellation (Needs Helper Agreement)
                  </button>
                ) : null}

                <button
                  onClick={() => onNavigate('/app/report')}
                  className="text-xs text-neutral-secondary hover:text-neutral-ink font-medium underline"
                >
                  Need help? Contact campus moderation team
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Pinned Order Summary & Privacy Notice (Section 8) */}
              <div className="p-3 rounded-card bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-indigo" />
                  <span className="font-medium text-neutral-body dark:text-slate-300">
                    Phone numbers hidden for student safety. Interacting with <strong>{order.helperName || 'Helper'}</strong>.
                  </span>
                </div>
                {!phoneRevealed ? (
                  <button
                    onClick={() => setPhoneRevealed(true)}
                    className="text-brand-indigo dark:text-brand-indigo-darkmode text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> Reveal Phone Number (Optional)
                  </button>
                ) : (
                  <span className="text-xs font-mono text-emerald-600 font-bold">
                    +91 98451 XXXXX (Mutual consent)
                  </span>
                )}
              </div>

              {/* Chat Messages List */}
              <div className="h-80 overflow-y-auto p-4 rounded-card border border-neutral-border dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                {chatMessages.map((msg) => {
                  if (msg.isSystemNotice) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-[11px] text-neutral-secondary">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isMe = msg.senderRole === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col chat-msg-enter ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-neutral-placeholder mb-0.5 px-1">
                        {msg.senderName} • {msg.timestamp}
                      </span>
                      <div
                        className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-indigo text-white rounded-tr-sm'
                            : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-ink dark:text-neutral-dark-text border border-neutral-border dark:border-slate-700 rounded-tl-sm'
                        }`}
                      >
                        <p>{msg.text}</p>
                        {msg.qrCodeUrl && (
                          <div className="mt-2 p-2 bg-white rounded-lg shadow-sm">
                            <img
                              src={msg.qrCodeUrl}
                              alt="Shop payment QR"
                              className="w-40 h-40 object-cover rounded mx-auto thumbnail-blur-up"
                            />
                            <span className="text-[10px] text-neutral-secondary text-center block mt-1">
                              Scan with PhonePe / GPay / Paytm
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Section 10.4: Typing dots pulse indicator */}
                <div className="flex items-center gap-1.5 p-2 px-3 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 w-fit">
                  <span className="text-[10px] text-neutral-secondary mr-1">Helper is active</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal typing-dot-3" />
                </div>
              </div>

              {/* Chat Input or Read-Only Notice (Section 8) */}
              {order.status === 'completed' || order.status === 'cancelled' ? (
                <div className="p-3 text-center rounded-card bg-neutral-surface-alt dark:bg-slate-800 text-xs text-neutral-secondary border border-neutral-border dark:border-slate-700">
                  🔒 This order is closed. Chat transcript is now in read-only mode.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    aria-label="Message helper"
                    className="flex-1 h-11 px-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                  />
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark active:scale-[0.97] transition-all duration-150 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: ITEM CHECKS & REPLACEMENTS */}
          {activeTab === 'item_checks' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Item Availability & Proposed Substitutes
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Helper's live photos from the store shelf. Equal approve/decline choices per item.
                </p>
              </div>

              <div className="p-4 rounded-card border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-semantic-warning block">
                      Proposed Substitute for "Blue Ballpoint Pens"
                    </span>
                    <p className="text-xs text-neutral-secondary">
                      Reynolds 5-pack out of stock. Helper found Cello Butterflow 3-pack (₹60).
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm text-neutral-ink dark:text-neutral-dark-text">
                    ₹60
                  </span>
                </div>

                {/* Equal Approve / Decline Buttons per Section 8 & 16 */}
                <div className="flex items-center gap-3 pt-2 border-t border-neutral-border/60 dark:border-slate-700/60">
                  <button
                    onClick={() => setItemApprovalStatus({ ...itemApprovalStatus, 'item-2': 'approved' })}
                    className={`flex-1 h-10 rounded-btn text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      itemApprovalStatus['item-2'] === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Approve Substitute</span>
                  </button>

                  <button
                    onClick={() => setItemApprovalStatus({ ...itemApprovalStatus, 'item-2': 'declined' })}
                    className={`flex-1 h-10 rounded-btn text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      itemApprovalStatus['item-2'] === 'declined'
                        ? 'bg-rose-600 text-white'
                        : 'border border-rose-600 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Decline (₹0 Owed)</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-input bg-brand-indigo-light/50 dark:bg-brand-indigo/10 border border-brand-indigo/20 text-xs text-brand-indigo">
                💡 <strong>Campus Rule:</strong> Extra items or replacements are only added to your order receipt after your explicit tap approval.
              </div>
            </div>
          )}

          {/* TAB 4: PRICE APPROVAL */}
          {activeTab === 'price_approval' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Price Confirmation Before Purchase
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Guaranteed protection: No purchase proceeds without your agreement if the actual price differs.
                </p>
              </div>

              {/* Side-by-Side Comparison Card (10.4: card shakes horizontally once 6px, 300ms + amber border) */}
              <div className="p-5 rounded-panel border-2 border-semantic-warning bg-white dark:bg-slate-900 shadow-sm space-y-4 animate-shake">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-card bg-neutral-surface-alt dark:bg-slate-800">
                    <span className="text-[11px] text-neutral-secondary block">Original Estimate</span>
                    <span className="font-heading font-extrabold text-xl font-mono text-neutral-ink dark:text-neutral-dark-text">
                      ₹170
                    </span>
                  </div>

                  <div className="p-3 rounded-card bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block">
                      Actual Store Total
                    </span>
                    <span className="font-heading font-extrabold text-xl font-mono text-amber-900 dark:text-amber-200">
                      ₹180
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-secondary leading-relaxed">
                  The notebook price at Bits & Bytes Stationery is ₹60 instead of the estimated ₹50 (+₹10 difference). Helper has paused checkout awaiting your go-ahead.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setPriceApproved(true)}
                    className="flex-1 h-11 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold transition-colors"
                  >
                    {priceApproved ? '✓ Price Confirmed & Approved' : 'Approve Actual Price (₹180)'}
                  </button>

                  <button
                    onClick={() => alert('Price rejected. Helper will return items to shelf without charging you.')}
                    className="h-11 px-4 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT (UPI) */}
          {activeTab === 'payment' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
                  Split Payment Breakdown
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Two separate moments: Store items paid via cashier QR, helper fee paid after physical handover.
                </p>
              </div>

              {/* Itemised Payment Sheet (Section 8) */}
              <div className="p-5 rounded-panel border border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-800/40 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-secondary">
                    <span>Retail Goods Subtotal (Paid to Store)</span>
                    <span className="font-mono font-bold text-neutral-ink dark:text-neutral-dark-text text-sm">
                      ₹{order.itemCost}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-brand-teal font-medium">
                    <span>Helper Delivery Fee (Paid after Handover)</span>
                    <span className="font-mono font-bold text-sm">
                      ₹{order.helperFee}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-border dark:border-slate-700 flex justify-between items-center">
                  <span className="font-heading font-bold text-sm text-neutral-ink dark:text-neutral-dark-text">
                    Total Order Value
                  </span>
                  <span className="font-mono font-extrabold text-xl text-brand-indigo dark:text-brand-indigo-darkmode">
                    ₹{order.totalCost}
                  </span>
                </div>

                {/* Primary Button: Open UPI App (Section 8) */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => alert('Simulating UPI App Intent (GPay / PhonePe / Paytm)...')}
                    className="w-full h-12 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Open UPI App to Pay Cashier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('Payment marked done by customer.')}
                    className="w-full h-10 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-body dark:text-slate-300 hover:bg-white"
                  >
                    I Have Completed Payment
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-card bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
                ✓ <strong>Reassurance:</strong> You pay nothing for unbought or declined items.
              </div>
            </div>
          )}

          {/* TAB 6: HANDOVER */}
          {activeTab === 'handover' && (
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo dark:text-brand-indigo-darkmode">
                  Physical Campus Drop-off
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-neutral-ink dark:text-neutral-dark-text">
                  Handover Confirmation
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Show this 4-digit code to your helper when meeting at the pickup location.
                </p>
              </div>

              {/* Big 4-Digit Handover Code (10.4: digits fade in sequentially 50ms each) */}
              <div className="p-8 rounded-panel bg-neutral-surface-alt dark:bg-slate-900 border-2 border-dashed border-brand-indigo/40 space-y-2">
                <span className="text-[11px] font-semibold text-neutral-secondary uppercase tracking-widest block">
                  One-Time Student Code
                </span>
                <div className="font-mono font-extrabold text-4xl sm:text-5xl text-neutral-ink dark:text-neutral-dark-text tracking-[0.25em] flex justify-center gap-3">
                  {order.handoverCode.split('').map((digit, idx) => (
                    <span key={idx} className={`inline-block digit-fade-${idx % 4}`}>
                      {digit}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-brand-teal font-medium block pt-1">
                  Valid for {order.pickupPoint}
                </span>
              </div>

              <div className="p-3.5 rounded-card bg-white dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-left text-xs space-y-1">
                <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text block">Meeting Location</span>
                <p className="text-neutral-secondary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-indigo" />
                  {order.pickupPoint}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="flex-1 h-11 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-body dark:text-slate-300 hover:bg-neutral-surface-alt"
                >
                  Reschedule Drop-off
                </button>
                <button
                  onClick={() => setActiveTab('rating')}
                  className="flex-1 h-11 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Confirm Handover Done
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: RATING & REVIEW */}
          {activeTab === 'rating' && (
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-2xl text-neutral-ink dark:text-neutral-dark-text">
                  Rate Your Helper
                </h3>
                <p className="text-xs text-neutral-secondary">
                  Optional feedback for {order.helperName || 'your helper'}. (Skippable with Skip)
                </p>
              </div>

              {ratingSubmitted ? (
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
                    Thank You for Your Feedback!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">
                    Your rating helps maintain community trust in the campus student network.
                  </p>
                  <button
                    onClick={() => onNavigate('/app/history')}
                    className="mt-2 h-10 px-5 rounded-btn bg-brand-indigo text-white text-xs font-semibold active:scale-[0.97] transition-all"
                  >
                    View in Order History
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Big Tap Target Stars (10.4: fill sequentially, scale 1.15 pop on select) */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className={`p-2 transition-transform hover:scale-115 focus:outline-none ${
                          star === ratingStars ? 'star-pop' : ''
                        }`}
                        aria-label={`${star} star rating`}
                      >
                        <Star
                          className={`w-9 h-9 transition-colors duration-150 ${
                            star <= ratingStars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-border'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    aria-label="Note of appreciation or feedback"
                    className="w-full p-3 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigate('/app/history')}
                      className="flex-1 h-11 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-secondary hover:text-neutral-ink"
                    >
                      Skip Rating
                    </button>
                    <button
                      onClick={() => setRatingSubmitted(true)}
                      className="flex-1 h-11 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold shadow-sm"
                    >
                      Submit Rating
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cancel Order Confirmation (Section 16) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-neutral-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-slate-800 p-6 shadow-e3 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-semantic-danger-tint text-semantic-danger flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-ink dark:text-neutral-dark-text">
              Cancel Order #{order.id}?
            </h3>
            <p className="text-xs text-neutral-secondary leading-relaxed">
              Before purchase, you can cancel at any time. <strong>You pay nothing for unbought items.</strong>
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-10 rounded-btn border border-neutral-border dark:border-slate-700 text-xs font-semibold text-neutral-body dark:text-slate-300"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  alert('Order successfully cancelled. ₹0 charged.');
                  onNavigate('/app/history');
                }}
                className="flex-1 h-10 rounded-btn bg-semantic-danger text-white text-xs font-semibold"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reschedule Handover (Section 16) */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-neutral-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-dark-card rounded-panel border border-neutral-border dark:border-slate-800 p-6 shadow-e3 space-y-4">
            <h3 className="font-heading font-bold text-base text-neutral-ink dark:text-neutral-dark-text">
              Reschedule Pickup Time
            </h3>
            <p className="text-xs text-neutral-secondary">
              Select the next available window that fits your schedule:
            </p>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="w-full p-2.5 rounded-input border border-brand-indigo bg-brand-indigo-light text-brand-indigo font-semibold text-left"
              >
                In 30 minutes (7:45 PM)
              </button>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="w-full p-2.5 rounded-input border border-neutral-border text-neutral-body text-left hover:bg-neutral-surface-alt"
              >
                Tonight at 9:00 PM (Study break)
              </button>
            </div>
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="w-full h-9 rounded-btn text-xs text-neutral-secondary hover:text-neutral-ink"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
