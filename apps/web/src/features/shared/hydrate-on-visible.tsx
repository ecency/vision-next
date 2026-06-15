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
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const { inViewport } = useInViewport(ref, { rootMargin });

  useEffect(() => {
    if (inViewport) setShown(true);
  }, [inViewport]);

  if (disabled || shown) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      onFocusCapture={() => setShown(true)}
      onTouchStart={() => setShown(true)}
    >
      {placeholder}
    </div>
  );
}
