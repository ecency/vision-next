import React from "react";

// Slider chevrons render deliberately cropped viewBoxes and are sized by the
// global slider rules, not by the icon convention. Permanently exempt from
// size-N tokens; see docs/icons.md.
export function SliderChevron({ direction }: { direction: "up" | "down" }) {
  return direction === "up" ? (
    <svg viewBox="6 8 12 7.41" className="slider-svg-up" data-icon-exempt="chevron">
      <path fill="currentColor" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
    </svg>
  ) : (
    <svg viewBox="6 8.59 12 7.41" className="slider-svg-down" data-icon-exempt="chevron">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
    </svg>
  );
}
