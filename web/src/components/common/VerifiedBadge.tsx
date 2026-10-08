import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  label?: string;
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  label = 'Verified student',
  showText = true,
  className = '',
  size = 'md'
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium text-brand-indigo dark:text-brand-indigo-darkmode bg-brand-indigo-light dark:bg-brand-indigo/15 rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      title="College email verified student"
    >
      <ShieldCheck className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {showText && <span>{label}</span>}
    </span>
  );
};
