import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', animated = false, className }) => {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
  };
  
  return (
    <svg
      width={sizes[size]}
      height={sizes[size]}
      viewBox="0 0 100 100"
      className={cn("select-none", className)}
      aria-label="JATA Logo"
    >
      {/* Stylized J shape */}
      <path
        d="M30,20 L30,65 Q30,80 45,80 L70,80"
        stroke="var(--jata-text-primary)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        className={cn(
          "transition-all duration-300",
          animated && "group-hover:stroke-jata-accent-lime"
        )}
      />
      
      {/* Accent dot */}
      <circle
        cx="75"
        cy="25"
        r="8"
        fill="var(--jata-accent-lime)"
        className={cn(
          "transition-all duration-300",
          animated && "animate-pulse"
        )}
      />
    </svg>
  );
};

export default Logo;
