import React from 'react';
import { cn } from './cn';

export function Toggle({ checked, onChange, disabled, className }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition duration-200 ease-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-xr-brand' : 'bg-white/10',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition duration-200 ease-out',
          checked && 'translate-x-5'
        )}
      />
      {checked && <span aria-hidden className="absolute inset-0 rounded-full shadow-[0_0_0_4px_rgba(245,158,11,0.10)]" />}
    </button>
  );
}

