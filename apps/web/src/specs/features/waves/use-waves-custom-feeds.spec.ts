import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Back the storage hook with real (jsdom) localStorage so the test exercises this
// hook's own logic, including its write-time read of localStorage (the freshness
// guard), without the react-use + window storage bus.
vi.mock("@/utils/use-synchronized-local-storage", () => ({
  useSynchronizedLocalStorage: (key: string, initial: string[]) => {
    const read = () => {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : initial;
    };
    const [value, setValue] = React.useState<string[]>(read());
    const set = (v: string[]) => {
      window.localStorage.setItem(key, JSON.stringify(v));
      setValue(v);
    };
    const clear = () => {
      window.localStorage.removeItem(key);
      setValue(initial);
    };
    return [value, set, clear] as const;
  }
}));

import { normalizeWaveTag, useWavesCustomFeeds } from "@/app/waves/_hooks/use-waves-custom-feeds";

describe("normalizeWaveTag", () => {
  it("lowercases and strips a leading #", () => {
    expect(normalizeWaveTag("#Photography")).toBe("photography");
  });

  it("drops spaces and invalid characters", () => {
    expect(normalizeWaveTag("  My Tag! ")).toBe("mytag");
  });

  it("keeps digits and hyphens", () => {
    expect(normalizeWaveTag("hive-101")).toBe("hive-101");
  });

  it("returns empty for junk-only input", () => {
    expect(normalizeWaveTag("###")).toBe("");
    expect(normalizeWaveTag("")).toBe("");
  });
});

describe("useWavesCustomFeeds", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds, normalizes, dedupes and removes tags", () => {
    const { result } = renderHook(() => useWavesCustomFeeds());
    expect(result.current.tags).toEqual([]);

    act(() => {
      result.current.addTag("#Photography");
    });
    expect(result.current.tags).toEqual(["photography"]);

    // Duplicate (post-normalization) is ignored.
    act(() => {
      result.current.addTag("photography");
    });
    expect(result.current.tags).toEqual(["photography"]);

    act(() => {
      result.current.addTag("art");
    });
    expect(result.current.tags).toEqual(["photography", "art"]);

    act(() => {
      result.current.removeTag("photography");
    });
    expect(result.current.tags).toEqual(["art"]);
  });

  it("ignores empty / invalid tags", () => {
    const { result } = renderHook(() => useWavesCustomFeeds());
    act(() => {
      result.current.addTag("###");
      result.current.addTag("   ");
    });
    expect(result.current.tags).toEqual([]);
  });

  it("enforces the max-tags cap and reports whether a tag was added", () => {
    const { result } = renderHook(() => useWavesCustomFeeds());
    const { maxTags } = result.current;

    act(() => {
      for (let i = 0; i < maxTags; i++) {
        result.current.addTag(`tag${i}`);
      }
    });
    expect(result.current.tags).toHaveLength(maxTags);
    expect(result.current.isFull).toBe(true);

    let added: boolean | undefined;
    act(() => {
      added = result.current.addTag("overflow");
    });
    expect(added).toBe(false);
    expect(result.current.tags).toHaveLength(maxTags);
    expect(result.current.tags).not.toContain("overflow");
  });

  it("adds, dedupes and removes sources independently of tags", () => {
    const { result } = renderHook(() => useWavesCustomFeeds());
    expect(result.current.sources).toEqual([]);

    let added: boolean | undefined;
    act(() => {
      added = result.current.addSource("peak.snaps");
    });
    expect(added).toBe(true);
    expect(result.current.sources).toEqual(["peak.snaps"]);

    // Duplicate is ignored and reported as not added.
    act(() => {
      added = result.current.addSource("peak.snaps");
    });
    expect(added).toBe(false);
    expect(result.current.sources).toEqual(["peak.snaps"]);

    act(() => {
      result.current.addSource("leothreads");
      result.current.addTag("photography");
    });
    expect(result.current.sources).toEqual(["peak.snaps", "leothreads"]);
    expect(result.current.tags).toEqual(["photography"]);

    act(() => {
      result.current.removeSource("peak.snaps");
    });
    expect(result.current.sources).toEqual(["leothreads"]);
    // Removing a source leaves tags untouched.
    expect(result.current.tags).toEqual(["photography"]);
  });
});
