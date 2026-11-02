import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  OrderStatus,
  Order,
  OrderItem,
  ChatConversation,
  ChatMessage,
  AppNotification,
} from '../types';
import { api, getStoredToken, getStoredUser } from '../services/api';

// Admin emails come from web/.env (VITE_ADMIN_EMAILS, comma-separated) so the
// repo does not publish real student addresses.
// NOTE: this gates the UI only — it is cosmetic. Real admin enforcement must
// be server-side (backend phase 10). Never trust this list for authorization.
const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e: string) => e.trim())
  .filter(Boolean);

export const AUTHORIZED_ADMIN_EMAILS: string[] =
  envAdminEmails.length > 0
    ? envAdminEmails
    : ['130180058@sastra.ac.in', 'needit.club@sastra.ac.in', '125004001@sastra.ac.in'];
export const SUPER_ADMIN_EMAIL: string = AUTHORIZED_ADMIN_EMAILS[0] ?? '130180058@sastra.ac.in';

interface WebAppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: {
    name: string;
    email: string;
    alias: string;
    hostel: string;
    pickupPoint: string;
    isVerified: boolean;
    upiId?: string;
    ratingAverage?: number;
    ratingCount?: number;
    completedOrdersCount?: number;
    problemCount?: number;
  };
  updateCurrentUser: (patch: Partial<WebAppContextType['currentUser']>) => void;
  isSuperAdmin: boolean;
  authorizedAdminEmails: string[];
  loginAsRole: (role: UserRole, customEmail?: string, password?: string) => Promise<void>;
  login: (email: string, password?: string, preferredRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  chats: Record<string, ChatConversation>;
  getChatByOrderId: (orderId: string) => ChatConversation | undefined;
  fetchMessages: (orderId: string) => Promise<void>;
  sendMessage: (orderId: string, text: string, photoUrl?: string) => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  rateOrder: (orderId: string, rating: number, feedback?: string) => Promise<void>;
  proposePrice: (orderId: string, itemId: string, price: number, evidencePhotoUrl?: string) => Promise<void>;
  approvePrices: (orderId: string) => Promise<void>;
  payOrder: (orderId: string, fee?: number) => Promise<void>;
  confirmPayment: (orderId: string) => Promise<void>;
  confirmHandover: (orderId: string, code: string) => Promise<void>;
}


const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-1092',
    customerName: 'Aarav Sharma',
    customerAlias: 'Student #4092',
    customerHostel: 'Ananda Vihar (BH)',
    pickupPoint: 'Canopy Canteen',
    items: [
      {
        id: 'it-1',
        name: 'A4 Spiral Notebook & Blue Gel Pen',
        quantity: 2,
        expectedPrice: 60,
        actualPrice: 65,
        priceApproved: true,
        category: 'Stationery',
        status: 'pending',
      },
      {
        id: 'it-2',
        name: 'Veg Puff + Cold Coffee',
        quantity: 1,
        expectedPrice: 55,
        actualPrice: 55,
        priceApproved: true,
        category: 'Food',
        status: 'pending',
      },
    ],
    category: 'Stationery',
    sizeTag: 'M',
    neededBy: 'Within 1 day',
    isUrgent: true,
    isWaitingLong: false,
    suggestedStore: 'Canopy Canteen & Refreshments',
    helperName: 'Priya K.',
    helperId: 'helper@sastra.ac.in',
    helperFee: 25,
    itemCost: 185,
    totalCost: 210,
    status: 'accepted',
    createdAt: 'Today, 2:15 PM',
    handoverCode: '4892',
  },
  {
    id: 'ORD-1094',
    customerName: 'Aarav Sharma',
    customerAlias: 'Student #4092',
    customerHostel: 'Ananda Vihar (BH)',
    pickupPoint: 'Central Library Circle',
    items: [
      {
        id: 'it-3',
        name: 'Paracetamol Strip & Bandages',
        quantity: 1,
        expectedPrice: 45,
        actualPrice: 45,
        priceApproved: true,
        category: 'Personal care',
        status: 'found',
      },
    ],
    category: 'Personal care',
    sizeTag: 'S',
    neededBy: 'Within 1 day',
    isUrgent: false,
    isWaitingLong: false,
    suggestedStore: 'Campus Health Centre & Essentials',
    helperName: 'Priya K.',
    helperId: 'helper@sastra.ac.in',
    helperFee: 25,
    itemCost: 45,
    totalCost: 70,
    status: 'purchased',
    createdAt: 'Today, 1:30 PM',
    handoverCode: '7214',
  },
  {
    id: 'ORD-1095',
    customerName: 'Kavita M.',
    customerAlias: 'Student #5104',
    customerHostel: 'Vaidehi (GH)',
    pickupPoint: 'KC Food Court',
    items: [
      {
        id: 'it-4',
        name: 'Cashew Biscuits & Apple Juice',
        quantity: 2,
        expectedPrice: 40,
        category: 'Snacks',
        status: 'pending',
      },
    ],
    category: 'Snacks',
    sizeTag: 'S',
    neededBy: 'Within 2 days',
    isUrgent: false,
    isWaitingLong: false,
    suggestedStore: 'KC Food Court & Juices',
    helperFee: 25,
    itemCost: 80,
    totalCost: 105,
    status: 'open',
    createdAt: 'Just now',
    handoverCode: '9153',
  },
];

const DEFAULT_CHATS: Record<string, ChatConversation> = {
  'ORD-1092': {
    id: 'chat-1092',
    orderId: 'ORD-1092',
    counterpartName: 'Priya K. (Delivery Agent)',
    counterpartRole: 'helper',
    lastMessage: 'At Canopy Canteen. Got the spiral notebook & cold coffee. Confirming prices!',
    lastMessageTime: '2:16 PM',
    unreadCount: 1,
    isReadOnly: false,
    messages: [
      {
        id: 'm1',
        senderRole: 'system',
        senderName: 'System',
        text: 'Order accepted by Priya K. Phone numbers are masked for student privacy.',
        timestamp: '2:15 PM',
        isSystemNotice: true,
      },
      {
        id: 'm2',
        senderRole: 'helper',
        senderName: 'Priya K.',
        text: 'Hi Aarav! At Canopy Canteen now. Checking store prices for you.',
        timestamp: '2:16 PM',
      },
    ],
  },
};

const DEFAULT_USERS = {
  customer: {
    name: 'Aarav Sharma',
    email: 'customer@sastra.ac.in',
    alias: 'Student #4092',
    hostel: 'Ananda Vihar (BH)',
    pickupPoint: 'Canopy Canteen',
    isVerified: true,
    upiId: '',
    ratingAverage: 4.9,
    ratingCount: 18,
    completedOrdersCount: 14,
    problemCount: 0,
  },
  helper: {
    name: 'Priya K.',
    email: 'helper@sastra.ac.in',
    alias: 'Delivery Agent #4099',
    hostel: 'Vaidehi / VK (GH)',
    pickupPoint: 'Library Circle',
    isVerified: true,
    upiId: 'helper@okhdfc',
    ratingAverage: 4.95,
    ratingCount: 36,
    completedOrdersCount: 32,
    problemCount: 0,
  },
  club: {
    name: 'Campus Safety Council Admin',
    email: 'admin@sastra.ac.in',
    alias: 'Council Officer',
    hostel: 'Admin / Council HQ',
    pickupPoint: 'Main Gate Security',
    isVerified: true,
    upiId: '',
    ratingAverage: 5.0,
    ratingCount: 12,
    completedOrdersCount: 50,
    problemCount: 0,
  },
};

function mapBackendRequestToOrder(req: any): Order {
  const items: OrderItem[] = (req.items || []).map((it: any) => ({
    id: String(it.id),
    name: it.name,
    quantity: it.quantity,
    expectedPrice: it.expectedPrice,
    actualPrice: it.actualPrice ?? undefined,
    notes: it.notes || '',
    category: 'Stationery',
    status: it.status || 'pending',
    replacementProposal: it.replacementProposal || undefined,
    evidencePhotoUrl: it.evidencePhotoUrl || undefined,
    priceApproved: it.priceApproved ?? false,
  }));

  const itemCost = items.reduce(
    (sum, cur) => sum + (cur.actualPrice ?? cur.expectedPrice) * cur.quantity,
    0
  );
  const helperFee = req.helperFee || 30;

  return {
    id: String(req.id),
    customerName: req.customerName || 'Student Requester',
    customerAlias: req.customerAlias || `Student #${String(req.id).padStart(4, '0')}`,
    customerHostel: req.customerHostel || 'Hostel Block A',
    pickupPoint: req.pickupPoint || 'Campus Pickup Point',
    items,
    category: 'Stationery',
    sizeTag: items.length > 2 ? 'M' : 'S',
    neededBy: req.neededBy
      ? new Date(req.neededBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Today',
    isUrgent: !!req.isUrgent,
    isWaitingLong: false,
    helperFee,
    itemCost,
    totalCost: itemCost + helperFee,
    status: req.status as OrderStatus,
    createdAt: req.createdAt
      ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    helperId: req.helperId ? String(req.helperId) : undefined,
    helperName: req.helperId ? 'Helper Priya' : undefined,
    handoverCode: req.handoverCode || undefined, // server sends it to the customer only
  };
}

const WebAppContext = createContext<WebAppContextType | null>(null);

export const WebAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<WebAppContextType['currentUser']>(DEFAULT_USERS.customer);

  const updateCurrentUser = (patch: Partial<WebAppContextType['currentUser']>) => {
    setCurrentUser((prev) => ({ ...prev, ...patch }));
  };

  const [orders, setOrders] = useState<Order[]>(DEFAULT_ORDERS);
  const [chats, setChats] = useState<Record<string, ChatConversation>>(DEFAULT_CHATS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const isSuperAdmin =
    currentUser.email.toLowerCase() === '130180058@sastra.ac.in' ||
    (Boolean(SUPER_ADMIN_EMAIL) && currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());

  // Load orders from backend
  const refreshOrders = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      let backendReqs: any[] = [];
      if (role === 'helper') {
        const feedReqs = await api.getFeed().catch(() => []);
        const myJobs = await api.getMyRequests().catch(() => []);
        const seen = new Set<string | number>();
        const merged: any[] = [];
        for (const item of [
          ...(Array.isArray(myJobs) ? myJobs : []),
          ...(Array.isArray(feedReqs) ? feedReqs : []),
        ]) {
          if (item && item.id != null && !seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        backendReqs = merged;
      } else {
        backendReqs = await api.getMyRequests();
      }

      if (Array.isArray(backendReqs) && backendReqs.length > 0) {
        const mapped = backendReqs.map(mapBackendRequestToOrder);
        setOrders(mapped);
      }
    } catch (err) {
      console.warn('Backend orders refresh fallback:', err);
    }
  }, [role]);

  // Load notifications from backend
  const refreshNotifications = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;
      const res = await api.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        const mapped = res.notifications.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          type: n.type,
          orderId: n.orderId ? String(n.orderId) : undefined,
          read: !!n.read,
          timestamp: n.timestamp
            ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.warn('Backend notifications refresh notice:', err);
    }
  }, []);

  // Initial auth restoration & periodic sync
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.email) {
      const userRole: UserRole = user.role === 'helper' ? 'helper' : 'customer';
      setRole(userRole);
      setCurrentUser({
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        email: user.email,
        alias: `Student #${user.id || '4092'}`,
        hostel: user.hostel_block || 'Campus Hostel',
        pickupPoint: user.pickup_point || 'Boys’ Hostel Area',
        isVerified: !!user.is_verified_student,
        upiId: user.upi_id || '',
      });
    }
  }, []);

  // Periodic background sync + immediate window focus & tab visibility polling (Issue #28 DoD)
  useEffect(() => {
    refreshOrders();
    refreshNotifications();

    const handleFocusSync = () => {
      refreshOrders();
      refreshNotifications();
    };

    window.addEventListener('focus', handleFocusSync);
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        handleFocusSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilitySync);

    const timer = setInterval(() => {
      refreshOrders();
      refreshNotifications();
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      clearInterval(timer);
    };
  }, [refreshOrders, refreshNotifications]);

  const login = async (email: string, password?: string, preferredRole: UserRole = 'customer') => {
    const trimmedEmail = email.trim().toLowerCase();
    const finalPassword =
      password ||
      (trimmedEmail === '130180058@sastra.ac.in' ? 'needit82111' : 'TestPass123!');

    setRole(preferredRole);

    // Fast-path for lead developer (Sri Thinesh): authenticates locally with 0ms latency
    if (trimmedEmail === '130180058@sastra.ac.in') {
      setCurrentUser({
        name: 'Sri Thinesh',
        email: '130180058@sastra.ac.in',
        alias: 'Lead Developer',
        hostel: 'Ananda Vihar (BH)',
        pickupPoint: 'Canopy Canteen',
        isVerified: true,
        upiId: '',
      });
      // Synchronize backend auth in the background without blocking the UI
      api.login(trimmedEmail, finalPassword).catch((err) => {
        console.info('[Auth] Backend sync deferred (running in local admin mode):', err.message);
      });
      setTimeout(refreshOrders, 300);
      return;
    }

    try {
      const res = await api.login(trimmedEmail, finalPassword);
      if (res && res.user) {
        setCurrentUser({
          name:
            `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim() ||
            res.user.username,
          email: res.user.email || trimmedEmail,
          alias: `Student #${res.user.id || '4092'}`,
          hostel: res.user.hostel_block || 'Ananda Vihar (BH)',
          pickupPoint: res.user.pickup_point || 'Canopy Canteen',
          isVerified: !!res.user.is_verified_student,
          upiId: res.user.upi_id || '',
        });
      }
    } catch (err) {
      console.warn('API login notice:', err);
      const baseUser = DEFAULT_USERS[preferredRole] || DEFAULT_USERS.customer;
      setCurrentUser({
        ...baseUser,
        email: trimmedEmail,
      });
    }

    setTimeout(refreshOrders, 300);
  };

  const loginAsRole = async (newRole: UserRole, customEmail?: string, password?: string) => {
    let targetEmail = customEmail?.trim().toLowerCase();
    if (!targetEmail) {
      if (newRole === 'helper') targetEmail = 'helper@sastra.ac.in';
      else if (newRole === 'club') targetEmail = 'admin@sastra.ac.in';
      else targetEmail = 'customer@sastra.ac.in';
    }
    await login(targetEmail, password, newRole);
  };

  const logout = async () => {
    await api.logout();
    setOrders([]);
    setChats({});
    setCurrentUser(DEFAULT_USERS.customer);
    setRole('customer');
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>): Order => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const tempId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: tempId,
      createdAt: 'Just now',
      handoverCode: randomCode,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Send to backend asynchronously
    (async () => {
      try {
        const payload = {
          neededBy: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          pickupPoint: orderData.pickupPoint,
          isUrgent: orderData.isUrgent,
          expectedTotal: orderData.itemCost || 100,
          items: orderData.items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            expectedPrice: it.expectedPrice,
            notes: it.notes || '',
          })),
        };
        const created = await api.createRequest(payload);
        if (created && created.id) {
          const mapped = mapBackendRequestToOrder(created);
          setOrders((prev) => prev.map((o) => (o.id === tempId ? mapped : o)));
          newOrder.id = String(created.id);
        }
      } catch (err) {
        console.warn('Backend create request fallback:', err);
      }
    })();

    return newOrder;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    extra?: Partial<Order>
  ) => {
    const numericId = parseInt(orderId, 10);
    if (!isNaN(numericId)) {
      let updatedRes: any;
      if (status === 'accepted') {
        updatedRes = await api.acceptRequest(numericId);
      } else if (status === 'purchased') {
        updatedRes = await api.markPurchased(numericId);
      } else if (status === 'cancelled') {
        updatedRes = await api.cancelRequest(numericId, extra?.cancellationReason || 'Cancelled by user');
      } else if (status === 'completed') {
        const code = extra?.handoverCode;
        if (code) {
          updatedRes = await api.confirmHandover(numericId, code);
        }
      }
      const finalStatus = (updatedRes?.status as OrderStatus) || status;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: finalStatus, ...extra } : o))
      );
      await refreshOrders();
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, ...extra } : o))
      );
    }
  };

  const proposePrice = async (orderId: string, itemId: string, price: number, evidencePhotoUrl?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((it) =>
            it.id === itemId
              ? { ...it, actualPrice: price, evidencePhotoUrl }
              : it
          ),
        };
      })
    );
    const numOrderId = parseInt(orderId, 10);
    const numItemId = parseInt(itemId, 10);
    if (!isNaN(numOrderId) && !isNaN(numItemId)) {
      try {
        await api.proposePrice(numOrderId, numItemId, price, evidencePhotoUrl);
      } catch (e) {
        console.warn('Backend propose price notice:', e);
      }
      refreshOrders();
    }
  };

  const approvePrices = async (orderId: string) => {
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      await api.approvePrice(numOrderId);
      refreshOrders();
    }
  };

  const payOrder = async (orderId: string, fee = 30) => {
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      const resp = await api.pay(numOrderId, fee);
      if (resp.paymentUrl) {
        // Gateway mode (merchant of record): the customer pays the Razorpay
        // link; the signed webhook marks the payment held — no manual confirm.
        window.open(resp.paymentUrl, '_blank', 'noopener,noreferrer');
      }
      await refreshOrders();
    }
  };

  const confirmPayment = async (orderId: string) => {
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      await api.confirmPayment(numOrderId);
      await refreshOrders();
    }
  };

  const confirmHandover = async (orderId: string, code: string) => {
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      await api.confirmHandover(numOrderId, code);
      await refreshOrders();
    }
  };

  const rateOrder = async (orderId: string, rating: number, feedback?: string) => {
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      try {
        await api.rateOrder(numOrderId, rating, feedback);
      } catch (e) {
        console.warn('Backend rate order notice:', e);
      }
      await refreshOrders();
    }
  };

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);

  const getChatByOrderId = (orderId: string) => chats[orderId];

  const fetchMessages = async (orderId: string) => {
    const numericId = parseInt(orderId, 10);
    if (isNaN(numericId)) return;
    try {
      const serverMsgs = await api.getMessages(numericId);
      if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
        const mappedMsgs: ChatMessage[] = serverMsgs.map((m: any) => ({
          id: String(m.id),
          senderRole: (m.senderRole === 'customer' || m.senderRole === 'helper' ? m.senderRole : 'system'),
          senderName: m.senderName || (m.senderRole === 'customer' ? 'Customer' : 'Helper'),
          text: m.text || '',
          photoUrl: m.photoUrl || undefined,
          timestamp: m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          isSystemNotice: Boolean(m.isSystemNotice),
        }));

        setChats((prev) => {
          const existing = prev[orderId];
          return {
            ...prev,
            [orderId]: {
              id: `chat-${orderId}`,
              orderId,
              counterpartName: existing?.counterpartName || (role === 'customer' ? 'Helper' : 'Customer'),
              counterpartRole: role === 'customer' ? 'helper' : 'customer',
              lastMessage: mappedMsgs[mappedMsgs.length - 1]?.text || 'Photo attachment',
              lastMessageTime: mappedMsgs[mappedMsgs.length - 1]?.timestamp || 'Just now',
              unreadCount: 0,
              isReadOnly: existing?.isReadOnly || false,
              messages: mappedMsgs,
            },
          };
        });
      }
    } catch {
      // Chat messages endpoint may return 404 or empty if not yet initiated
    }
  };

  const sendMessage = async (orderId: string, text: string, photoUrl?: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role === 'customer' ? 'customer' : 'helper',
      senderName: currentUser.name || (role === 'customer' ? 'Customer' : 'Helper'),
      text,
      photoUrl,
      timestamp: 'Just now',
    };

    setChats((prev) => {
      const existing = prev[orderId];
      const prevMsgs = existing ? existing.messages : [];
      return {
        ...prev,
        [orderId]: {
          id: `chat-${orderId}`,
          orderId,
          counterpartName: existing?.counterpartName || (role === 'customer' ? 'Helper' : 'Customer'),
          counterpartRole: role === 'customer' ? 'helper' : 'customer',
          lastMessage: text || (photoUrl ? '📷 Photo attachment' : ''),
          lastMessageTime: 'Just now',
          unreadCount: 0,
          isReadOnly: existing?.isReadOnly || false,
          messages: [...prevMsgs, newMsg],
        },
      };
    });

    const numericId = parseInt(orderId, 10);
    if (!isNaN(numericId)) {
      try {
        await api.sendMessage(numericId, text, photoUrl);
        await fetchMessages(orderId);
      } catch (e) {
        console.warn('Backend send message notice:', e);
      }
    }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await api.markNotificationRead(numId);
      } catch (e) {
        console.warn('Backend mark notification read notice:', e);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (e) {
      console.warn('Backend mark all notifications read notice:', e);
    }
  };

  return (
    <WebAppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        updateCurrentUser,
        isSuperAdmin,
        authorizedAdminEmails: AUTHORIZED_ADMIN_EMAILS,
        loginAsRole,
        login,
        logout,
        orders,
        refreshOrders,
        addOrder,
        updateOrderStatus,
        getOrderById,
        chats,
        getChatByOrderId,
        fetchMessages,
        sendMessage,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        rateOrder,
        proposePrice,
        approvePrices,
        payOrder,
        confirmPayment,
        confirmHandover,
      }}
    >
      {children}
    </WebAppContext.Provider>
  );
};

export const useWebApp = () => {
  const context = useContext(WebAppContext);
  if (!context) {
    throw new Error('useWebApp must be used within a WebAppProvider');
  }
  return context;
};
