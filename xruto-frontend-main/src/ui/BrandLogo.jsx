import { cn } from './cn';

/** Uses `/brand-icon.svg` (from repo root `route-optimizer-icon.svg`, copied to `public/`). */
export function BrandLogo({ className = 'h-9 w-9', alt = 'xRuto' }) {
  return (
    <img
      src="/brand-icon.svg"
      alt={alt}
      className={cn('shrink-0 object-contain [image-rendering:auto]', className)}
    />
  );
}
