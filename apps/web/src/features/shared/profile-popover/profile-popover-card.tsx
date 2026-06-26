"use client";

import React from "react";
import { Popover } from "@ui/popover";
import { ProfilePreview } from "@/features/shared/profile-popover/profile-preview";
import { PROFILE_POPOVER_AUTHOR_CLASS } from "@/features/shared/profile-popover/consts";

interface Props {
  author: string;
  show: boolean;
  setShow: (v: boolean) => void;
}

// The heavy half of ProfilePopover: floating-ui (useFloating), a window-resize
// listener (useWindowSize), a click-away listener and two React portals, plus
// the ProfilePreview account fetch. Split into its own module and mounted only
// once the author is hovered/focused so a feed of ~25 cards no longer pays this
// per card at hydration. `show` is driven by the parent so the very first hover
// (which mounts this) also opens the preview.
export default function ProfilePopoverCard({ author, show, setShow }: Props) {
  return (
    <Popover
      behavior="hover"
      useMobileSheet={true}
      placement="bottom-start"
      show={show}
      setShow={setShow}
      directContent={<div className={PROFILE_POPOVER_AUTHOR_CLASS}>{author}</div>}
      customClassName="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl w-[320px]"
    >
      <ProfilePreview username={author} />
    </Popover>
  );
}
