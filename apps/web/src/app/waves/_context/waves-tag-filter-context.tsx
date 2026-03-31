"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface WavesTagFilterContextValue {
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

const WavesTagFilterContext = createContext<WavesTagFilterContextValue | undefined>(undefined);

export function WavesTagFilterProvider({ children }: PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTag = searchParams?.get("tag") ?? null;
  const [selectedTag, setSelectedTagState] = useState<string | null>(urlTag);

  useEffect(() => {
    if (urlTag !== selectedTag) {
      setSelectedTagState(urlTag);
    }
  }, [urlTag]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSelectedTag = useCallback(
    (tag: string | null) => {
      setSelectedTagState(tag);

      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (tag) {
        params.set("tag", tag);
      } else {
        params.delete("tag");
      }
      const qs = params.toString();
      router.replace(qs ? `/waves?${qs}` : "/waves", { scroll: false });
    },
    [router, searchParams]
  );

  const value = useMemo(
    () => ({
      selectedTag,
      setSelectedTag
    }),
    [selectedTag, setSelectedTag]
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
