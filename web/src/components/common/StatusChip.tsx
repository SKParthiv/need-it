import React from 'react';
import {
  CircleDot,
  Handshake,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Clock
} from 'lucide-react';
import { OrderStatus } from '../../types';

interface StatusChipProps {
  status: OrderStatus | 'urgent' | 'waiting_long';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'md',
  className = ''
}) => {
  const config = {
    open: {
      label: 'Open',
      icon: CircleDot,
      bg: 'bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 dark:text-brand-indigo-darkmode border-brand-indigo/20'
    },
    accepted: {
      label: 'Accepted',
      icon: Handshake,
      bg: 'bg-brand-teal-light text-brand-teal dark:bg-brand-teal/20 dark:text-emerald-400 border-brand-teal/20'
    },
    purchased: {
      label: 'Purchased',
      icon: ShoppingBag,
      bg: 'bg-semantic-info-tint text-semantic-info dark:bg-semantic-info/20 dark:text-semantic-info-dark border-semantic-info/20'
    },
    handed_over: {
      label: 'Handed over',
      icon: PackageCheck,
      bg: 'bg-semantic-handover-tint text-semantic-handover dark:bg-semantic-handover/20 dark:text-semantic-handover-dark border-semantic-handover/20'
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      bg: 'bg-semantic-success-tint text-semantic-success dark:bg-semantic-success/20 dark:text-semantic-success-dark border-semantic-success/20'
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      bg: 'bg-slate-100 text-neutral-secondary dark:bg-slate-800 dark:text-neutral-dark-secondary border-slate-300'
    },
    urgent: {
      label: 'Urgent',
      icon: Zap,
      bg: 'bg-semantic-danger-tint text-semantic-danger dark:bg-semantic-danger/20 dark:text-semantic-danger-dark border-semantic-danger/20'
    },
    waiting_long: {
      label: 'Waiting long',
      icon: Clock,
      bg: 'bg-semantic-warning-tint text-semantic-warning dark:bg-semantic-warning/20 dark:text-semantic-warning-dark border-semantic-warning/20'
    }
  };

  const item = config[status] || config.open;
  const Icon = item.icon;

  const heightClass = size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${heightClass} ${item.bg} select-none ${className}`}
    >
      <Icon
        className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
          status === 'urgent' ? 'urgent-pulse' : ''
        }`}
      />
      <span>{item.label}</span>
    </span>
  );
};
