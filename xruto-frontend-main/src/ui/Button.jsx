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
      'bg-gradient-to-b from-amber-400 to-[#D97706] text-black ' +
      'hover:from-amber-300 hover:to-amber-500 hover:shadow-glow-brand ' +
      'border border-amber-400/60 shadow-[0_2px_12px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
    secondary:
      'border border-white/10 bg-white/[0.04] text-xr-text ' +
      'hover:bg-white/[0.09] hover:border-white/20 hover:shadow-elevated-soft',
    ghost:
      'text-xr-secondary hover:bg-white/[0.06] hover:text-white',
    danger:
      'border border-xr-danger/30 bg-xr-danger/10 text-red-200 ' +
      'hover:bg-xr-danger/20 hover:border-xr-danger/50 hover:shadow-[0_0_16px_rgba(239,68,68,0.15)]',
    success:
      'border border-xr-success/30 bg-xr-success/10 text-emerald-200 ' +
      'hover:bg-xr-success/20 hover:border-xr-success/50',
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
