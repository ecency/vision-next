"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` while the user is scrolling DOWN (so sticky bars can slide away)
 * and `false` when scrolling up or near the top — the same behaviour mobile
 * browsers use for their own toolbars. rAF-throttled, passive listener.
 *
 * @param threshold  minimum px delta before toggling (debounces jitter)
 * @param topOffset  always reveal while within this many px of the top
 */
export function useHideOnScroll(threshold = 8, topOffset = 56) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y < topOffset) {
        setHidden(false);
      } else {
        const delta = y - lastY;
        if (delta > threshold) {
          setHidden(true);
        } else if (delta < -threshold) {
          setHidden(false);
        }
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset]);

  return hidden;
}
