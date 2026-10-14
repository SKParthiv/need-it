import React from 'react';
import { OrderChatView } from '../../components/orders/OrderChatView';

interface OrderDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

// Chat-first order view (issue #30): the thread is the screen, order state
// and actions live around it. Shared with the helper side (JobDetail).
export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onNavigate }) => (
  <OrderChatView orderId={orderId} onNavigate={onNavigate} viewerRole="customer" />
);
