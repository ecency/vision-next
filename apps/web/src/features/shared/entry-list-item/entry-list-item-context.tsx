"use client";

import { EcencyClientServerBridge } from "@/core/client-server-bridge";
import { PropsWithChildren, useMemo, useState } from "react";

export const EntryListItemContext = EcencyClientServerBridge.createSafeContext<{
  showNsfw: boolean;
  setShowNsfw: (v: boolean) => void;
}>({
  showNsfw: false,
  setShowNsfw: () => {}
});

export function EntryListItemProvider(props: PropsWithChildren) {
  const [showNsfw, setShowNsfw] = useState(false);

  const contextValue = useMemo(() => ({ setShowNsfw, showNsfw }), [showNsfw]);

  return (
    <EntryListItemContext.ClientContextProvider value={contextValue}>
      {props.children}
    </EntryListItemContext.ClientContextProvider>
  );
}
