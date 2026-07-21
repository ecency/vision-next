import React from "react";

// The vote chevron renders a deliberately cropped viewBox (glyph fills the box
// edge to edge) and is sized by the btn-vote mixin / global slider rules, not by
// the icon convention. Permanently exempt from size-N tokens; see docs/icons.md.
export function VoteChevron() {
  return (
    <svg viewBox="6 8 12 7.41" className="vote-svg" data-icon-exempt="chevron">
      <path fill="currentColor" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
    </svg>
  );
}
