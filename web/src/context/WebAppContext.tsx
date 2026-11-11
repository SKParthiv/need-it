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
import { api, getStoredToken } from '../services/api';

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
    isStaff: boolean;
    ratingAverage?: number;
    ratingCount?: number;
    completedOrdersCount?: number;
    problemCount?: number;
  };
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  googleLogin: (idToken: string, role: 'customer' | 'helper') => Promise<UserRole>;
  register: (data: {
    email: string;
    password: string;
    role: 'customer' | 'helper';
    first_name?: string;
    last_name?: string;
  }) => Promise<UserRole>;
  logout: () => Promise<void>;
  updateProfile: (data: { upi_id?: string; hostel_block?: string; pickup_point?: string }) => Promise<void>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  chats: Record<string, ChatConversation>;
  getChatByOrderId: (orderId: string) => ChatConversation | undefined;
  sendMessage: (orderId: string, text: string, photoUrl?: string) => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  proposePrice: (orderId: string, itemId: string, price: number, evidencePhotoUrl?: string) => Promise<void>;
  approvePrices: (orderId: string) => Promise<void>;
  payOrder: (orderId: string, fee?: number) => Promise<void>;
  confirmPayment: (orderId: string) => Promise<void>;
  confirmHandover: (orderId: string, code: string) => Promise<void>;
}

const DEFAULT_USERS = {
  customer: {
    // Pre-login placeholder only — replaced by the real Google account the
    // moment sign-in completes. Never a fake identity.
    name: 'Guest',
    email: '',
    alias: '',
    hostel: '',
    pickupPoint: '',
    isVerified: false,
    isStaff: false,
    ratingAverage: 5.0,
    ratingCount: 0,
    completedOrdersCount: 0,
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<Record<string, ChatConversation>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const isSuperAdmin = currentUser.isStaff;

  // Load orders from backend
  const refreshOrders = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      let backendReqs: any[] = [];
      if (role === 'helper') {
        backendReqs = await api.getFeed();
      } else {
        backendReqs = await api.getMyRequests();
      }

      if (Array.isArray(backendReqs)) {
        const mapped = backendReqs.map(mapBackendRequestToOrder);
        setOrders(mapped);
      }
    } catch (err) {
      if ((err as { status?: number })?.status !== 401) {
        console.error('Backend orders refresh failed:', err);
      }
    }
  }, [role]);

  // Initial auth restoration & periodic sync
  useEffect(() => {
    const restoreSession = async () => {
      if (!getStoredToken()) return;
      try {
        applyUser(await api.getMe());
      } catch {
        setCurrentUser(DEFAULT_USERS.customer);
        setRole('customer');
      }
    };
    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sync = () => {
      if (!document.hidden) void refreshOrders();
    };
    sync();
    const timer = setInterval(sync, 5000);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [refreshOrders]);

  // Notifications: real backend feed, refreshed on a slower cadence than orders.
  const refreshNotifications = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) return;
      const res = await api.listNotifications();
      if (Array.isArray(res?.notifications)) {
        setNotifications(
          res.notifications.map((n: any) => ({
            id: String(n.id),
            title: n.title,
            message: n.message,
            timestamp: n.timestamp,
            read: !!n.read,
            orderId: n.orderId ? String(n.orderId) : undefined,
            type: n.type,
          }))
        );
      }
    } catch (err) {
      if ((err as { status?: number })?.status !== 401) {
        console.error('Backend notifications refresh failed:', err);
      }
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      if (!document.hidden) void refreshNotifications();
    };
    sync();
    const timer = setInterval(sync, 15000);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshOrders();
        void refreshNotifications();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOrders, refreshNotifications]);

  // The backend owns identity: password check, token issue, role assignment.
  // The UI only resolves which portal to show from the user the API returns.
  const applyUser = (user: any): UserRole => {
    const email = (user.email || '').toLowerCase();
    const resolved: UserRole = user.role === 'helper'
      ? 'helper'
      : 'customer';
    setRole(resolved);
    setCurrentUser({
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      email: user.email,
      alias: `Student #${user.id || ''}`,
      hostel: user.hostel_block || 'Campus Hostel',
      pickupPoint: user.pickup_point || 'Boys’ Hostel Area',
      isVerified: !!user.is_verified_student,
      upiId: user.upi_id || '',
      isStaff: !!user.is_staff,
      ratingAverage: typeof user.rating_average === 'number' ? user.rating_average : (user.ratingAverage ?? 5.0),
      ratingCount: typeof user.rating_count === 'number' ? user.rating_count : (user.ratingCount ?? 0),
      completedOrdersCount: typeof user.completed_orders_count === 'number' ? user.completed_orders_count : (user.completedOrdersCount ?? 0),
      problemCount: typeof user.problem_count === 'number' ? user.problem_count : (user.problemCount ?? 0),
    });
    return resolved;
  };

  const updateProfile = async (data: { upi_id?: string; hostel_block?: string; pickup_point?: string }) => {
    const updated = await api.updateMe(data);
    applyUser(updated);
  };

  const login = async (email: string, password: string): Promise<UserRole> => {
    const res = await api.login(email, password);
    const resolved = applyUser(res.user);
    setTimeout(refreshOrders, 300);
    return resolved;
  };

  const googleLogin = async (idToken: string, gRole: 'customer' | 'helper'): Promise<UserRole> => {
    const res = await api.googleLogin(idToken, gRole);
    const resolved = applyUser(res.user);
    setTimeout(refreshOrders, 300);
    return resolved;
  };

  const register: WebAppContextType['register'] = async (data) => {
    const res = await api.register(data);
    const resolved = applyUser(res.user);
    setTimeout(refreshOrders, 300);
    return resolved;
  };

  const logout = async () => {
    await api.logout();
    setOrders([]);
    setChats({});
    setCurrentUser(DEFAULT_USERS.customer);
    setRole('customer');
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>): Promise<Order> => {
    const created = await api.createRequest({
      neededBy: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      pickupPoint: orderData.pickupPoint,
      isUrgent: orderData.isUrgent,
      expectedTotal: orderData.itemCost,
      items: orderData.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        expectedPrice: item.expectedPrice,
        notes: item.notes || '',
      })),
    });
    const mapped = mapBackendRequestToOrder(created);
    setOrders((prev) => [mapped, ...prev.filter((order) => order.id !== mapped.id)]);
    return mapped;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    extra?: Partial<Order>
  ) => {
    const numericId = parseInt(orderId, 10);
    if (!isNaN(numericId)) {
      try {
        if (status === 'accepted') {
          await api.acceptRequest(numericId);
        } else if (status === 'purchased') {
          await api.markPurchased(numericId);
        } else if (status === 'cancelled') {
          await api.cancelRequest(numericId, extra?.cancellationReason || 'Cancelled by user');
        } else if (status === 'completed') {
          const code = extra?.handoverCode;
          if (code) {
            await api.confirmHandover(numericId, code);
          }
        }
      } catch (error) {
        throw error;
      }
      await refreshOrders();
    }
  };

  const proposePrice = async (orderId: string, itemId: string, price: number, evidencePhotoUrl?: string) => {
    const numOrderId = parseInt(orderId, 10);
    const numItemId = parseInt(itemId, 10);
    if (!isNaN(numOrderId) && !isNaN(numItemId)) {
      await api.proposePrice(numOrderId, numItemId, price, evidencePhotoUrl);
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
      if (resp.upiDeepLink) {
        window.open(resp.upiDeepLink, '_blank', 'noopener,noreferrer');
      }
      await refreshOrders();
    }
  };

  const confirmPayment = async (orderId: string) => {
    // Either side attests the out-of-band UPI transfer happened (customer:
    // "I've paid", helper: "received"). The payment turns held once BOTH
    // have confirmed — the backend owns that rule.
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      await api.confirmPayment(numOrderId);
      refreshOrders();
    }
  };

  const confirmHandover = async (orderId: string, code: string) => {
    const numOrderId = parseInt(orderId, 10);
    if (!isNaN(numOrderId)) {
      await api.confirmHandover(numOrderId, code);
      refreshOrders();
    }
  };

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);

  const getChatByOrderId = (orderId: string) => chats[orderId];

  const sendMessage = async (orderId: string, text: string, photoUrl?: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role === 'customer' ? 'customer' : 'helper',
      senderName: role === 'customer' ? currentUser.name : 'Helper Priya',
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
          counterpartName: role === 'customer' ? 'Helper Priya' : 'Customer',
          counterpartRole: role === 'customer' ? 'helper' : 'customer',
          lastMessage: text,
          lastMessageTime: 'Just now',
          unreadCount: 0,
          isReadOnly: false,
          messages: [...prevMsgs, newMsg],
        },
      };
    });

    const numericId = parseInt(orderId, 10);
    if (!isNaN(numericId)) {
      try {
        await api.sendMessage(numericId, text, photoUrl);
      } catch (e) {
        console.warn('Backend send message notice:', e);
      }
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    api.markNotificationRead(id).catch((e) =>
      console.warn('Backend mark-notification-read notice:', e)
    );
  };

  return (
    <WebAppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        isSuperAdmin,
        login,
        googleLogin,
        register,
        logout,
        updateProfile,
        orders,
        refreshOrders,
        addOrder,
        updateOrderStatus,
        getOrderById,
        chats,
        getChatByOrderId,
        sendMessage,
        notifications,
        markNotificationRead,
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
