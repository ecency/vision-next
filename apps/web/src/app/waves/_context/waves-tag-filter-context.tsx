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
  // The active ad-hoc/custom tag feed (URL ?tag=).
  selectedTag: string | null;
  // The active source (container host) feed (URL ?source=), e.g. peak.snaps.
  selectedSource: string | null;
  setSelectedTag: (tag: string | null) => void;
  setSelectedSource: (source: string | null) => void;
}

const WavesTagFilterContext = createContext<WavesTagFilterContextValue | undefined>(undefined);

export function WavesTagFilterProvider({ children }: PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Container hosts are lowercase; normalize a raw URL value (?source=Peak.Snaps)
  // so it matches pinned tabs and the feed API exactly.
  const urlSource = (searchParams?.get("source") ?? "").trim().toLowerCase() || null;
  // tag and source are mutually exclusive views; the setters enforce that, but a
  // crafted/legacy URL can carry both. Honor the same precedence as the feed
  // query (source wins) on read so state never holds both at once.
  const urlTag = urlSource ? null : (searchParams?.get("tag") ?? null);
  const [selectedTag, setSelectedTagState] = useState<string | null>(urlTag);
  const [selectedSource, setSelectedSourceState] = useState<string | null>(urlSource);

  useEffect(() => {
    if (urlTag !== selectedTag) {
      setSelectedTagState(urlTag);
    }
  }, [urlTag]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (urlSource !== selectedSource) {
      setSelectedSourceState(urlSource);
    }
  }, [urlSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/waves?${qs}` : "/waves", { scroll: false });
    },
    [router, searchParams]
  );

  // tag and source are mutually exclusive views, so selecting one clears the other.
  const setSelectedTag = useCallback(
    (tag: string | null) => {
      setSelectedTagState(tag);
      setSelectedSourceState(null);
      replaceParams((params) => {
        if (tag) {
          params.set("tag", tag);
        } else {
          params.delete("tag");
        }
        params.delete("source");
      });
    },
    [replaceParams]
  );

  const setSelectedSource = useCallback(
    (source: string | null) => {
      const value = source ? source.trim().toLowerCase() || null : null;
      setSelectedSourceState(value);
      setSelectedTagState(null);
      replaceParams((params) => {
        if (value) {
          params.set("source", value);
        } else {
          params.delete("source");
        }
        params.delete("tag");
      });
    },
    [replaceParams]
  );

  const value = useMemo(
    () => ({ selectedTag, selectedSource, setSelectedTag, setSelectedSource }),
    [selectedTag, selectedSource, setSelectedTag, setSelectedSource]
  );

  return <WavesTagFilterContext.Provider value={value}>{children}</WavesTagFilterContext.Provider>;
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
