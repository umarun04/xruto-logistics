import React from 'react';
import { cn } from './cn';

export function Card({ as: Comp = 'section', variant = 'glass', className, children, ...props }) {
  const base =
    'rounded-card border transition-all duration-300 ease-out will-change-transform';
  const variants = {
    glass:
      'glass-card border-white/10 ' +
      'hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(0,0,0,0.65)] hover:border-white/[0.13] ' +
      'shadow-panel ring-1 ring-inset ring-white/[0.04]',
    solid:
      'bg-xr-surface border-xr-line ' +
      'hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-white/10 ' +
      'shadow-soft ring-1 ring-inset ring-white/[0.03]',
    soft:
      'bg-white/[0.025] border-white/[0.07] backdrop-blur-md ' +
      'hover:bg-white/[0.045] hover:border-white/[0.12]',
    flat:
      'bg-xr-elevated border-xr-line',
  };
  return (
    <Comp className={cn(base, variants[variant] || variants.glass, className)} {...props}>
      {children}
    </Comp>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5 sm:py-4',
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  );
}
