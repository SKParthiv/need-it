import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Camera,
  X,
  Lock,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Star,
  FileText,
  ThumbsUp,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StatusChip } from '../common/StatusChip';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ClientQrCode } from '../common/ClientQrCode';
import { useWebApp } from '../../context/WebAppContext';
import { api } from '../../services/api';
import { Order, OrderStatus, ChatMessage } from '../../types';

interface OrderChatViewProps {
  orderId: string;
  onNavigate: (path: string) => void;
  viewerRole?: 'customer' | 'helper';
}

export const OrderChatView: React.FC<OrderChatViewProps> = ({
  orderId,
  onNavigate,
  viewerRole: forcedRole,
}) => {
  const {
    getOrderById,
    getChatByOrderId,
    fetchMessages,
    sendMessage,
    updateOrderStatus,
    approvePrices,
    proposePrice,
    payOrder,
    confirmPayment,
    confirmHandover,
    rateOrder,
    refreshOrders,
    role: contextRole,
    currentUser,
  } = useWebApp();

  const role = forcedRole || contextRole;
  const order = getOrderById(orderId);

  // Active chat data
  const chatData = getChatByOrderId(orderId) || {
    id: `chat-${orderId}`,
    orderId,
    counterpartName:
      role === 'customer'
        ? order?.helperName || 'Assigned Helper'
        : order?.customerAlias || order?.customerName || 'Customer',
    counterpartRole: role === 'customer' ? 'helper' : 'customer',
    lastMessage: 'Order conversation initiated.',
    lastMessageTime: 'Just now',
    unreadCount: 0,
    isReadOnly: false,
    messages: [
      {
        id: `msg-init-${orderId}`,
        senderRole: 'system',
        senderName: 'NeedIt Security',
        text: `Errand thread initiated. Phone numbers masked by default for student privacy.`,
        timestamp: 'Just now',
        isSystemNotice: true,
      },
    ],
  };

  // Chat message & photo attachment state
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showSpecsDrawer, setShowSpecsDrawer] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  // Price proposal / approval states
  const [approvingPrice, setApprovingPrice] = useState(false);
  const [priceApproveError, setPriceApproveError] = useState('');
  const [helperPriceInput, setHelperPriceInput] = useState<Record<string, string>>({});
  const [helperPhotoUrl, setHelperPhotoUrl] = useState<Record<string, string>>({});
  const [helperPhotoBusy, setHelperPhotoBusy] = useState<Record<string, boolean>>({});
  const [helperPriceBusy, setHelperPriceBusy] = useState<string>('');

  // Payment states (synced with server)
  const [paymentData, setPaymentData] = useState<{
    status: string;
    item_cost?: number;
    helper_fee?: number;
    total?: number;
    upi_id?: string;
    upi_deep_link?: string;
  }>({
    status: order?.paymentStatus || 'none',
    item_cost: order?.itemCost,
    helper_fee: order?.helperFee,
    total: order?.totalCost,
    upi_id: order?.helperUpiId,
  });
  const [isPaying, setIsPaying] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Handover state
  const [handoverInputCode, setHandoverInputCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [handoverError, setHandoverError] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [handoverAttempts, setHandoverAttempts] = useState<number>(0);
  const [isHandoverLocked, setIsHandoverLocked] = useState<boolean>(false);

  // Photo upload availability (Issue #28: If signature returns 503, hide photo buttons and continue without photos)
  const [photosSupported, setPhotosSupported] = useState<boolean>(true);

  // Blocked / Forbidden notice (Issue #28 Trust UX: 403 reason + appeal hint)
  const [blockedNotice, setBlockedNotice] = useState<{ reason: string; appealHint: string } | null>(null);

  // Purchase state
  const [isMarkingPurchased, setIsMarkingPurchased] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  // Rating state
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatData.messages.length]);

  // Check photo upload service on mount (Issue #28: 503 hides photo buttons)
  useEffect(() => {
    let isMounted = true;
    api
      .isPhotoUploadAvailable()
      .then((avail) => {
        if (isMounted) setPhotosSupported(avail);
      })
      .catch(() => {
        if (isMounted) setPhotosSupported(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync real messages from backend + instant window focus & tab visibility polling (Issue #28 DoD)
  useEffect(() => {
    let isMounted = true;
    const loadChat = async () => {
      try {
        await fetchMessages(orderId);
      } catch {
        // Safe ignore
      }
    };
    loadChat();

    const handleFocusSync = () => {
      if (isMounted) {
        fetchMessages(orderId).catch(() => {});
        refreshOrders().catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocusSync);
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        handleFocusSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilitySync);

    const interval = setInterval(() => {
      if (isMounted) {
        fetchMessages(orderId).catch(() => {});
      }
    }, 4000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      clearInterval(interval);
    };
  }, [orderId, fetchMessages, refreshOrders]);

  // Fetch actual payment status from server
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      const numId = parseInt(orderId, 10);
      if (!isNaN(numId)) {
        try {
          const res = await api.getPaymentStatus(numId);
          if (isMounted && res) {
            setPaymentData((prev) => ({
              ...prev,
              ...res,
              status: res.status || prev.status,
            }));
          }
        } catch {
          // If 404 or payment not created yet, keep existing
        }
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [orderId, order?.status]);

  // Clean up preview object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!order) {
    return (
      <div className="w-full max-w-content mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-surface-alt dark:bg-slate-800 flex items-center justify-center text-neutral-secondary">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-xl text-neutral-ink dark:text-neutral-dark-text">
          Order Not Found
        </h2>
        <p className="text-xs text-neutral-secondary max-w-sm mx-auto">
          This order #{orderId} does not exist or has expired.
        </p>
        <button
          onClick={() => onNavigate(role === 'helper' ? '/app/helper/jobs' : '/app/orders')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-indigo text-white text-xs font-semibold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{role === 'helper' ? 'Back to My Jobs' : 'Back to My Orders'}</span>
        </button>
      </div>
    );
  }

  // Handle file picker selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSendError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSendError('Image must be under 10MB.');
      return;
    }

    setSendError('');
    setAttachedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message with optional photo attachment via Cloudinary flow
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    setIsSending(true);
    setSendError('');

    let uploadedPhotoUrl: string | undefined = undefined;

    if (attachedFile) {
      try {
        uploadedPhotoUrl = await api.uploadEvidencePhoto(attachedFile);
      } catch {
        try {
          uploadedPhotoUrl = URL.createObjectURL(attachedFile);
        } catch {
          // fallback
        }
      }
    }

    try {
      await sendMessage(order.id, inputText.trim(), uploadedPhotoUrl);
      setInputText('');
      handleRemoveAttachment();
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send message. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  // Helper shelf photo upload for price proposal
  const handleHelperShelfPhoto = async (itemId: string, file?: File) => {
    if (!file) return;
    setPriceApproveError('');
    setHelperPhotoBusy((prev) => ({ ...prev, [itemId]: true }));
    try {
      const url = await api.uploadEvidencePhoto(file);
      setHelperPhotoUrl((prev) => ({ ...prev, [itemId]: url }));
    } catch {
      try {
        const fallbackUrl = URL.createObjectURL(file);
        setHelperPhotoUrl((prev) => ({ ...prev, [itemId]: fallbackUrl }));
      } catch {
        setPriceApproveError('Could not process photo, but you can still enter the price directly.');
      }
    } finally {
      setHelperPhotoBusy((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleHelperSubmitPrice = async (itemId: string) => {
    const raw = helperPriceInput[itemId];
    const price = parseInt(raw ?? '', 10);
    if (!raw || isNaN(price) || price < 0) {
      setPriceApproveError('Enter the actual shelf price first.');
      return;
    }
    setPriceApproveError('');
    setHelperPriceBusy(itemId);
    try {
      await proposePrice(order.id, itemId, price, helperPhotoUrl[itemId]);
      await refreshOrders();
    } catch (err: any) {
      if (err?.status === 403 || err?.isForbidden || String(err?.message).includes('403')) {
        setBlockedNotice({
          reason: err?.reason || err?.message || 'Only verified campus helpers can submit shelf prices.',
          appealHint: err?.appealHint || 'Please submit an appeal through the Report a Problem page.'
        });
      }
      setPriceApproveError(err?.message || 'Could not submit price. Try again.');
    } finally {
      setHelperPriceBusy('');
    }
  };

  // Customer price approval
  const handleCustomerApprovePrice = async () => {
    setPriceApproveError('');
    setApprovingPrice(true);
    try {
      await approvePrices(order.id);
      await refreshOrders();
    } catch (err: any) {
      if (err?.status === 403 || err?.isForbidden || String(err?.message).includes('403')) {
        setBlockedNotice({
          reason: err?.reason || err?.message || 'Price approval restricted by safety policy.',
          appealHint: err?.appealHint || 'Please submit an appeal through the Report a Problem page.'
        });
      }
      setPriceApproveError(err?.message || 'Could not approve prices. Try again.');
    } finally {
      setApprovingPrice(false);
    }
  };

  // Customer pay action: creates payment & marks customer confirmed
  const handleCustomerPay = async () => {
    setIsPaying(true);
    setPaymentError('');
    try {
      await payOrder(order.id, order.helperFee);
      // Mark customer confirmation
      await confirmPayment(order.id);
      setPaymentData((prev) => ({ ...prev, status: 'pending' }));
      await refreshOrders();
    } catch (err: any) {
      if (err?.status === 403 || err?.isForbidden || String(err?.message).includes('403')) {
        setBlockedNotice({
          reason: err?.reason || err?.message || 'Payment initiation restricted by campus safety policy.',
          appealHint: err?.appealHint || 'Please submit an appeal through the Report a Problem page.'
        });
      }
      setPaymentError(err?.message || 'Payment initiation failed. Try again.');
    } finally {
      setIsPaying(false);
    }
  };

  // Helper confirm payment action: marks helper confirmed
  const handleHelperConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    setPaymentError('');
    try {
      await confirmPayment(order.id);
      setPaymentData((prev) => ({ ...prev, status: 'held' }));
      await refreshOrders();
    } catch (err: any) {
      if (err?.status === 403 || err?.isForbidden || String(err?.message).includes('403')) {
        setBlockedNotice({
          reason: err?.reason || err?.message || 'Payment confirmation restricted.',
          appealHint: err?.appealHint || 'Please submit an appeal through the Report a Problem page.'
        });
      }
      setPaymentError(err?.message || 'Payment confirmation failed. Try again.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Helper handover verification (Issue #28: Enter OTP, 5 wrong = locked)
  const handleVerifyHandover = async () => {
    if (isHandoverLocked) return;
    if (handoverInputCode.trim().length !== 4) {
      setHandoverError('Please enter the 4-digit code shown by customer.');
      return;
    }
    setIsVerifyingCode(true);
    setHandoverError('');
    try {
      await confirmHandover(order.id, handoverInputCode.trim());
      await refreshOrders();
      setHandoverAttempts(0);
    } catch (err: any) {
      const msg = String(err?.message || '');
      const newAttempts = handoverAttempts + 1;
      setHandoverAttempts(newAttempts);

      if (
        newAttempts >= 5 ||
        msg.toLowerCase().includes('too many wrong') ||
        msg.toLowerCase().includes('locked')
      ) {
        setIsHandoverLocked(true);
        setHandoverError('Delivery Locked: 5 incorrect codes entered. Handover verification is locked for student safety.');
      } else {
        const remaining = 5 - newAttempts;
        setHandoverError(
          err?.message || `Incorrect verification code (${newAttempts}/5 attempts). ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        );
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Helper marks items as purchased (Section 10.4 / Req 9)
  const handleMarkPurchased = async () => {
    setIsMarkingPurchased(true);
    setPurchaseError('');
    try {
      await updateOrderStatus(order.id, 'purchased');
      await refreshOrders();
    } catch (err: any) {
      setPurchaseError(
        err?.message || 'Failed to mark as purchased. Ensure all item prices are approved.'
      );
    } finally {
      setIsMarkingPurchased(false);
    }
  };

  // Rating submission for completed orders (Req 11)
  const handleRatingSubmit = async () => {
    setIsSubmittingRating(true);
    try {
      await rateOrder(order.id, ratingStars, ratingFeedback);
    } catch (err) {
      console.warn('Rating submission notice:', err);
    } finally {
      setIsSubmittingRating(false);
      setRatingSubmitted(true);
    }
  };

  // Compute item metrics
  const pricedItems = order.items.filter((i) => i.status !== 'unavailable');
  const allPriced = pricedItems.length > 0 && pricedItems.every((i) => i.actualPrice != null);
  const allApproved = pricedItems.length > 0 && pricedItems.every((i) => i.priceApproved);
  const estTotal = pricedItems.reduce((s, i) => s + i.expectedPrice * i.quantity, 0);
  const actGoodsTotal = pricedItems.reduce(
    (s, i) => s + (i.actualPrice ?? i.expectedPrice) * i.quantity,
    0
  );
  const finalTotal = paymentData.total ?? actGoodsTotal + order.helperFee;

  // UPI data determination
  // Check server-provided upi_id and upi_deep_link
  const serverUpiId =
    paymentData.upi_id ||
    (order as any).upi_id ||
    order.helperUpiId ||
    (order.helperName ? 'helper@okhdfc' : '');
  const serverDeepLink = paymentData.upi_deep_link || (order as any).upi_deep_link;

  const upiDeepLink =
    serverDeepLink ||
    (serverUpiId
      ? `upi://pay?pa=${encodeURIComponent(serverUpiId)}&pn=${encodeURIComponent(
          order.helperName || 'NeedIt Helper'
        )}&am=${finalTotal}&cu=INR&tn=NeedIt%20Order%20${order.id}`
      : '');

  const isReadOnly = order.status === 'completed' || order.status === 'cancelled';

  // Step indicator calculation (1: Prices, 2: Payment, 3: Shopping, 4: Delivery)
  let activeStep = 1;
  let actionTitle = '';
  let actionDesc = '';
  let actionBadge = '';
  let isActionRequired = false;

  if (order.status === 'open') {
    activeStep = 1;
    actionBadge = 'Finding Helper';
    actionTitle = 'Looking for a verified student helper...';
    actionDesc = 'Your order is visible to campus helpers near the shops. You will get a notification when someone accepts.';
  } else if (order.status === 'accepted') {
    if (!allApproved) {
      activeStep = 1;
      actionBadge = 'Step 1: Check Prices';
      if (role === 'helper') {
        isActionRequired = true;
        actionTitle = 'Your Turn: Enter the shop price for each item';
        actionDesc = 'Check the items on the shop shelf below. Type what the shop charges, optionally attach a price tag photo, and tap "Send Price".';
      } else {
        actionTitle = allPriced ? 'Your Turn: Review and approve prices' : 'Helper is checking prices at the shop';
        actionDesc = allPriced
          ? 'Your helper entered the shop prices. Tap "Approve Prices & Pay" below to continue.'
          : `${order.helperName || 'Your helper'} has accepted your order and is checking the items at the shop right now.`;
        isActionRequired = allPriced;
      }
    } else if (paymentData.status !== 'held' && paymentData.status !== 'released') {
      activeStep = 2;
      actionBadge = 'Step 2: Payment';
      if (role === 'customer') {
        isActionRequired = paymentData.status === 'none';
        actionTitle = paymentData.status === 'pending'
          ? 'Payment sent — waiting for helper confirmation'
          : `Your Turn: Pay ₹${finalTotal} via UPI`;
        actionDesc = paymentData.status === 'pending'
          ? 'You marked payment as sent. Your helper is checking their UPI app to confirm.'
          : 'Scan the QR code below or tap "Pay in UPI app". Once sent, tap "I have Paid".';
      } else {
        isActionRequired = paymentData.status === 'pending';
        actionTitle = paymentData.status === 'pending'
          ? `Your Turn: Check your UPI app for ₹${finalTotal}`
          : 'Waiting for customer payment';
        actionDesc = paymentData.status === 'pending'
          ? 'The customer marked that they sent the payment. Once you verify it in Google Pay/PhonePe, tap "Confirm Payment Received".'
          : 'Customer has approved the prices and is making payment to your UPI handle. Never front personal cash.';
      }
    } else {
      activeStep = 3;
      actionBadge = 'Step 3: Buying Items';
      if (role === 'helper') {
        isActionRequired = true;
        actionTitle = 'Your Turn: Buy the items at the shop';
        actionDesc = 'Payment received! Purchase the items from the counter. Once you have all items, tap "All Items Bought" below.';
      } else {
        actionTitle = 'Helper is buying your items';
        actionDesc = `Payment received. ${order.helperName || 'Your helper'} is picking up your items and will bring them to ${order.pickupPoint}.`;
      }
    }
  } else if (order.status === 'purchased' || order.status === 'handed_over') {
    activeStep = 4;
    actionBadge = 'Step 4: Pickup & Delivery';
    if (role === 'customer') {
      isActionRequired = true;
      actionTitle = `Meet your helper at ${order.pickupPoint}`;
      actionDesc = `Your items are ready! Meet your helper at ${order.pickupPoint} and show them your 4-digit code: ${order.handoverCode || ''}.`;
    } else {
      isActionRequired = true;
      actionTitle = `Meet the customer at ${order.pickupPoint}`;
      actionDesc = `Head to ${order.pickupPoint}. Ask the customer for their 4-digit code and enter it below to complete the delivery.`;
    }
  } else if (order.status === 'completed') {
    activeStep = 5;
    actionBadge = 'Delivered ✓';
    actionTitle = 'Order Delivered Successfully!';
    actionDesc = role === 'helper'
      ? `You finished this errand and earned ₹${order.helperFee}. Thank you for helping your peer!`
      : 'You received your items. Thank you for using NeedIt!';
  } else if (order.status === 'cancelled') {
    activeStep = 0;
    actionBadge = 'Cancelled';
    actionTitle = 'Order Cancelled';
    actionDesc = 'This order was cancelled (₹0 owed).';
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)] bg-neutral-page-bg dark:bg-neutral-dark-page">
      {/* 1. COMPACT STICKY STATUS HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-dark-card/95 backdrop-blur-md border-b border-neutral-border dark:border-neutral-dark-border px-4 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Back button & Order title with status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => onNavigate(role === 'helper' ? '/app/helper/jobs' : '/app/orders')}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-neutral-surface-alt dark:hover:bg-slate-800 text-neutral-secondary hover:text-neutral-ink transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-extrabold text-sm sm:text-base text-neutral-ink dark:text-neutral-dark-text truncate">
                  Order #{order.id}
                </span>
                <StatusChip status={order.status} size="sm" />
                {order.isUrgent && <StatusChip status="urgent" size="sm" />}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neutral-secondary truncate">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-brand-indigo shrink-0" />
                  <span className="truncate">{order.pickupPoint}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-brand-indigo shrink-0" />
                  <span>{order.neededBy}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick actions, Counterpart info, Specs toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Customer Handover OTP Quick Pill */}
            {role === 'customer' && order.handoverCode && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-indigo-light text-brand-indigo font-mono font-bold text-xs border border-brand-indigo/30">
                <KeyRound className="w-3 h-3" />
                <span>OTP: {order.handoverCode}</span>
              </div>
            )}

            {/* Counterpart info */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs">
              <span className="text-neutral-secondary">
                {role === 'customer' ? 'Helper:' : 'Customer:'}
              </span>
              <strong className="text-neutral-ink dark:text-neutral-dark-text font-semibold">
                {role === 'customer' ? order.helperName || 'Awaiting' : order.customerAlias}
              </strong>
              {role === 'customer' && order.helperName && <VerifiedBadge size="sm" showText={false} />}
            </div>

            {/* Toggle Order Specs Drawer */}
            <button
              onClick={() => setShowSpecsDrawer(!showSpecsDrawer)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-btn bg-neutral-surface-alt dark:bg-slate-800 hover:bg-neutral-border/60 text-neutral-ink dark:text-neutral-dark-text text-xs font-semibold border border-neutral-border dark:border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-secondary" />
              <span className="hidden sm:inline">Specs</span>
              {showSpecsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Specs Drawer */}
        {showSpecsDrawer && (
          <div className="mt-2.5 pt-2.5 border-t border-neutral-border dark:border-slate-800 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-neutral-secondary">
              <span className="font-semibold text-neutral-ink dark:text-neutral-dark-text">
                Requested Items ({order.items.length})
              </span>
              <span>Estimated Goods: ₹{order.itemCost}</span>
            </div>

            <div className="max-h-36 overflow-y-auto divide-y divide-neutral-border/50 dark:divide-slate-800 border rounded-card border-neutral-border dark:border-slate-800 bg-neutral-surface-alt/40 dark:bg-slate-900/40 p-2">
              {order.items.map((item) => (
                <div key={item.id} className="py-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-neutral-ink dark:text-neutral-dark-text">
                      {item.name} × {item.quantity}
                    </span>
                    {item.notes && (
                      <span className="block text-[10px] text-neutral-secondary italic">{item.notes}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold">₹{item.expectedPrice}</span>
                    {item.actualPrice != null && (
                      <span className="text-[10px] text-brand-teal block">Act: ₹{item.actualPrice}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-secondary pt-1">
              <span>Drop-off spot: <strong>{order.pickupPoint}</strong></span>
              <div className="flex items-center gap-3">
                {role === 'customer' && order.status === 'open' && (
                  <button
                    onClick={async () => {
                      if (confirm('Cancel this open order? (₹0 owed)')) {
                        try {
                          await api.cancelRequest(order.id, 'Cancelled by customer');
                          await refreshOrders();
                          onNavigate('/app/orders');
                        } catch (e: any) {
                          alert(e?.message || 'Could not cancel order.');
                        }
                      }
                    }}
                    className="text-semantic-danger hover:underline font-semibold"
                  >
                    Cancel Order (₹0)
                  </button>
                )}
                {role === 'helper' && order.status === 'accepted' && (
                  <button
                    onClick={async () => {
                      if (confirm('Release this request back to campus feed? (No penalty)')) {
                        try {
                          await api.releaseRequest(order.id);
                          await refreshOrders();
                          onNavigate('/app/helper/feed');
                        } catch (e: any) {
                          alert(e?.message || 'Could not release request.');
                        }
                      }
                    }}
                    className="text-semantic-danger hover:underline font-semibold"
                  >
                    Release Job (No Penalty)
                  </button>
                )}
                <button
                  onClick={() => onNavigate('/app/report')}
                  className="text-neutral-secondary hover:text-neutral-ink hover:underline flex items-center gap-1 font-medium"
                >
                  <ShieldAlert className="w-3 h-3 text-semantic-danger" /> Report issue
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN ORDER CHAT & INLINE EVENT STREAM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Blocked Action Banner (Issue #28 Trust UX: 403 reason + appeal hint) */}
        {blockedNotice && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Action Restricted by Server (HTTP 403)</strong>
                <p className="mt-0.5">{blockedNotice.reason}</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 font-medium">{blockedNotice.appealHint}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/app/report')}
              className="px-3.5 py-2 rounded-btn bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 self-end sm:self-center shadow-sm"
            >
              Submit Appeal
            </button>
          </div>
        )}

        {/* ORDER PROGRESS TRACKER & ACTION GUIDE */}
        <div className="p-4 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-3">
          {/* 4-Step Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-semibold">
            {[
              { num: 1, label: 'Prices' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Shopping' },
              { num: 4, label: 'Delivery' },
            ].map((s) => {
              const isPast = activeStep > s.num;
              const isCurrent = activeStep === s.num;
              return (
                <div
                  key={s.num}
                  className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    isPast
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                      : isCurrent
                      ? 'bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 font-bold ring-1 ring-brand-indigo/30'
                      : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-placeholder'
                  }`}
                >
                  <span>{isPast ? '✓' : `${s.num}.`}</span>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Contextual Action Callout */}
          <div
            className={`p-3 rounded-card text-xs space-y-1 transition-all ${
              isActionRequired
                ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                : 'bg-neutral-surface-alt dark:bg-slate-800/80 border border-neutral-border dark:border-slate-700 text-neutral-ink dark:text-neutral-dark-text'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                {isActionRequired ? '👉' : 'ℹ️'} {actionTitle}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 dark:bg-black/30 text-neutral-secondary shrink-0">
                {actionBadge}
              </span>
            </div>
            <p className="text-[11px] text-neutral-secondary dark:text-slate-300 leading-relaxed">
              {actionDesc}
            </p>
          </div>
        </div>

        {/* Privacy & Phone Masked Notice */}
        <div className="p-2.5 rounded-card bg-neutral-surface-alt/70 dark:bg-slate-800/70 border border-neutral-border dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-secondary">
            <Lock className="w-3.5 h-3.5 text-brand-indigo shrink-0" />
            <span>Phone numbers are masked for student privacy. Chat here for order updates.</span>
          </div>

          {!phoneRevealed ? (
            <button
              onClick={() => setPhoneRevealed(true)}
              className="text-brand-indigo hover:underline flex items-center gap-1 text-[11px] font-semibold shrink-0"
            >
              <Phone className="w-3 h-3" /> Reveal Phone
            </button>
          ) : (
            <span className="text-[11px] font-mono text-emerald-600 font-bold shrink-0">
              +91 98451 XXXXX
            </span>
          )}
        </div>

        {/* INLINE CARD 1: ORDER PLACED CARD */}
        <div className="p-4 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-border/60 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-indigo" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-indigo">
                Order Placed
              </span>
            </div>
            <span className="text-[10px] text-neutral-placeholder font-mono">{order.createdAt}</span>
          </div>

          <p className="text-xs text-neutral-secondary">
            {role === 'customer'
              ? 'Your request is visible to student helpers on campus. They will verify items at the shop.'
              : `${order.customerAlias} requested items from campus stores. Check prices at the shop below.`}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-surface-alt dark:bg-slate-800/50 p-2.5 rounded-card">
            <div>
              <span className="text-[10px] text-neutral-secondary block">Pickup Location</span>
              <strong className="font-medium text-neutral-ink dark:text-neutral-dark-text truncate block">
                {order.pickupPoint}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-neutral-secondary block">Needed By</span>
              <strong className="font-medium text-neutral-ink dark:text-neutral-dark-text truncate block">
                {order.neededBy}
              </strong>
            </div>
          </div>
        </div>

        {/* INLINE CARD 2: HELPER ACCEPTED CARD */}
        {order.status !== 'open' && (
          <div className="p-3.5 rounded-panel bg-brand-teal-light/40 dark:bg-brand-teal/10 border border-brand-teal/30 space-y-1 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-teal flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
                Helper Accepted Order
              </span>
              <span className="text-[10px] text-brand-teal font-medium">Assigned</span>
            </div>
            <p className="text-[11px] text-neutral-secondary">
              {role === 'customer'
                ? `${order.helperName || 'A verified student helper'} has accepted your order and is checking items at the shop.`
                : 'You have accepted this order. Please enter the shop prices below.'}
            </p>
          </div>
        )}

        {/* INLINE CARD 3: PRICE CONFIRMATION & SHELF EVIDENCE CARD */}
        {order.status !== 'open' && (
          <div className="p-4 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-border/60 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-teal" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-teal">
                  Store Prices
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  allApproved
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {allApproved ? '✓ Prices Confirmed' : allPriced ? 'Waiting for Approval' : 'Checking at Store'}
              </span>
            </div>

            {/* Item-by-item actual prices & photos */}
            <div className="space-y-2.5">
              {pricedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-card bg-neutral-surface-alt/60 dark:bg-slate-800/40 border border-neutral-border/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {(item.evidencePhotoUrl || helperPhotoUrl[item.id]) && (
                      <button
                        type="button"
                        onClick={() => setZoomPhotoUrl(item.evidencePhotoUrl || helperPhotoUrl[item.id])}
                        className="relative group shrink-0"
                      >
                        <img
                          src={item.evidencePhotoUrl || helperPhotoUrl[item.id]}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-neutral-border group-hover:opacity-90"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-3.5 h-3.5 text-white" />
                        </span>
                      </button>
                    )}

                    <div>
                      <strong className="font-semibold text-neutral-ink dark:text-neutral-dark-text block">
                        {item.name} × {item.quantity}
                      </strong>
                      <span className="text-[11px] text-neutral-secondary font-mono">
                        Estimate: ₹{item.expectedPrice} →{' '}
                        {item.actualPrice != null ? (
                          <strong className="text-neutral-ink dark:text-neutral-dark-text">
                            Actual: ₹{item.actualPrice}
                          </strong>
                        ) : (
                          'Waiting for helper price'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Helper price input controls if not yet set/approved */}
                  {role === 'helper' && !allApproved && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        min={0}
                        placeholder={`₹ price`}
                        value={
                          helperPriceInput[item.id] ??
                          (item.actualPrice != null ? String(item.actualPrice) : '')
                        }
                        onChange={(e) =>
                          setHelperPriceInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="w-24 h-9 px-2.5 rounded-input bg-white dark:bg-slate-900 border border-neutral-border text-xs font-mono"
                      />

                      {/* Shelf Photo Attachment (Hidden if signature returns 503 per Issue #28) */}
                      {photosSupported ? (
                        <label className="h-9 px-2.5 rounded-btn border text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-neutral-surface-alt">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleHelperShelfPhoto(item.id, e.target.files?.[0])}
                            disabled={helperPhotoBusy[item.id]}
                          />
                          <Camera className="w-3 h-3 text-brand-teal" />
                          <span>
                            {helperPhotoBusy[item.id]
                              ? '...'
                              : helperPhotoUrl[item.id] || item.evidencePhotoUrl
                              ? 'Photo ✓'
                              : 'Photo'}
                          </span>
                        </label>
                      ) : null}

                      <button
                        onClick={() => handleHelperSubmitPrice(item.id)}
                        disabled={helperPriceBusy === item.id || helperPhotoBusy[item.id]}
                        className="h-9 px-3 rounded-btn bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-dark disabled:opacity-50"
                      >
                        {helperPriceBusy === item.id ? '...' : 'Save'}
                      </button>
                    </div>
                  )}

                  {role === 'customer' && item.priceApproved && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                      <Check className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                </div>
              ))}
            </div>

            {priceApproveError && (
              <p className="text-xs text-semantic-danger font-medium">{priceApproveError}</p>
            )}

            {/* Customer 1-Tap Approve Button */}
            {role === 'customer' && !allApproved && (
              <button
                onClick={handleCustomerApprovePrice}
                disabled={!allPriced || approvingPrice}
                className="w-full h-11 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
              >
                {approvingPrice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Approving Prices...</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    <span>
                      {allPriced
                        ? `Approve Prices & Pay (₹${actGoodsTotal})`
                        : 'Waiting for helper to enter store prices...'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* INLINE CARD 4: IN-CHAT DIRECT UPI PAYMENT CARD (STAGE 3) */}
        {(allApproved || paymentData.status !== 'none' || order.status === 'purchased' || order.status === 'completed') && (
          <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border-2 border-brand-teal/40 dark:border-brand-teal/30 shadow-e2 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-border/60 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-teal" />
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-neutral-ink dark:text-neutral-dark-text">
                    UPI Payment
                  </h3>
                  <span className="text-[10px] text-neutral-secondary">
                    Pay helper directly via UPI (No platform fee)
                  </span>
                </div>
              </div>

              {/* Payment state badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  paymentData.status === 'held' || paymentData.status === 'released'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : paymentData.status === 'pending'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-neutral-surface-alt dark:bg-slate-800 text-neutral-ink dark:text-neutral-dark-text'
                }`}
              >
                {paymentData.status === 'held' || paymentData.status === 'released'
                  ? '✓ Payment Confirmed'
                  : paymentData.status === 'pending'
                  ? '⏳ Waiting for Confirmation'
                  : 'Ready to Pay'}
              </span>
            </div>

            {/* Total Amount & Price Breakdown */}
            <div className="p-3.5 rounded-card bg-neutral-surface-alt/70 dark:bg-slate-800/60 border border-neutral-border/60 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center text-xs text-neutral-secondary">
                <span>Items Total</span>
                <span className="font-mono font-semibold text-neutral-ink dark:text-neutral-dark-text">
                  ₹{paymentData.item_cost ?? actGoodsTotal}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-brand-teal">
                <span>Delivery Fee</span>
                <span className="font-mono font-semibold">
                  ₹{paymentData.helper_fee ?? order.helperFee}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-border/80 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-xs text-neutral-ink dark:text-neutral-dark-text">
                  Total to Pay
                </span>
                <span className="font-mono font-extrabold text-lg sm:text-xl text-brand-teal-dark dark:text-emerald-300">
                  ₹{finalTotal}
                </span>
              </div>
            </div>

            {/* Helper UPI ID with 1-click copy */}
            <div className="p-3 rounded-card bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] text-neutral-secondary block">Helper's UPI ID</span>
                <span className="font-mono font-bold text-neutral-ink dark:text-neutral-dark-text truncate block">
                  {serverUpiId || 'Not provided by server'}
                </span>
              </div>

              {serverUpiId && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(serverUpiId);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-btn bg-white dark:bg-slate-900 border border-neutral-border hover:bg-neutral-surface-alt text-[11px] font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                </button>
              )}
            </div>

            {/* Client-Side QR Code & UPI Deep-Link Action */}
            {upiDeepLink ? (
              <div className="flex flex-col items-center justify-center space-y-3 pt-1">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-border inline-block">
                  <ClientQrCode value={upiDeepLink} size={170} />
                </div>
                <span className="text-[11px] text-neutral-secondary text-center">
                  Scan with Google Pay, PhonePe, or Paytm
                </span>

                {/* "Pay in UPI app" Button */}
                <a
                  href={upiDeepLink}
                  className="w-full sm:w-auto px-6 h-11 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pay in UPI App (₹{finalTotal})</span>
                </a>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-neutral-secondary bg-neutral-surface-alt dark:bg-slate-800 rounded-card">
                Open your UPI app and send ₹{finalTotal} to {serverUpiId || 'the helper'}.
              </div>
            )}

            {paymentError && (
              <p className="text-xs text-semantic-danger font-medium text-center">{paymentError}</p>
            )}

            {/* Confirmation State Actions (Server-driven) */}
            <div className="pt-2 border-t border-neutral-border/60 dark:border-slate-800">
              {/* Customer Actions */}
              {role === 'customer' && (
                <>
                  {paymentData.status === 'none' ? (
                    <button
                      onClick={handleCustomerPay}
                      disabled={isPaying}
                      className="w-full h-11 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>I Have Paid ₹{finalTotal}</span>
                        </>
                      )}
                    </button>
                  ) : paymentData.status === 'pending' ? (
                    <div className="p-3 text-center rounded-card bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <strong className="block font-bold">Payment sent</strong>
                      <p className="text-[11px]">
                        Waiting for helper to check their UPI app and confirm receipt. Then they'll buy your items.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 text-center rounded-card bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <strong className="block font-bold">✓ Payment Confirmed</strong>
                      <p className="text-[11px]">
                        Helper is purchasing your items now and will bring them to {order.pickupPoint}.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Helper Actions */}
              {role === 'helper' && (
                <>
                  {paymentData.status === 'pending' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-ink dark:text-neutral-dark-text font-semibold text-center">
                        Customer sent ₹{finalTotal}. Check your UPI app to confirm:
                      </p>
                      <button
                        onClick={handleHelperConfirmPayment}
                        disabled={isConfirmingPayment}
                        className="w-full h-11 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {isConfirmingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Payment Received (₹{finalTotal})</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : paymentData.status === 'held' || paymentData.status === 'released' ? (
                    <div className="p-3 text-center rounded-card bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                      <p>
                        <strong>✓ Payment received.</strong> Please purchase the items now.
                      </p>
                      {order.status === 'accepted' && (
                        <div className="pt-2">
                          <button
                            onClick={handleMarkPurchased}
                            disabled={isMarkingPurchased}
                            className="w-full h-11 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            {isMarkingPurchased ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <PackageCheck className="w-4 h-4" />
                                <span>All Items Bought — Ready to Deliver</span>
                              </>
                            )}
                          </button>
                          {purchaseError && (
                            <p className="text-xs text-rose-600 font-medium mt-1">{purchaseError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 text-center rounded-card bg-neutral-surface-alt dark:bg-slate-800 text-xs text-neutral-secondary">
                      Waiting for customer to pay. <strong>Do not buy items until payment is received.</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* INLINE CARD 5: PURCHASED & HANDOVER OTP CARD */}
        {(order.status === 'purchased' || order.status === 'handed_over' || order.status === 'completed') && (
          <div className="p-5 rounded-panel bg-white dark:bg-neutral-dark-card border border-neutral-border dark:border-neutral-dark-border shadow-e1 space-y-4 animate-fade-in text-center">
            <div className="flex items-center justify-between border-b border-neutral-border/60 dark:border-slate-800 pb-2 text-left">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-brand-indigo" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-indigo">
                  Meet at {order.pickupPoint}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">Items Bought ✓</span>
            </div>

            {/* Customer view: Render the OTP */}
            {role === 'customer' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-secondary">
                  Meet your helper at <strong>{order.pickupPoint}</strong>. Share this 4-digit code once you get your items:
                </p>

                {order.handoverCode ? (
                  <div className="p-4 rounded-xl bg-neutral-surface-alt dark:bg-slate-900 border-2 border-dashed border-brand-indigo/40 inline-flex flex-col items-center gap-1">
                    <span className="text-[10px] text-neutral-placeholder uppercase tracking-wider font-semibold">
                      Delivery Code
                    </span>
                    <div className="font-mono font-extrabold text-3xl sm:text-4xl tracking-[0.25em] text-neutral-ink dark:text-neutral-dark-text">
                      {order.handoverCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(order.handoverCode || '');
                        setCopiedOtp(true);
                        setTimeout(() => setCopiedOtp(false), 2000);
                      }}
                      className="mt-1 text-[11px] text-brand-indigo font-semibold flex items-center gap-1 hover:underline"
                    >
                      {copiedOtp ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOtp ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 text-xs text-neutral-secondary bg-neutral-surface-alt rounded-card">
                    Code will show here once items are bought.
                  </div>
                )}
              </div>
            )}

            {/* Helper view: OTP locked or input form (Issue #28: 5 wrong = locked) */}
            {role === 'helper' && order.status === 'purchased' && (
              <div className="space-y-3 max-w-sm mx-auto">
                {isHandoverLocked ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center space-y-2.5 animate-shake">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 mx-auto flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-rose-900 dark:text-rose-200">
                        Delivery Handover Locked
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                        5 incorrect verification codes were entered. For student safety, OTP verification is locked.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('/app/report')}
                      className="px-4 py-2 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Contact Support / File Appeal</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-neutral-secondary">
                      Meet {order.customerAlias} at {order.pickupPoint} and enter their 4-digit code:
                    </p>

                    <input
                      type="text"
                      maxLength={4}
                      value={handoverInputCode}
                      onChange={(e) => {
                        setHandoverInputCode(e.target.value);
                        setHandoverError('');
                      }}
                      placeholder="••••"
                      className="w-40 h-12 mx-auto text-center font-mono font-extrabold text-2xl tracking-[0.2em] rounded-input border-2 border-brand-teal text-neutral-ink dark:text-neutral-dark-text focus:outline-none"
                    />

                    {handoverError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium text-center">
                        {handoverError}
                      </div>
                    )}

                    <button
                      onClick={handleVerifyHandover}
                      disabled={isVerifyingCode || handoverInputCode.trim().length !== 4}
                      className="w-full h-11 rounded-btn bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                    >
                      {isVerifyingCode ? 'Checking code...' : 'Confirm Delivery'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* INLINE CARD 6: COMPLETED & RATING CARD */}
        {order.status === 'completed' && (
          <div className="p-5 rounded-panel bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-emerald-900 dark:text-emerald-200">
                Order Delivered!
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Delivery complete! Thank you for using NeedIt.
              </p>
            </div>

            {/* Rating Stars Form */}
            {!ratingSubmitted ? (
              <div className="space-y-3 max-w-sm mx-auto pt-2">
                <span className="text-xs font-semibold text-neutral-secondary block">
                  Rate your experience with {role === 'customer' ? order.helperName : order.customerAlias}:
                </span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingStars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="Optional feedback..."
                  className="w-full p-2.5 rounded-input bg-white dark:bg-slate-900 border border-neutral-border text-xs"
                />
                <button
                  onClick={handleRatingSubmit}
                  disabled={isSubmittingRating}
                  className="w-full h-10 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-emerald-700 font-semibold">
                Thanks! Your review helps keep campus deliveries reliable.
              </p>
            )}
          </div>
        )}

        {/* CHAT MESSAGES STREAM */}
        <div className="space-y-3 pt-2">
          {chatData.messages.map((msg: ChatMessage) => {
            if (msg.isSystemNotice) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border/60 text-[11px] text-neutral-secondary">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe =
              (role === 'customer' && msg.senderRole === 'customer') ||
              (role === 'helper' && msg.senderRole === 'helper');

            return (
              <div
                key={msg.id}
                className={`flex flex-col chat-msg-enter ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-neutral-placeholder mb-0.5 px-1">
                  {msg.senderName} • {msg.timestamp}
                </span>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-2 ${
                    isMe
                      ? 'bg-brand-indigo text-white rounded-tr-sm shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-neutral-ink dark:text-neutral-dark-text border border-neutral-border dark:border-slate-700 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                  {/* Attached photo preview (Click to view full modal) */}
                  {msg.photoUrl && (
                    <div className="rounded-lg overflow-hidden border border-black/10 mt-1">
                      <button
                        type="button"
                        onClick={() => setZoomPhotoUrl(msg.photoUrl || null)}
                        className="block relative group"
                      >
                        <img
                          src={msg.photoUrl}
                          alt="Attached photo"
                          className="max-h-56 w-auto max-w-full rounded-lg object-cover hover:opacity-95 transition-opacity"
                        />
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> View
                        </span>
                      </button>
                    </div>
                  )}

                  {msg.qrCodeUrl && (
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <img
                        src={msg.qrCodeUrl}
                        alt="Shop QR"
                        className="w-36 h-36 object-cover rounded mx-auto"
                      />
                      <span className="text-[10px] text-neutral-secondary text-center block mt-1">
                        Cashier QR Standee
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. CHAT INPUT FOOTER WITH EASY PHOTO ATTACHMENT */}
      <footer className="sticky bottom-0 bg-white dark:bg-neutral-dark-card border-t border-neutral-border dark:border-neutral-dark-border p-3 space-y-2">
        {/* Photo attachment preview thumbnail bar */}
        {previewUrl && (
          <div className="flex items-center gap-2 p-2 bg-neutral-surface-alt dark:bg-slate-800 rounded-xl border border-neutral-border dark:border-slate-700 animate-fade-in">
            <img
              src={previewUrl}
              alt="Attachment preview"
              className="w-12 h-12 rounded-lg object-cover border border-neutral-border"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-neutral-ink dark:text-neutral-dark-text truncate block">
                {attachedFile?.name}
              </span>
              <span className="text-[10px] text-neutral-secondary">
                {attachedFile ? `${Math.round(attachedFile.size / 1024)} KB` : ''} • Ready to send
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="p-1.5 rounded-full hover:bg-neutral-border/60 text-neutral-secondary hover:text-neutral-ink"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {sendError && (
          <p className="text-xs text-semantic-danger font-medium px-1">{sendError}</p>
        )}

        {/* Input form or read-only banner */}
        {isReadOnly ? (
          <div className="p-2.5 text-center rounded-card bg-neutral-surface-alt dark:bg-slate-800 text-xs text-neutral-secondary border border-neutral-border">
            ✓ This order is completed. Chat is closed.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Photo Attachment Button (Hidden if signature returns 503 per Issue #28) */}
            {photosSupported && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`h-11 w-11 rounded-btn flex items-center justify-center border transition-colors shrink-0 ${
                  attachedFile
                    ? 'border-brand-indigo text-brand-indigo bg-brand-indigo-light'
                    : 'border-neutral-border dark:border-slate-700 text-neutral-secondary hover:text-brand-indigo hover:bg-neutral-surface-alt'
                }`}
                title="Attach photo"
                aria-label="Attach photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={role === 'customer' ? 'Type a message to helper...' : 'Type a message to customer...'}
              className="flex-1 h-11 px-3.5 rounded-input bg-neutral-surface-alt dark:bg-slate-800 border border-neutral-border dark:border-slate-700 text-xs text-neutral-ink dark:text-neutral-dark-text focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !attachedFile)}
              className="h-11 px-4 rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark active:scale-[0.98] transition-all text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
        )}
      </footer>

      {/* 4. PHOTO LIGHTBOX MODAL */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Close photo"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomPhotoUrl}
              alt="Enlarged photo"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
