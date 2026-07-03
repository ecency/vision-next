"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mount/unmount state machine for CSS-transition enter/exit animations —
 * the library-free replacement for AnimatePresence.
 *
 * - `mounted` gates rendering: the element stays in the DOM for
 *   `exitDurationMs` after `show` turns false so a CSS exit transition can
 *   play; unmount is timer-based, so a paused/hidden tab or an interrupted
 *   transition can never strand the element on screen.
 * - `open` drives the visual state (class/data attribute). It flips true two
 *   frames after mounting so the browser commits the closed styles first and
 *   the enter transition actually runs; flipping mid-exit smoothly reverses
 *   the close because transitions interpolate from the current value.
 *
 * Usage:
 *   const { mounted, open } = useMountTransition(show, 300);
 *   {mounted && <div className={open ? "translate-x-0" : "translate-x-full"} />}
 */
export function useMountTransition(show: boolean, exitDurationMs = 200) {
  const [mounted, setMounted] = useState(show);
  const [open, setOpen] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rafs = useRef<number[]>([]);

  useEffect(() => {
    const cancelRafs = () => {
      rafs.current.forEach((id) => cancelAnimationFrame(id));
      rafs.current = [];
    };

    if (show) {
      clearTimeout(exitTimer.current);
      setMounted(true);
      rafs.current.push(
        requestAnimationFrame(() => {
          rafs.current.push(requestAnimationFrame(() => setOpen(true)));
        })
      );
    } else {
      cancelRafs();
      setOpen(false);
      exitTimer.current = setTimeout(() => setMounted(false), exitDurationMs);
    }

    return () => {
      cancelRafs();
      clearTimeout(exitTimer.current);
    };
  }, [show, exitDurationMs]);

  return { mounted, open };
}
