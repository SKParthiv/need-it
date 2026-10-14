import React from 'react';
import { OrderChatView } from '../../components/orders/OrderChatView';

interface JobDetailProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

/**
 * Main Job Screen (Helper view)
 * Per Issue #30 and userflow-v2.md: The order thread is the main order screen for helpers too,
 * featuring a compact sticky status header, inline shelf price proposal & evidence cards,
 * UPI payment receipt confirmation, OTP entry, and photo messaging.
 */
export const JobDetail: React.FC<JobDetailProps> = ({ orderId, onNavigate }) => {
  return <OrderChatView orderId={orderId} onNavigate={onNavigate} viewerRole="helper" />;
};

export default JobDetail;
