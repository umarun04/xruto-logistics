import React, { useEffect, useRef } from 'react';
import { cn } from './cn';
import { X } from 'lucide-react';

export function Modal({ open, title, description, children, onClose, className }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => panelRef.current?.focus?.(), 50);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-4 sm:px-6">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-fade-in"
        aria-label="Close dialog"
        onClick={() => onClose?.()}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full max-w-sm rounded-card border border-white/10 bg-xr-surface p-6',
          'shadow-[0_24px_60px_rgba(0,0,0,0.6)]',
          'ring-1 ring-inset ring-white/[0.05]',
          'animate-slide-up-fade',
          'focus:outline-none',
          'max-h-[90dvh] overflow-y-auto flex flex-col',
          // Full-width sheet on mobile, centered modal on sm+
          'mb-0 sm:mb-0 rounded-b-none rounded-t-[20px] sm:rounded-card',
          className
        )}
      >
        {/* Top accent line */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-px rounded-t-card bg-gradient-to-r from-transparent via-xr-brand/30 to-transparent" />

        {/* Mobile drag handle */}
        <div aria-hidden className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        {(title || description) && (
          <div className="mb-5">
            <div className="flex items-start justify-between gap-3">
              {title && (
                <h3 id="modal-title" className="font-heading text-base font-semibold text-white leading-tight">
                  {title}
                </h3>
              )}
              <button
                type="button"
                onClick={() => onClose?.()}
                className="ml-auto -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-control text-xr-muted transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {description && (
              <p className="mt-1.5 text-sm text-xr-muted leading-relaxed">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
