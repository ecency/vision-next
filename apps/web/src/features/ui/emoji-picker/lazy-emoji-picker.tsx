"use client";

import dynamic from "next/dynamic";

export const EmojiPicker = dynamic(
  () => import("./index").then((m) => ({ default: m.EmojiPicker })),
  {
    ssr: false,
    // No loading placeholder: the picker is a fixed-position popover opened on
    // demand, so a text node in the toolbar flow would shift controls / show
    // stray text while the chunk loads. Render nothing until the popover is ready.
    loading: () => null
  }
);
