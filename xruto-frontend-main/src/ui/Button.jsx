import React from 'react';
import { cn } from './cn';

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-control font-semibold ' +
    'transition-all duration-200 ease-out ' +
    'active:scale-[0.96] active:brightness-90 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-xr-brand/50 focus-visible:ring-offset-1 focus-visible:ring-offset-xr-bg ' +
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ' +
    'select-none touch-target';

  const sizes = {
    sm: 'h-9 px-3.5 text-caption',
    md: 'h-10 px-4 text-body',
    lg: 'h-11 px-5 text-h3',
  };

  const variants = {
    primary:
      'bg-xr-brand text-white ' +
      'hover:bg-xr-brandDark hover:shadow-glow-brand ' +
      'border border-transparent shadow-sm',
    secondary:
      'bg-white border border-xr-border text-xr-text ' +
      'hover:bg-xr-elevated hover:border-xr-line hover:shadow-sm',
    ghost:
      'text-xr-secondary hover:bg-xr-elevated hover:text-xr-text',
    danger:
      'border border-xr-danger/30 bg-xr-danger/10 text-xr-danger ' +
      'hover:bg-xr-danger hover:text-white',
    success:
      'border border-xr-success/30 bg-xr-success/10 text-xr-success ' +
      'hover:bg-xr-success hover:text-white',
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(base, sizes[size] || sizes.md, variants[variant] || variants.secondary, className)}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
