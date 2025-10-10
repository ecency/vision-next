"use client";

import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

interface WavesTagFilterContextValue {
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

const WavesTagFilterContext = createContext<WavesTagFilterContextValue | undefined>(undefined);

export function WavesTagFilterProvider({ children }: PropsWithChildren<{}>) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      selectedTag,
      setSelectedTag
    }),
    [selectedTag]
  );

  return (
    <WavesTagFilterContext.Provider value={value}>
      {children}
    </WavesTagFilterContext.Provider>
  );
}

export function useWavesTagFilter() {
  const context = useContext(WavesTagFilterContext);

  if (!context) {
    throw new Error("useWavesTagFilter must be used within a WavesTagFilterProvider");
  }

  return context;
}

export function useOptionalWavesTagFilter() {
  return useContext(WavesTagFilterContext);
}
