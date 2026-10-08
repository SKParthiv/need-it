export type UserRole = 'customer' | 'helper' | 'club';

export type OrderStatus =
  | 'open'
  | 'accepted'
  | 'purchased'
  | 'handed_over'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  expectedPrice: number;
  actualPrice?: number;
  notes?: string;
  category: string;
  status: 'pending' | 'found' | 'unavailable' | 'replaced';
  replacementProposal?: {
    name: string;
    price: number;
    photoUrl: string;
    reason: string;
    approved?: boolean;
  };
}

export interface Order {
  id: string;
  customerName: string;
  customerAlias: string;
  customerHostel: string;
  pickupPoint: string;
  items: OrderItem[];
  category: 'Food' | 'Snacks' | 'Personal care' | 'Stationery' | 'Academic supplies';
  sizeTag: 'S' | 'M' | 'L';
  neededBy: string; // e.g. "Today, 6:30 PM"
  isUrgent: boolean;
  isWaitingLong: boolean;
  suggestedStore?: string;
  helperFee: number;
  itemCost: number;
  totalCost: number;
  status: OrderStatus;
  createdAt: string;
  helperId?: string;
  helperName?: string;
  handoverCode: string;
  cancellationReason?: string;
  ratingGiven?: number;
  ratingFeedback?: string;
}

export interface ChatMessage {
  id: string;
  senderRole: 'customer' | 'helper' | 'system';
  senderName: string;
  text: string;
  photoUrl?: string;
  qrCodeUrl?: string;
  timestamp: string;
  isSystemNotice?: boolean;
}

export interface ChatConversation {
  id: string;
  orderId: string;
  counterpartName: string;
  counterpartRole: 'customer' | 'helper';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  isReadOnly: boolean;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  distance: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  popularItems: { name: string; estimatedPrice: number }[];
  verifiedByClub: boolean;
  submittedByHelper?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  type: 'accepted' | 'item_unavailable' | 'price_change' | 'ready_for_pickup' | 'completed' | 'broadcast';
}

export interface ClubReport {
  id: string;
  orderReference: string;
  reporterName: string;
  reporterRole: 'customer' | 'helper';
  issueType: 'Item missing or damaged' | 'Price dispute' | 'No-show at handover' | 'Inappropriate behavior' | 'Other';
  details: string;
  photoUrl?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved';
  createdAt: string;
  timeline: { step: string; timestamp: string; note: string }[];
}

export interface CampusUser {
  id: string;
  name: string;
  collegeEmail: string;
  hostelBlock: string;
  role: UserRole;
  isVerified: boolean;
  status: 'Active' | 'Suspended';
  ordersCount: number;
  joinedDate: string;
}

export interface AvailabilityWindow {
  id: string;
  date: string;
  timeWindow: string;
  preset: 'Today evening' | 'Weekend' | 'Custom';
  status: 'Active' | 'Completed' | 'Cancelled';
}
