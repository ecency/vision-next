"use client";

import React, { useCallback, useState } from "react";
import "./index.scss";
import { Entry } from "@/entities";
import ProfilePopoverCard from "@/features/shared/profile-popover/profile-popover-card";
import { PROFILE_POPOVER_AUTHOR_CLASS } from "@/features/shared/profile-popover/consts";

// The author label must stay in the server HTML (SEO + zero layout shift), but
// the hover card around it (floating-ui, a resize listener, a click-away
// listener, two portals and the ProfilePreview fetch) is only ever needed once
// the author is actually hovered/focused. On a feed/profile that wrapper was
// mounting eagerly on every one of ~25 cards at hydration. Defer it: render
// just the label until the first interaction, then mount the real Popover (and
// open it immediately via the shared `show` state so the first hover isn't
// swallowed). Below-the-fold cards that are never hovered pay nothing.
export const ProfilePopover = ({ entry }: { entry: Entry }) => {
  const author = entry.original_entry ? entry.original_entry.author : entry.author;
  const [armed, setArmed] = useState(false);
  const [show, setShow] = useState(false);

  const arm = useCallback(() => {
    setArmed(true);
    setShow(true);
  }, []);

  if (!armed) {
    // Desktop arms on hover/focus; touch arms on a deliberate tap (onClick, not
    // onTouchStart — the latter would fire mid-scroll when a finger merely
    // starts on the label and pop the mobile sheet by accident).
    return (
      <div role="presentation" onMouseEnter={arm} onFocus={arm} onClick={arm}>
        <div className={PROFILE_POPOVER_AUTHOR_CLASS}>{author}</div>
      </div>
    );
  }

  return <ProfilePopoverCard author={author} show={show} setShow={setShow} />;
};
