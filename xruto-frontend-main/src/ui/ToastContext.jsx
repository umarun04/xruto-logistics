import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from './cn';

const ToastContext = createContext(null);

let idSeq = 0;
function nextId() {
  idSeq += 1;
  return idSeq;
}

function ToastItem({ message, variant, onDismiss }) {
  const tone =
    variant === 'success'
      ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-50'
      : variant === 'error'
        ? 'border-red-500/35 bg-red-950/90 text-red-50'
        : 'border-white/15 bg-xr-surface/95 text-xr-text';
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex max-w-[min(100vw-2rem,24rem)] items-start gap-3 rounded-card border px-4 py-3 text-sm shadow-panel backdrop-blur-md animate-fade-up',
        tone
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-control p-1 text-current opacity-60 transition hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = 'info', duration = 5000) => {
      const id = nextId();
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
      if (duration > 0) {
        window.setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      toast: {
        success: (msg, duration = 5000) => push(msg, 'success', duration),
        error: (msg, duration = 7000) => push(msg, 'error', duration),
        info: (msg, duration = 5000) => push(msg, 'info', duration),
      },
    }),
    [push]
  );

  const viewport =
    typeof document !== 'undefined' ? (
      createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:pl-24"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} message={t.message} variant={t.variant} onDismiss={() => remove(t.id)} />
          ))}
        </div>,
        document.body
      )
    ) : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {viewport}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: {
        success: () => {},
        error: () => {},
        info: () => {},
      },
    };
  }
  return ctx;
}
