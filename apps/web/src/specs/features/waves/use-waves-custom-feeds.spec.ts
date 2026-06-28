import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Back the storage hook with a plain useState so the test exercises this hook's
// own add/normalize/dedupe/remove logic deterministically, not react-use + the
// window storage bus.
vi.mock("@/utils/use-synchronized-local-storage", () => ({
  useSynchronizedLocalStorage: (_key: string, initial: string[]) => {
    const [value, setValue] = React.useState<string[]>(initial);
    return [value, setValue, () => setValue(initial)] as const;
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
  it("adds, normalizes, dedupes and removes tags", () => {
    const { result } = renderHook(() => useWavesCustomFeeds());
    expect(result.current.tags).toEqual([]);

    act(() => result.current.addTag("#Photography"));
    expect(result.current.tags).toEqual(["photography"]);

    // Duplicate (post-normalization) is ignored.
    act(() => result.current.addTag("photography"));
    expect(result.current.tags).toEqual(["photography"]);

    act(() => result.current.addTag("art"));
    expect(result.current.tags).toEqual(["photography", "art"]);

    act(() => result.current.removeTag("photography"));
    expect(result.current.tags).toEqual(["art"]);
  });

  it("ignores empty / invalid tags", () => {
    const { result } = renderHook(() => useWavesCustomFeeds());
    act(() => result.current.addTag("###"));
    act(() => result.current.addTag("   "));
    expect(result.current.tags).toEqual([]);
  });
});
