import { describe, it, expect } from "vitest";
import {
  parseArchiveCursor,
  cursorToken,
  isArchivableTag,
  isArchivableFilter
} from "@/features/seo/ranked-archive";

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
