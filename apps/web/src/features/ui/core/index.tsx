"use client";

import React, { createContext, PropsWithChildren, useMemo } from "react";
import { useSet } from "react-use";

export * from "./intro-step.interface";

// Anchor elements of currently open click-popovers. Registered by Popover,
// consumed by Dropdown to decide whether an outside mousedown belongs to a
// popover it hosts (whose content portals outside the dropdown's DOM).
export const UIContext = createContext<{
  openPopovers: Set<HTMLElement>;
  addOpenPopover: (v: HTMLElement) => void;
  removeOpenPopover: (v: HTMLElement) => void;
}>({
  openPopovers: new Set(),
  addOpenPopover: () => {},
  removeOpenPopover: () => {}
});

export function UIManager({ children }: PropsWithChildren<unknown>) {
  const [openPopovers, { add: addOpenPopover, remove: removeOpenPopover }] = useSet(
    new Set<HTMLElement>()
  );

  const contextValue = useMemo(
    () => ({ openPopovers, addOpenPopover, removeOpenPopover }),
    [openPopovers, addOpenPopover, removeOpenPopover]
  );

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
}
