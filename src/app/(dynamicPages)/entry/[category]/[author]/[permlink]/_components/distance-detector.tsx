"use client";

import { MutableRefObject, useCallback, useEffect } from "react";

export function useDistanceDetector<T extends Element | null>(
  entryControlsRef: MutableRefObject<T>,
  showProfileBox: boolean,
  setShowProfileBox: (v: boolean) => void
) {
  // detects distance between title and comments [...sections] sets visibility of profile card
  const detect = useCallback(() => {
    const infoCard: HTMLElement | null = document.getElementById("avatar-fixed-container");
    const top = entryControlsRef.current?.getBoundingClientRect().top || 120;

    if (infoCard != null && window.scrollY > 180 && top && !(top <= 0)) {
      infoCard.classList.replace("invisible", "visible");
      setShowProfileBox(true);
    } else if (infoCard != null && window.scrollY <= 240) {
      infoCard.classList.replace("visible", "invisible");
      setShowProfileBox(false);
    } else if (top && top <= 0 && infoCard !== null) {
      infoCard.classList.replace("visible", "invisible");
      setShowProfileBox(false);
    } else return;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", detect);
    window.addEventListener("resize", detect);

    return () => {
      window.removeEventListener("scroll", detect);
      window.removeEventListener("resize", detect);
    };
  }, [detect]);
}
