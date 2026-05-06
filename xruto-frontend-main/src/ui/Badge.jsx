import React from 'react';
import { cn } from './cn';

export function Badge({ variant = 'neutral', className, children, ...props }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold';
  const variants = {
    neutral: 'border-white/10 bg-white/[0.03] text-xr-muted',
    brand: 'border-xr-brand/25 bg-xr-brand/10 text-amber-200',
    success: 'border-xr-success/25 bg-xr-success/10 text-emerald-200',
    danger: 'border-xr-danger/25 bg-xr-danger/10 text-red-200',
    info: 'border-xr-info/25 bg-xr-info/10 text-blue-200',
  };
  return (
    <span className={cn(base, variants[variant] || variants.neutral, className)} {...props}>
      {children}
    </span>
  );
}

