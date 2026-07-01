import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  resolveRelatedSource,
  isLinkableRelated
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-related-source";
import { EntryPageBreadcrumb } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-breadcrumb";
import { EntryRelatedRow } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-related-row";
import {
  relatedItemFromEntry,
  relatedItemFromSimilar,
  selectRelatedColumns
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-related-item";
import { buildEntryBreadcrumbs } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-breadcrumbs";
import { mockEntry } from "@/specs/test-utils";

// Render next/link and next/image as plain DOM so we can assert on hrefs.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
      {children}
    </a>
  )
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: any) => <img src={typeof src === "string" ? src : src?.src} alt={alt} />
}));

describe("resolveRelatedSource", () => {
  it("prefers the community (id) labelled with its title", () => {
    expect(
      resolveRelatedSource({
        category: "hive-125125",
        community: "hive-125125",
        community_title: "Ecency",
        json_metadata: { tags: ["ecency", "dev"] }
      })
    ).toEqual({ tag: "hive-125125", section: "Ecency" });
  });

  it("uses the category tag for a non-community post", () => {
    expect(
      resolveRelatedSource({
        category: "photography",
        community: undefined,
        community_title: undefined,
        json_metadata: { tags: ["photography", "art"] }
      })
    ).toEqual({ tag: "photography", section: "#photography" });
  });

  it("never shows a raw hive id heading: falls back to the primary tag", () => {
    // Community post whose community_title is missing and category is a raw id.
    expect(
      resolveRelatedSource({
        category: "hive-125125",
        community: "hive-125125",
        community_title: undefined,
        json_metadata: { tags: ["travel", "blog"] }
      })
    ).toEqual({ tag: "travel", section: "#travel" });
  });

  it("skips hive-id-shaped tags when picking the fallback heading", () => {
    expect(
      resolveRelatedSource({
        category: "hive-125125",
        community: "hive-125125",
        community_title: undefined,
        json_metadata: { tags: ["hive-125125", "travel"] }
      })
    ).toEqual({ tag: "travel", section: "#travel" });
  });

  it("returns null when there is nothing to link", () => {
    expect(
      resolveRelatedSource({
        category: "hive-125125",
        community: "hive-125125",
        community_title: undefined,
        json_metadata: { tags: [] }
      })
    ).toBeNull();
  });

  it("returns null when the only tags are hive-id-shaped", () => {
    expect(
      resolveRelatedSource({
        category: "hive-125125",
        community: "hive-125125",
        community_title: undefined,
        json_metadata: { tags: ["hive-125125", "hive-999"] }
      })
    ).toBeNull();
  });
});

describe("isLinkableRelated", () => {
  const base = { category: "photography", title: "A nice photo", json_metadata: { tags: ["photography"] }, stats: null };

  it("allows a normal SFW post", () => {
    expect(isLinkableRelated(base)).toBe(true);
  });

  it("rejects NSFW-tagged posts", () => {
    expect(isLinkableRelated({ ...base, json_metadata: { tags: ["nsfw"] } })).toBe(false);
  });

  it("rejects mod-muted (gray) posts", () => {
    expect(isLinkableRelated({ ...base, stats: { gray: true } as any })).toBe(false);
  });
});

describe("buildEntryBreadcrumbs", () => {
  const opts = { siteName: "Ecency", base: "https://ecency.com", entryUrl: "https://ecency.com/@alice/p" };

  it("builds Home > #tag > title for a normal tag post", () => {
    const crumbs = buildEntryBreadcrumbs(
      { parent_author: undefined, category: "photography", community_title: undefined, title: "Pic", author: "alice", permlink: "p" },
      opts
    );
    expect(crumbs.map((c) => c.name)).toEqual(["Ecency", "#photography", "Pic"]);
    expect(crumbs[1].path).toBe("/trending/photography");
  });

  it("uses the community title as the section for a community post", () => {
    const crumbs = buildEntryBreadcrumbs(
      { parent_author: undefined, category: "hive-125125", community_title: "Ecency", title: "Pic", author: "alice", permlink: "p" },
      opts
    );
    expect(crumbs.map((c) => c.name)).toEqual(["Ecency", "Ecency", "Pic"]);
  });

  it("omits the section crumb (no raw hive id) when a community post has no title", () => {
    const crumbs = buildEntryBreadcrumbs(
      { parent_author: undefined, category: "hive-125125", community_title: undefined, title: "Pic", author: "alice", permlink: "p" },
      opts
    );
    expect(crumbs.map((c) => c.name)).toEqual(["Ecency", "Pic"]);
    expect(crumbs.some((c) => c.name.includes("hive-"))).toBe(false);
  });

  it("returns no trail for a comment", () => {
    const crumbs = buildEntryBreadcrumbs(
      { parent_author: "bob", category: "photography", community_title: undefined, title: "re", author: "alice", permlink: "p" },
      opts
    );
    expect(crumbs).toEqual([]);
  });
});

describe("EntryPageBreadcrumb", () => {
  const items = [
    { name: "Ecency", path: "/" },
    { name: "#photography", path: "/trending/photography" },
    { name: "My Post", path: "/@alice/my-post" }
  ];

  it("renders all but the last crumb as crawlable links", () => {
    render(<EntryPageBreadcrumb items={items} />);
    expect(screen.getByRole("link", { name: "Ecency" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "#photography" }).getAttribute("href")).toBe(
      "/trending/photography"
    );
  });

  it("renders the current (last) item as plain text, not a link", () => {
    render(<EntryPageBreadcrumb items={items} />);
    expect(screen.queryByRole("link", { name: "My Post" })).toBeNull();
    expect(screen.getByText("My Post").getAttribute("aria-current")).toBe("page");
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(<EntryPageBreadcrumb items={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("related item adapters", () => {
  it("relatedItemFromEntry maps the fields the row needs", () => {
    const e = mockEntry({
      author: "alice",
      permlink: "p1",
      category: "photography",
      title: "Pic",
      created: "2026-06-30T00:00:00"
    });
    expect(relatedItemFromEntry(e)).toMatchObject({
      author: "alice",
      permlink: "p1",
      category: "photography",
      title: "Pic",
      created: "2026-06-30T00:00:00"
    });
  });

  it("relatedItemFromSimilar maps a row and drops rows missing author/permlink", () => {
    expect(
      relatedItemFromSimilar({
        author: "bob",
        permlink: "p2",
        title: "T",
        category: "art",
        created_at: "2026-06-01T00:00:00"
      })
    ).toMatchObject({ author: "bob", permlink: "p2", title: "T", category: "art", created: "2026-06-01T00:00:00" });
    expect(relatedItemFromSimilar({ permlink: "p2" })).toBeNull();
    expect(relatedItemFromSimilar({ author: "bob" })).toBeNull();
  });
});

describe("selectRelatedColumns", () => {
  const item = (author: string, permlink: string): any => ({
    author,
    permlink,
    title: `${author}/${permlink}`,
    category: "x",
    created: "2026-06-30T00:00:00"
  });
  const opts = { perColumn: 4, minColumn: 2, excludeKey: "self/current" };

  it("drops a sparse column (e.g. a brand-new author with <2 posts)", () => {
    const cols = selectRelatedColumns(
      [
        { title: "Read next", items: [item("a", "1"), item("b", "2"), item("c", "3")] },
        { title: "From @newbie", items: [item("newbie", "only-post")] }, // just 1
        { title: "In Community", items: [item("d", "4"), item("e", "5")] }
      ],
      opts
    );
    expect(cols.map((c) => c.title)).toEqual(["Read next", "In Community"]); // author column dropped
  });

  it("caps each column at perColumn and excludes the current post", () => {
    const cols = selectRelatedColumns(
      [
        {
          title: "From @alice",
          items: [
            item("self", "current"), // excluded
            item("alice", "1"),
            item("alice", "2"),
            item("alice", "3"),
            item("alice", "4"),
            item("alice", "5")
          ]
        }
      ],
      opts
    );
    expect(cols[0].items.map((i) => i.permlink)).toEqual(["1", "2", "3", "4"]);
  });

  it("a dropped sparse column does not consume items a later column needs", () => {
    const cols = selectRelatedColumns(
      [
        { title: "From @newbie", items: [item("newbie", "shared")] }, // 1 item → dropped
        { title: "In Community", items: [item("newbie", "shared"), item("x", "1"), item("y", "2")] }
      ],
      opts
    );
    expect(cols.map((c) => c.title)).toEqual(["In Community"]);
    // "shared" was tentatively picked by the dropped column but must remain
    // available to the kept column.
    expect(cols[0].items.map((i) => i.permlink)).toContain("shared");
  });

  it("dedups a post across columns (earlier column wins)", () => {
    const cols = selectRelatedColumns(
      [
        { title: "Read next", items: [item("alice", "shared"), item("x", "1")] },
        // 3 items so it still clears minColumn after the shared one is deduped away.
        { title: "From @alice", items: [item("alice", "shared"), item("alice", "9"), item("alice", "10")] }
      ],
      opts
    );
    expect(cols[0].items.map((i) => `${i.author}/${i.permlink}`)).toContain("alice/shared");
    expect(cols[1].items.map((i) => `${i.author}/${i.permlink}`)).not.toContain("alice/shared");
  });
});

describe("EntryRelatedRow", () => {
  it("renders a canonical bare link with title + author", () => {
    render(
      <EntryRelatedRow
        item={{
          author: "alice",
          permlink: "post-1",
          category: "photography",
          title: "Post One",
          created: "2026-06-30T00:00:00"
        }}
      />
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe("/@alice/post-1");
    expect(screen.getByText("Post One")).not.toBeNull();
    expect(screen.getByText(/alice/)).not.toBeNull();
  });
});
