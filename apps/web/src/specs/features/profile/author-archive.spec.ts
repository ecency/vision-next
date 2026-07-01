import { describe, it, expect } from "vitest";
import {
  archiveCursor,
  cursorToken
} from "@/app/(dynamicPages)/profile/[username]/_helpers/author-archive";
import { resolvePager } from "@/features/shared/entry-archive-pager";

describe("archiveCursor", () => {
  it("parses a valid before token on a content section", () => {
    expect(archiveCursor("posts", { before: "enjar/my-post" })).toEqual({
      author: "enjar",
      permlink: "my-post"
    });
  });

  it("returns null when a search query is active", () => {
    expect(archiveCursor("posts", { before: "enjar/my-post", query: "foo" })).toBeNull();
  });

  it("returns null for a non-content section", () => {
    expect(archiveCursor("wallet", { before: "enjar/my-post" })).toBeNull();
  });

  it("returns null for malformed / missing tokens", () => {
    expect(archiveCursor("posts", {})).toBeNull();
    expect(archiveCursor("posts", { before: "enjar" })).toBeNull(); // no slash
    expect(archiveCursor("posts", { before: "/my-post" })).toBeNull(); // empty author
    expect(archiveCursor("posts", { before: "enjar/" })).toBeNull(); // empty permlink
  });

  it("round-trips through cursorToken", () => {
    const c = archiveCursor("blog", { before: "alice/a-b-c" })!;
    expect(cursorToken(c)).toBe("alice/a-b-c");
  });
});

describe("resolvePager", () => {
  const B = "/@enjar/posts";

  it("page 1 with an older cursor shows only Older (clean base, ?before on older)", () => {
    const s = resolvePager(B, "enjar/p20", false)!;
    expect(s.showLatest).toBe(false);
    expect(s.showOlder).toBe(true);
    expect(s.olderHref).toBe("/@enjar/posts?before=enjar/p20");
  });

  it("a cursor page shows Latest (clean base) and Older (next cursor)", () => {
    const s = resolvePager(B, "enjar/p40", true)!;
    expect(s.latestHref).toBe("/@enjar/posts");
    expect(s.olderHref).toBe("/@enjar/posts?before=enjar/p40");
  });

  it("the last page still links back to Latest", () => {
    const s = resolvePager(B, null, true)!;
    expect(s.showOlder).toBe(false);
    expect(s.showLatest).toBe(true);
  });

  it("returns null when there is nothing to link", () => {
    expect(resolvePager(B, null, false)).toBeNull();
  });
});
