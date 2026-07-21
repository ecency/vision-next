import React from "react";

// Slider chevrons render deliberately cropped viewBoxes and internalize both
// axes at their historical rendered box (12x7, formerly the global width +
// max-height clamp). Explicit height, not max-height: with no external height
// source the free axis would fall to viewBox aspect. The !important axes
// deterministically beat non-important slot/descendant rules. Permanently
// exempt from size-N tokens; see docs/icons.md.
export function SliderChevron({ direction }: { direction: "up" | "down" }) {
  return direction === "up" ? (
    <svg viewBox="6 8 12 7.41" className="slider-svg-up !w-3 !h-[7px]" data-icon-exempt="chevron">
      <path fill="currentColor" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
    </svg>
  ) : (
    <svg viewBox="6 8.59 12 7.41" className="slider-svg-down !w-3 !h-[7px]" data-icon-exempt="chevron">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
    </svg>
  );
}
