import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  resolveRelatedSource,
  isLinkableRelated
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-related-source";
import { EntryPageBreadcrumb } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-breadcrumb";
import { EntryRelatedList } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-related-list";
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

describe("EntryRelatedList", () => {
  it("renders a heading and a canonical bare link per entry", () => {
    const entries = [
      mockEntry({ author: "alice", permlink: "post-1", category: "photography", title: "Post One" }),
      mockEntry({ author: "bob", permlink: "post-2", category: "photography", title: "Post Two" })
    ];
    render(<EntryRelatedList title="More in #photography" entries={entries} />);

    expect(screen.getByText("More in #photography")).not.toBeNull();
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/@alice/post-1");
    expect(hrefs).toContain("/@bob/post-2");
  });

  it("renders nothing when there are no entries", () => {
    const { container } = render(<EntryRelatedList title="More in #x" entries={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
