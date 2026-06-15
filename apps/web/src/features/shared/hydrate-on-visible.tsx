"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useInViewport } from "react-in-viewport";

interface Props {
  children: ReactNode;
  /**
   * Rendered on the server AND the first client paint (so SSR and hydration
   * agree), then swapped for `children` once the element is near the viewport.
   * Must reserve the children's HEIGHT to avoid layout shift on swap.
   */
  placeholder: ReactNode;
  /** When true, render `children` immediately (e.g. above-the-fold cards). */
  disabled?: boolean;
  /** How early (before entering the viewport) to mount. */
  rootMargin?: string;
  className?: string;
  /**
   * Accessible name for the placeholder while deferred. Makes the wrapper
   * keyboard-focusable so a keyboard/screen-reader user who tabs to it mounts
   * the real subtree (a backstop to the rootMargin + scroll-follows-focus).
   */
  ariaLabel?: string;
}

/**
 * Defers mounting an interactive subtree until it is near the viewport, keeping
 * the up-front hydration cost off the critical path for long lists.
 *
 * Hydration-safe by construction: the render branches on `shown` (state that
 * starts false and only flips inside an effect), NOT on `inViewport` directly,
 * so the server and the first client render both produce `placeholder` — no
 * mismatch. `react-in-viewport`'s observer attaches in a post-paint effect, the
 * same primitive DetectBottom already uses inside SSR'd lists.
 *
 * Accessibility: keyboard (focus) and touch also mount the real subtree, so
 * off-screen controls reached by tabbing/touch are never dead. Above-the-fold
 * cards pass `disabled` so their controls are interactive immediately.
 */
export function HydrateOnVisible({
  children,
  placeholder,
  disabled = false,
  rootMargin = "600px 0px",
  className,
  ariaLabel
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const { inViewport } = useInViewport(ref, { rootMargin });

  useEffect(() => {
    if (!disabled && inViewport) setShown(true);
  }, [disabled, inViewport]);

  if (disabled || shown) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  // Placeholder is keyboard-focusable (tabIndex=0) so focus/touch mounts the
  // real controls; combined with the rootMargin this keeps the deferred
  // controls reachable for keyboard, screen-reader and touch users.
  return (
    <div
      ref={ref}
      className={className}
      tabIndex={0}
      aria-label={ariaLabel}
      onFocus={() => setShown(true)}
      onTouchStart={() => setShown(true)}
    >
      {placeholder}
    </div>
  );
}
