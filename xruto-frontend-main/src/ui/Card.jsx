import React from 'react';
import { cn } from './cn';

export function Card({ as: Comp = 'section', variant = 'glass', className, children, ...props }) {
  const base =
    'rounded-card border transition-all duration-300 ease-out will-change-transform';
  const variants = {
    glass:
      'glass-card ring-1 ring-inset ring-black/[0.02]',
    solid:
      'bg-white border-xr-border ' +
      'hover:-translate-y-[2px] hover:shadow-soft hover:border-xr-line ' +
      'shadow-panel ring-1 ring-inset ring-black/[0.02]',
    soft:
      'bg-xr-elevated border-xr-border ' +
      'hover:bg-white hover:border-xr-line',
    flat:
      'bg-xr-elevated border-xr-border',
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
        'flex flex-wrap items-start justify-between gap-3 border-b border-xr-line px-4 py-3.5 sm:px-5 sm:py-4',
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
