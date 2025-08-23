"use client";

import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { PropsWithChildren, useContext } from "react";

export function EntryPageViewerManager(props: PropsWithChildren) {
  const { isRawContent } = useContext(EntryPageContext);

  if (isRawContent) {
    return null;
  }

  return props.children;
}
