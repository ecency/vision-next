'use client';

import { clsx } from 'clsx';
import type { Size } from '../../types';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: Size;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

const sizeClasses: Record<Size, string> = {
  xsmall: 'w-3 h-3',
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
  xlarge: 'w-12 h-12',
};

/**
 * Spinner displays a loading indicator animation.
 *
 * Features:
 * - Multiple size variants
 * - Accessible with customizable label
 * - CSS-based animation (no JS)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Spinner />
 *
 * // Large spinner with label
 * <Spinner size="large" label="Loading content..." />
 *
 * // Custom styling
 * <Spinner className="text-blue-500" />
 * ```
 */
export function Spinner({
  size = 'medium',
  className,
  label = 'Loading...',
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={clsx('inline-block', className)}
    >
      <svg
        className={clsx('animate-spin', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Spinner;
