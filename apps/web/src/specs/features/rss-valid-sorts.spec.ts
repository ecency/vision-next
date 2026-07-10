import { describe, expect, it } from "vitest";
import { VALID_POST_SORTS, resolvePostSort } from "@/features/rss/valid-sorts";

describe("resolvePostSort", () => {
  it("passes through every bridge-accepted sort unchanged", () => {
    for (const sort of VALID_POST_SORTS) {
      expect(resolvePostSort(sort)).toBe(sort);
    }
  });

  it("falls back to `created` for crawler-supplied non-sort segments", () => {
    // e.g. /subscribers/hive-116509/rss.xml — `subscribers` is a UI filter,
    // not a ranked-posts sort, and the bridge rejects it with "Unsupported
    // sort" (ECENCY-NEXT-1E0W). Clamp it instead of throwing.
    expect(resolvePostSort("subscribers")).toBe("created");
    expect(resolvePostSort("")).toBe("created");
    expect(resolvePostSort("Trending")).toBe("created"); // case-sensitive; bridge is lowercase-only
    expect(resolvePostSort("../../etc")).toBe("created");
  });
});
