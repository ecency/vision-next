import { describe, it, expect } from "vitest";
import {
  parseArchiveCursor,
  cursorToken,
  isArchivableTag,
  isArchivableFilter,
  olderCursorToken,
  ARCHIVE_PAGE_SIZE,
  PIN_DEDUPE_ALLOWANCE
} from "@/features/seo/ranked-archive";

const post = (i: number, pinned = false) =>
  ({
    author: `author${i}`,
    permlink: `post-${i}`,
    ...(pinned ? { stats: { is_pinned: true } } : {})
  }) as any;

const page = (n: number, pinnedCount = 0) =>
  Array.from({ length: n }, (_, i) => post(i, i < pinnedCount));

describe("parseArchiveCursor", () => {
  it("parses a valid author/permlink token", () => {
    expect(parseArchiveCursor("enjar/my-post")).toEqual({ author: "enjar", permlink: "my-post" });
  });

  it("round-trips through cursorToken", () => {
    expect(cursorToken(parseArchiveCursor("alice/a-b-c")!)).toBe("alice/a-b-c");
  });

  it("rejects missing / malformed tokens", () => {
    expect(parseArchiveCursor(undefined)).toBeNull();
    expect(parseArchiveCursor("")).toBeNull();
    expect(parseArchiveCursor("enjar")).toBeNull(); // no slash
    expect(parseArchiveCursor("/my-post")).toBeNull(); // empty author
    expect(parseArchiveCursor("enjar/")).toBeNull(); // empty permlink
  });
});

describe("isArchivableFilter", () => {
  it("allows only content sorts", () => {
    expect(isArchivableFilter("created")).toBe(true);
    expect(isArchivableFilter("trending")).toBe(true);
    expect(isArchivableFilter("hot")).toBe(true);
    expect(isArchivableFilter("payout")).toBe(false);
    expect(isArchivableFilter("muted")).toBe(false);
    expect(isArchivableFilter("promoted")).toBe(false);
  });
});

describe("olderCursorToken", () => {
  it("full page -> cursor of the last entry", () => {
    expect(olderCursorToken(page(ARCHIVE_PAGE_SIZE))).toBe("author19/post-19");
  });

  it("short page -> null (no evidence older content exists)", () => {
    expect(olderCursorToken(page(5))).toBeNull();
    expect(olderCursorToken([])).toBeNull();
    expect(olderCursorToken([null, undefined])).toBeNull();
  });

  // The SDK keeps one pinned entry and DROPS the rest, so a full raw community
  // page can surface as 16-19 entries with a pin present.
  it("pin-shrunk community page (17 entries, pin present) -> cursor", () => {
    expect(olderCursorToken(page(17, 1), true)).toBe("author16/post-16");
  });

  it("small pinned community (5 posts, 1 pin) -> null — NOT a full-page signal", () => {
    expect(olderCursorToken(page(5, 1), true)).toBeNull();
  });

  it("pin-shrink lower bound: exactly PAGE_SIZE - ALLOWANCE passes, one below fails", () => {
    expect(olderCursorToken(page(ARCHIVE_PAGE_SIZE - PIN_DEDUPE_ALLOWANCE, 1), true)).not.toBeNull();
    expect(olderCursorToken(page(ARCHIVE_PAGE_SIZE - PIN_DEDUPE_ALLOWANCE - 1, 1), true)).toBeNull();
  });

  it("short page with pin but allowPinShrink=false (tag feeds) -> null", () => {
    expect(olderCursorToken(page(17, 1))).toBeNull();
  });

  it("17 entries without any pin -> null even with allowPinShrink", () => {
    expect(olderCursorToken(page(17), true)).toBeNull();
  });
});

describe("isArchivableTag", () => {
  it("allows content sorts on a real topic tag", () => {
    expect(isArchivableTag("created", "photography")).toBe(true);
    expect(isArchivableTag("trending", "art")).toBe(true);
    expect(isArchivableTag("hot", "hive")).toBe(true);
  });

  it("rejects non-content sorts", () => {
    expect(isArchivableTag("payout", "photography")).toBe(false);
    expect(isArchivableTag("muted", "photography")).toBe(false);
  });

  it("rejects empty / personal / user tags", () => {
    expect(isArchivableTag("created", "")).toBe(false); // global feed
    expect(isArchivableTag("created", "my")).toBe(false);
    expect(isArchivableTag("created", "@bob")).toBe(false);
    expect(isArchivableTag("created", "%40bob")).toBe(false);
  });
});
