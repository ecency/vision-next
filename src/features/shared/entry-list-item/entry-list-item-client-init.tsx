"use client";

import { useMount, useUnmount } from "react-use";
import { htmlPositionManager } from "@/utils/html-position-manager";

export function EntryListItemClientInit() {
  useMount(() => {
    htmlPositionManager.addReference();
  });

  useUnmount(() => {
    htmlPositionManager.removeReference();
  });

  return <></>;
}
