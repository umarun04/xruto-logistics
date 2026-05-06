import React from 'react';
import { Card } from './Card';
import { cn } from './cn';

export function StatCard({ icon, label, value, hint, trend, tone = 'neutral', className }) {
  const tones = {
    neutral: 'text-xr-text',
    brand: 'text-amber-300',
    success: 'text-emerald-300',
    info: 'text-blue-300',
    danger: 'text-red-300',
  };

  const iconTones = {
    neutral: 'text-xr-secondary border-white/10 bg-white/[0.04]',
    brand: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
    success: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
    info: 'text-blue-300 border-blue-500/20 bg-blue-500/10',
    danger: 'text-red-300 border-red-500/20 bg-red-500/10',
  };

  return (
    <Card variant="glass" className={cn('p-5 group', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-control border transition-all duration-300',
                'group-hover:scale-110',
                iconTones[tone] || iconTones.neutral
              )}
            >
              {icon}
            </div>
          )}
          <div>
            <p className="text-caption uppercase tracking-wider text-xr-muted">{label}</p>
            {hint && <p className="mt-0.5 text-xs text-xr-muted">{hint}</p>}
          </div>
        </div>
        {trend && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-xr-secondary">
            {trend}
          </span>
        )}
      </div>

      <div className={cn('mt-4 font-heading text-3xl font-semibold tracking-tight tabular-nums', tones[tone] || tones.neutral)}>
        {value}
      </div>

      {/* Bottom accent line colored by tone */}
      <div
        className={cn(
          'absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          tone === 'brand' ? 'bg-amber-400/40' :
          tone === 'success' ? 'bg-emerald-400/40' :
          tone === 'info' ? 'bg-blue-400/40' :
          tone === 'danger' ? 'bg-red-400/40' :
          'bg-white/10'
        )}
        aria-hidden
      />
    </Card>
  );
}
