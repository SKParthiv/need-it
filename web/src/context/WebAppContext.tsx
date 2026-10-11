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

export const AUTHORIZED_ADMIN_EMAILS: string[] = envAdminEmails;
export const SUPER_ADMIN_EMAIL: string = AUTHORIZED_ADMIN_EMAILS[0] ?? '';

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
  };
  isSuperAdmin: boolean;
  authorizedAdminEmails: string[];
  loginAsRole: (role: UserRole, customEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  chats: Record<string, ChatConversation>;
  getChatByOrderId: (orderId: string) => ChatConversation | undefined;
  sendMessage: (orderId: string, text: string) => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  proposePrice: (orderId: string, itemId: string, price: number) => Promise<void>;
  approvePrices: (orderId: string) => Promise<void>;
  payOrder: (orderId: string, fee?: number) => Promise<void>;
  confirmHandover: (orderId: string, code: string) => Promise<void>;
}

const DEFAULT_USERS = {
  customer: {
    name: 'Aarav Sharma',
    email: 'customer@sastra.ac.in',
    alias: 'Student #4092',
    hostel: 'Hostel Block A, Room 312',
    pickupPoint: 'Boys’ Hostel Area',
    isVerified: true,
  },
  helper: {
    name: 'Priya K.',
    email: 'helper@sastra.ac.in',
    alias: 'Delivery Agent #4099',
    hostel: 'Girls’ Hostel Area',
    pickupPoint: 'Girls’ Hostel Area',
    isVerified: true,
  },
  club: {
    name: 'Campus Safety Council Admin',
    email: 'admin@sastra.ac.in',
    alias: 'Council Officer',
    hostel: 'Admin / Dev HQ',
    pickupPoint: 'ASK Building / Fountain Area',
    isVerified: true,
  },
  superAdmin: {
    name: 'Sri Thinesh',
    email: '130180058@sastra.ac.in',
    alias: 'Developer & Super Admin',
    hostel: 'Admin / Dev HQ',
    pickupPoint: 'ASK Building / Fountain Area',
    isVerified: true,
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
    handoverCode: req.handoverCode || '4092',
  };
}

const WebAppContext = createContext<WebAppContextType | null>(null);

export const WebAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS.customer);

  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<Record<string, ChatConversation>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const isSuperAdmin = currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

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
      console.warn('Backend orders refresh fallback:', err);
    }
  }, [role]);

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
      });
    }
  }, []);

  useEffect(() => {
    refreshOrders();
    const timer = setInterval(refreshOrders, 5000);
    return () => clearInterval(timer);
  }, [refreshOrders]);

  const loginAsRole = async (newRole: UserRole, customEmail?: string) => {
    setRole(newRole);
    let targetEmail = customEmail?.trim().toLowerCase();

    if (!targetEmail) {
      if (newRole === 'helper') targetEmail = 'helper@sastra.ac.in';
      else if (newRole === 'club') targetEmail = 'admin@sastra.ac.in';
      else targetEmail = 'customer@sastra.ac.in';
    }

    try {
      const res = await api.quickLoginAs(
        newRole === 'helper' ? 'helper' : 'customer',
        targetEmail
      );
      if (res && res.user) {
        setCurrentUser({
          name: `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim() || res.user.username,
          email: res.user.email,
          alias: `Student #${res.user.id || '4092'}`,
          hostel: res.user.hostel_block || 'Campus Hostel',
          pickupPoint: res.user.pickup_point || 'Boys’ Hostel Area',
          isVerified: !!res.user.is_verified_student,
        });
      }
    } catch (err) {
      console.warn('API login notice:', err);
      const baseUser = DEFAULT_USERS[newRole] || DEFAULT_USERS.customer;
      setCurrentUser({
        ...baseUser,
        email: targetEmail,
      });
    }

    setTimeout(refreshOrders, 300);
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
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, ...extra } : o))
    );

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
          const code = extra?.handoverCode || '4092';
          await api.confirmHandover(numericId, code);
        }
      } catch (err) {
        console.warn(`Backend update status error for ${orderId}:`, err);
      }
      refreshOrders();
    }
  };

  const proposePrice = async (orderId: string, itemId: string, price: number) => {
    const numOrderId = parseInt(orderId, 10);
    const numItemId = parseInt(itemId, 10);
    if (!isNaN(numOrderId) && !isNaN(numItemId)) {
      await api.proposePrice(numOrderId, numItemId, price);
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
      await api.pay(numOrderId, fee);
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

  const sendMessage = async (orderId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role === 'customer' ? 'customer' : 'helper',
      senderName: role === 'customer' ? currentUser.name : 'Helper Priya',
      text,
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
        await api.sendMessage(numericId, text);
      } catch (e) {
        console.warn('Backend send message notice:', e);
      }
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <WebAppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        isSuperAdmin,
        authorizedAdminEmails: AUTHORIZED_ADMIN_EMAILS,
        loginAsRole,
        logout,
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
