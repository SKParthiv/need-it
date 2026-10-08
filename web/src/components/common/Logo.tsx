import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'color' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'color',
  size = 'md'
}) => {
  const sizeMap = {
    sm: { symbol: 'w-7 h-7', text: 'text-lg', rx: 'rounded-lg' },
    md: { symbol: 'w-9 h-9', text: 'text-2xl', rx: 'rounded-xl' },
    lg: { symbol: 'w-11 h-11', text: 'text-3xl', rx: 'rounded-2xl' }
  };

  const isWhite = variant === 'white';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Symbol */}
      <div
        className={`${sizeMap[size].symbol} ${sizeMap[size].rx} ${
          isWhite ? 'bg-white text-brand-indigo' : 'bg-brand-indigo text-white'
        } flex items-center justify-center font-heading font-bold shadow-sm transition-transform`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          <path
            d="M8 24V8L18 20V8H24V24L14 12V24H8Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <span
        className={`font-heading font-extrabold tracking-tight ${sizeMap[size].text} ${
          isWhite ? 'text-white' : 'text-neutral-ink dark:text-neutral-dark-text'
        }`}
      >
        NEEDIT
      </span>
    </div>
  );
};
