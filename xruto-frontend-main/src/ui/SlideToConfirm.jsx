import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from './cn';
import { ChevronRight, Check } from 'lucide-react';

export function SlideToConfirm({
  onConfirm,
  disabled = false,
  loading = false,
  label = 'Slide to confirm',
  loadingLabel = 'Processing…',
}) {
  const trackRef = useRef(null);
  const thumbSize = 48;
  const padding = 4;
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const getMaxX = useCallback(
    () => (trackRef.current ? trackRef.current.offsetWidth - thumbSize - padding * 2 : 200),
    []
  );

  const handleStart = useCallback(
    (clientX) => {
      if (!disabled && !loading && !confirmed) setIsDragging(true);
      if (trackRef.current && clientX) {
        const rect = trackRef.current.getBoundingClientRect();
        setDragX(Math.min(Math.max(0, clientX - rect.left - thumbSize / 2 - padding), getMaxX()));
      }
    },
    [disabled, loading, confirmed, getMaxX]
  );

  const handleMove = useCallback(
    (clientX) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      setDragX(Math.min(Math.max(0, clientX - rect.left - thumbSize / 2 - padding), getMaxX()));
    },
    [isDragging, getMaxX]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX / getMaxX() >= 0.82) {
      setConfirmed(true);
      setDragX(getMaxX());
      onConfirm?.();
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, getMaxX, onConfirm]);

  useEffect(() => {
    let t;
    if (!loading) {
      if (confirmed) {
        // If confirmed but not loading, either validation failed instantly
        // or the request just finished. Wait 800ms, then auto-reset.
        t = setTimeout(() => {
          setConfirmed(false);
          setDragX(0);
        }, 800);
      } else {
        setConfirmed(false);
        setDragX(0);
      }
    }
    return () => clearTimeout(t);
  }, [loading, confirmed]);

  useEffect(() => {
    if (!isDragging) return;
    const mm = (e) => handleMove(e.clientX);
    const tm = (e) => handleMove(e.touches[0].clientX);
    const mu = () => handleEnd();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: true });
    window.addEventListener('touchend', mu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', mu);
    };
  }, [isDragging, handleMove, handleEnd]);

  const progress = getMaxX() > 0 ? dragX / getMaxX() : 0;

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative h-14 select-none overflow-hidden rounded-full border transition-all duration-300',
        'bg-gradient-to-r from-xr-surface to-xr-elevated',
        'shadow-inner ring-1 ring-inset ring-white/[0.06]',
        confirmed
          ? 'border-emerald-500/40 shadow-glow-success'
          : 'border-xr-brand/25 hover:border-xr-brand/40',
        (disabled || loading) && 'opacity-55 grayscale-[40%] cursor-not-allowed'
      )}
      onTouchStart={(e) => { e.preventDefault(); handleStart(e.touches[0].clientX); }}
      onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX); }}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
    >
      {/* Track fill indicator */}
      {!loading && !confirmed && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-xr-brand/[0.07] transition-none"
          style={{ width: `${Math.min(progress * 100, 100)}%`, transition: isDragging ? 'none' : 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      )}

      {/* Label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'text-sm font-semibold transition-all duration-300 select-none',
            confirmed ? 'opacity-0 scale-90' : 'opacity-100',
            loading ? 'text-xr-brand animate-pulse-slow' : 'text-xr-secondary'
          )}
        >
          {loading ? loadingLabel : label}
        </span>
      </div>

      {/* Success state */}
      {confirmed && !loading && (
        <div className="absolute inset-0 flex items-center justify-center animate-scale-up-sm">
          <div className="flex items-center gap-2 text-emerald-300">
            <Check className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-sm font-semibold">Done!</span>
          </div>
        </div>
      )}

      {/* Thumb / knob */}
      {!loading && (
        <div
          className={cn(
            'absolute left-1 top-1 z-10 flex h-12 w-12 cursor-grab items-center justify-center rounded-full',
            'active:cursor-grabbing',
            confirmed
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-glow-success'
              : 'bg-gradient-to-br from-amber-400 to-[#B45309] shadow-glow-brand',
            'text-black border border-white/20',
            'transition-shadow duration-200',
            isDragging && 'scale-105'
          )}
          style={{
            transform: `translateX(${dragX}px)${isDragging ? ' scale(1.06)' : ''}`,
            transition: isDragging
              ? 'transform 0ms, box-shadow 200ms'
              : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms',
          }}
        >
          {confirmed
            ? <Check className="h-5 w-5" strokeWidth={2.5} />
            : <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          }
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-xr-brand/25 border-t-xr-brand" />
        </div>
      )}
    </div>
  );
}
