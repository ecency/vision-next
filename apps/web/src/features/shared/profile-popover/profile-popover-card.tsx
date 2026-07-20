"use client";

import React from "react";
import { Popover } from "@ui/popover";
import { ProfilePreview } from "@/features/shared/profile-popover/profile-preview";
import { ProfilePopoverAuthor } from "@/features/shared/profile-popover/profile-popover-author";

// The heavy half of ProfilePopover: floating-ui (useFloating), a window-resize
// listener (useWindowSize), a click-away listener and two React portals, plus
// the ProfilePreview account fetch. Split into its own module and mounted only
// once the author is hovered/focused/tapped so a feed of ~25 cards no longer
// pays this per card at hydration.
//
// Left UNCONTROLLED: `defaultShow` opens it on the same interaction that mounts
// it (so the first hover/tap isn't swallowed), while the Popover's own hover
// and click handlers keep working afterwards — passing `setShow` would put the
// Popover in its controlled path and disable click-to-reopen.
export default function ProfilePopoverCard({ author }: { author: string }) {
  return (
    <Popover
      behavior="hover"
      useMobileSheet={true}
      placement="bottom-start"
      defaultShow={true}
      directContent={<ProfilePopoverAuthor author={author} />}
      customClassName="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl w-[320px]"
    >
      <ProfilePreview username={author} />
    </Popover>
  );
}
