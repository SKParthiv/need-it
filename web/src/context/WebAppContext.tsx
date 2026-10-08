import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  OrderStatus,
  Order,
  ChatConversation,
  ChatMessage,
  AppNotification,
} from '../types';
import { campusPickupPoints } from '../data/mockData';

export const SUPER_ADMIN_EMAIL = '130180058@sastra.ac.in';
export const AUTHORIZED_ADMIN_EMAILS = [
  '130180058@sastra.ac.in', // Lead Developer & Super Admin
  'needit.club@sastra.ac.in', // Campus Safety Council Admin
  '125004001@sastra.ac.in', // Student Council Representative
];

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
  loginAsRole: (role: UserRole, customEmail?: string) => void;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => void;
  getOrderById: (orderId: string) => Order | undefined;
  chats: Record<string, ChatConversation>;
  getChatByOrderId: (orderId: string) => ChatConversation | undefined;
  sendMessage: (orderId: string, text: string) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
}

const DEFAULT_USERS = {
  customer: {
    name: 'Aarav Sharma',
    email: '125004092@sastra.ac.in',
    alias: 'Student #4092',
    hostel: 'Hostel Block A, Room 312',
    pickupPoint: 'Boys’ Hostel Area',
    isVerified: true,
  },
  helper: {
    name: 'Priya K.',
    email: '125004099@sastra.ac.in',
    alias: 'Delivery Agent #4099',
    hostel: 'Girls’ Hostel Area',
    pickupPoint: 'Girls’ Hostel Area',
    isVerified: true,
  },
  club: {
    name: 'Campus Safety Council Admin',
    email: 'needit.club@sastra.ac.in',
    alias: 'Council Officer',
    hostel: 'Department Blocks',
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

const WebAppContext = createContext<WebAppContextType | null>(null);

export const WebAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS.customer);

  // Clean empty initial state - zero placeholder orders, deliveries or chats
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<Record<string, ChatConversation>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const isSuperAdmin = currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const loginAsRole = (newRole: UserRole, customEmail?: string) => {
    setRole(newRole);
    const targetEmail = (customEmail || (DEFAULT_USERS[newRole] || DEFAULT_USERS.customer).email).toLowerCase().trim();
    
    if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setCurrentUser(DEFAULT_USERS.superAdmin);
    } else {
      const baseUser = DEFAULT_USERS[newRole] || DEFAULT_USERS.customer;
      setCurrentUser({
        ...baseUser,
        email: targetEmail,
      });
    }
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'handoverCode'>): Order => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newId = `ORD-${Math.floor(1100 + Math.random() * 8900)}`;
    const newOrder: Order = {
      ...orderData,
      id: newId,
      createdAt: 'Just now',
      handoverCode: randomCode,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Create chat conversation
    const newChat: ChatConversation = {
      id: `chat-${newId}`,
      orderId: newId,
      counterpartName: 'Awaiting Helper',
      counterpartRole: 'helper',
      lastMessage: 'Order broadcasted. Chat unlocks when a helper accepts.',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isReadOnly: false,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderRole: 'system',
          senderName: 'System',
          text: `Request #${newId} posted for ${newOrder.items.length} item(s) at ${newOrder.pickupPoint}. Phone numbers masked by default for student privacy.`,
          timestamp: 'Just now',
          isSystemNotice: true,
        },
      ],
    };

    setChats((prev) => ({
      ...prev,
      [newId]: newChat,
    }));

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, extra?: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, ...extra } : o))
    );
  };

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);

  const getChatByOrderId = (orderId: string) => chats[orderId];

  const sendMessage = (orderId: string, text: string) => {
    const currentOrder = getOrderById(orderId);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role === 'customer' ? 'customer' : 'helper',
      senderName: role === 'customer' ? currentUser.name : 'Helper Priya',
      text,
      timestamp: 'Just now',
    };

    setChats((prev) => {
      const existing = prev[orderId];
      if (!existing) return prev;
      return {
        ...prev,
        [orderId]: {
          ...existing,
          lastMessage: text,
          lastMessageTime: 'Just now',
          messages: [...existing.messages, newMsg],
        },
      };
    });
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
        orders,
        addOrder,
        updateOrderStatus,
        getOrderById,
        chats,
        getChatByOrderId,
        sendMessage,
        notifications,
        markNotificationRead,
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
