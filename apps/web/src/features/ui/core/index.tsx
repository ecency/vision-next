"use client";

import React, { createContext, PropsWithChildren, useMemo } from "react";
import { useSet } from "react-use";

export * from "./intro-step.interface";

export const UIContext = createContext<{
  openPopovers: Set<string>;
  addOpenPopover: (v: string) => void;
  removeOpenPopover: (v: string) => void;
}>({
  openPopovers: new Set(),
  addOpenPopover: () => {},
  removeOpenPopover: () => {}
});

export function UIManager({ children }: PropsWithChildren<unknown>) {
  const [openPopovers, { add: addOpenPopover, remove: removeOpenPopover }] = useSet(
    new Set<string>()
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
