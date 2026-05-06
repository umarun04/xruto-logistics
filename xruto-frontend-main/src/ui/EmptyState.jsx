import React from 'react';
import { cn } from './cn';

/**
 * High-visibility empty / zero-data affordance with animated entrance.
 */
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-white/10 bg-xr-surface/30 px-6 py-12 text-center sm:py-16',
        'animate-fade-up',
        className
      )}
    >
      {icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-card border border-white/10 bg-white/[0.04] text-xr-brand animate-float">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-h3 font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-xr-muted">{description}</p>
      )}
      {action && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>
      )}
    </div>
  );
}
