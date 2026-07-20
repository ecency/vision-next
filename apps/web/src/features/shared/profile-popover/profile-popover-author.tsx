import React from "react";
import { ProBadge } from "@/features/pro";
import { PROFILE_POPOVER_AUTHOR_CLASS } from "@/features/shared/profile-popover/consts";

// The author label shared by the un-armed ProfilePopover and the mounted hover
// card, so both render identically and arming on hover shifts nothing. Every
// feed card, comment and discover row funnels through here, which makes it the
// single place a Pro checkmark has to be added to cover all of them.
//
// ProBadge is inline-flex + align-middle and returns null for non-members, so
// it flows after the handle without turning this into a flex row (the label is
// also used as Popover `directContent`, where a block-level child would change
// the trigger's box).
export function ProfilePopoverAuthor({ author }: { author: string }) {
  return (
    <div className={PROFILE_POPOVER_AUTHOR_CLASS}>
      {author}
      <ProBadge username={author} className="ml-1" />
    </div>
  );
}
