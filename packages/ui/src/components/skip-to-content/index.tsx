'use client';

import { clsx } from 'clsx';

export interface SkipToContentProps {
  /** Target element ID to skip to (default: "main-content") */
  targetId?: string;
  /** Link text (default: "Skip to main content") */
  children?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkipToContent provides a keyboard-accessible link that allows users to
 * skip past navigation and go directly to main content.
 *
 * The link is visually hidden but becomes visible when focused,
 * following WCAG 2.1 accessibility guidelines.
 *
 * Features:
 * - Visually hidden until focused
 * - Keyboard accessible (Tab to reveal)
 * - Customizable target and text
 * - High contrast focus state
 *
 * @example
 * ```tsx
 * // Basic usage - add at the beginning of your layout
 * // Ensure main content has id="main-content"
 * <SkipToContent />
 * <Navigation />
 * <main id="main-content">...</main>
 *
 * // Custom target
 * <SkipToContent targetId="article-content">
 *   Skip to article
 * </SkipToContent>
 * ```
 */
export function SkipToContent({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={clsx(
        // Visually hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-[100]',
        'focus:px-4',
        'focus:py-2',
        'focus:bg-blue-600',
        'focus:text-white',
        'focus:rounded',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-400',
        'focus:ring-offset-2',
        'focus:font-medium',
        'focus:text-sm',
        className
      )}
    >
      {children}
    </a>
  );
}

export default SkipToContent;
