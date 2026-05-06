import React from 'react';
import { cn } from './cn';

/** Neutral pulse block; size via className (e.g. h-4 w-full). */
export function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-control bg-white/[0.08]', className)} {...props} />;
}
