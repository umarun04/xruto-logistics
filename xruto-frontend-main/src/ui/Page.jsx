import React from 'react';
import { cn } from './cn';

export function Page({ size = 'xl', className, children }) {
  const maxW =
    size === 'sm'
      ? 'max-w-2xl'
      : size === 'md'
        ? 'max-w-3xl'
        : size === 'lg'
          ? 'max-w-7xl'
          : 'max-w-[1600px]';

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('mx-auto w-full px-4 sm:px-6 md:px-8', maxW)}>{children}</div>
    </div>
  );
}

export function PageHeader({ kicker, title, subtitle, right, sticky = true, className }) {
  const header = (
    <div className={cn('py-4 md:py-5', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {kicker && <p className="text-[11px] font-medium uppercase tracking-wider text-xr-subtle">{kicker}</p>}
          {title && <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>}
          {subtitle && <p className="mt-0.5 max-w-2xl text-sm text-xr-subtle">{subtitle}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{right}</div>}
      </div>
    </div>
  );

  if (!sticky) return header;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-xr-bg/70 shadow-[0_1px_0_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-xr-brand/40 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-8">{header}</div>
    </header>
  );
}

