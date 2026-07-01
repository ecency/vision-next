import { describe, it, expect } from "vitest";
import {
  sliceArchivePage,
  ARCHIVE_PER_PAGE
} from "@/app/(dynamicPages)/profile/[username]/_helpers/author-archive";
import { resolvePager } from "@/features/shared/entry-archive-pager";

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ permlink: `p${i}` })) as any[];

describe("sliceArchivePage", () => {
  it("returns the requested page window and hasNext=true when more exist", () => {
    const { entries, hasNext } = sliceArchivePage(items(50), 2, ARCHIVE_PER_PAGE);
    expect(entries).toHaveLength(20);
    expect(entries[0].permlink).toBe("p20");
    expect(entries[19].permlink).toBe("p39");
    expect(hasNext).toBe(true);
  });

  it("returns a partial last page with hasNext=false", () => {
    const { entries, hasNext } = sliceArchivePage(items(45), 3, ARCHIVE_PER_PAGE); // start 40..60
    expect(entries).toHaveLength(5);
    expect(hasNext).toBe(false);
  });

  it("returns empty for a page beyond the content", () => {
    const { entries, hasNext } = sliceArchivePage(items(30), 3, ARCHIVE_PER_PAGE);
    expect(entries).toHaveLength(0);
    expect(hasNext).toBe(false);
  });
});

describe("resolvePager", () => {
  const B = "/@enjar/posts";

  it("page 1 with more pages shows only Next (no /page/1)", () => {
    const s = resolvePager(B, 1, true, 10)!;
    expect(s.showPrev).toBe(false);
    expect(s.showNext).toBe(true);
    expect(s.nextHref).toBe("/@enjar/posts/page/2");
  });

  it("a middle page shows Prev and Next; prev of page 2 is the base", () => {
    const s = resolvePager(B, 2, true, 10)!;
    expect(s.prevHref).toBe("/@enjar/posts"); // page 1 = base, no /page/1
    expect(s.nextHref).toBe("/@enjar/posts/page/3");
  });

  it("caps Next at maxPage", () => {
    const s = resolvePager(B, 10, true, 10)!;
    expect(s.showPrev).toBe(true);
    expect(s.showNext).toBe(false);
  });

  it("returns null when there is neither prev nor next", () => {
    expect(resolvePager(B, 1, false, 10)).toBeNull();
  });
});
