"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
  /**
   * Externally-driven mount, e.g. the parent card detected keyboard focus on one
   * of its (server-rendered, focusable) links and wants the deferred controls
   * available before focus reaches them.
   */
  forceShow?: boolean;
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
 * Accessibility: the rootMargin (cards mount well before the viewport, and
 * scroll-follows-focus brings a card into view as the user tabs to its links) +
 * touch (`onTouchStart`) + the parent's `forceShow` (focus on the card) keep the
 * deferred controls reachable for keyboard, screen-reader and touch users.
 * Above-the-fold cards pass `disabled` so their controls are interactive
 * immediately. The placeholder itself is NOT made focusable — that dropped focus
 * to <body> when it swapped to children on mount.
 */
export function HydrateOnVisible({
  children,
  placeholder,
  disabled = false,
  forceShow = false,
  rootMargin = "600px 0px",
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  // Stable options object so useInViewport doesn't re-create its observer.
  const options = useMemo(() => ({ rootMargin }), [rootMargin]);
  const { inViewport } = useInViewport(ref, options);

  useEffect(() => {
    if (!disabled && inViewport) setShown(true);
  }, [disabled, inViewport]);

  if (disabled || forceShow || shown) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} onTouchStart={() => setShown(true)}>
      {placeholder}
    </div>
  );
}
