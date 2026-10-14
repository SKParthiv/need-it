import React from 'react';
import { OrderChatView } from '../../components/orders/OrderChatView';

interface JobDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

// Chat-first order view (issue #30), helper side. Shared component with
// the customer side (OrderDetail); viewerRole drives which actions render.
export const JobDetail: React.FC<JobDetailProps> = ({ orderId, onNavigate }) => (
  <OrderChatView orderId={orderId} onNavigate={onNavigate} viewerRole="helper" />
);
