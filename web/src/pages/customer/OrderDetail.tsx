import React from 'react';
import { OrderChatView } from '../../components/orders/OrderChatView';

interface OrderDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

/**
 * Main Order Screen (Customer view)
 * Per Issue #30 and userflow-v2.md: The order thread is the main order screen,
 * equipped with a compact sticky status header, inline order-event cards,
 * readable Cloudinary photo attachment flow, and client-side QR UPI payment card.
 */
export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onNavigate }) => {
  return <OrderChatView orderId={orderId} onNavigate={onNavigate} viewerRole="customer" />;
};

export default OrderDetail;
