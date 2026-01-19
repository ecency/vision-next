'use client';

import { clsx } from 'clsx';

export interface SkeletonProps {
  /** Width of the skeleton (CSS value or Tailwind class) */
  width?: string;
  /** Height of the skeleton (CSS value or Tailwind class) */
  height?: string;
  /** Whether to use rounded corners */
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton items to render */
  count?: number;
}

const roundedClasses = {
  true: 'rounded',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

/**
 * Skeleton displays a placeholder loading animation.
 *
 * Features:
 * - Customizable dimensions
 * - Multiple rounding options
 * - Can render multiple skeletons
 * - Animated pulse effect
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton width="w-full" height="h-4" />
 *
 * // Avatar skeleton
 * <Skeleton width="w-10" height="h-10" rounded="full" />
 *
 * // Multiple lines
 * <Skeleton width="w-full" height="h-4" count={3} />
 * ```
 */
export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
  className,
  count = 1,
}: SkeletonProps) {
  const roundedClass =
    typeof rounded === 'boolean'
      ? rounded
        ? roundedClasses.true
        : ''
      : roundedClasses[rounded];

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        width,
        height,
        roundedClass,
        count > 1 && i < count - 1 && 'mb-2',
        className
      )}
      aria-hidden="true"
    />
  ));

  return count === 1 ? skeletons[0] : <div>{skeletons}</div>;
}

export default Skeleton;
