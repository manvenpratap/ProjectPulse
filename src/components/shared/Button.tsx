import React from 'react';
import clsx from 'clsx';
import { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'outline', 
  size = 'md', 
  isLoading, 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[var(--color-primary-hex)] text-[var(--color-primary-text,white)] hover:opacity-90 shadow-sm",
    outline: "bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
    ghost: "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
    danger: "bg-transparent border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500",
  };

  const sizes = {
    sm: "px-3 py-2 sm:py-1.5 min-h-[36px] sm:min-h-[32px] text-xs gap-1.5",
    md: "px-4 py-2.5 sm:py-2 min-h-[42px] sm:min-h-[38px] text-sm gap-2",
    lg: "px-6 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[44px] text-base gap-2.5",
    icon: "p-2 min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center",
  };

  return (
    <button 
      className={clsx(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        cn(baseStyles, variants[variant], sizes[size], className)
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full motion-safe:animate-spin" />
      ) : children}
    </button>
  );
};

export default Button;
