import React from "react";

// The vote chevron renders a deliberately cropped viewBox (glyph fills the box
// edge to edge) and internalizes both axes at its historical rendered box
// (8x6, formerly btn-vote mixin height clamped by the global max-height rule).
// The !important axes deterministically beat non-important slot/descendant
// rules. Permanently exempt from size-N tokens; see docs/icons.md.
export function VoteChevron() {
  return (
    <svg viewBox="6 8 12 7.41" className="vote-svg !w-2 !h-[6px]" data-icon-exempt="chevron">
      <path fill="currentColor" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
    </svg>
  );
}
