import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Entry } from "@/entities";
import { mockEntry } from "@/specs/test-utils";

// Guard for #1806. A feed card used to stamp three DOM ids on itself:
//
//   root:            id={(author + permlink).replace(/[0-9]/g, "")}
//   .author-part:    id={`${author}-${permlink}`}
//   its child div:   id={`${author}-${permlink}`}   <- same id again
//
// The first is not unique across a page (digit-stripping maps
// `ecency-mobile-3-5-9` and `ecency-mobile-3-5-8` onto one id, seen live on
// /@ecency) and the last two are a duplicate inside a single card. Nothing in
// the app, the specs or the SCSS reads any of them, so the fix removes them.
// These tests pin that: a card contributes no author/permlink-derived id, and
// a list of cards contains no duplicate id at all.

vi.mock("@/utils", async () => ({
  ...(await vi.importActual<typeof import("@/utils")>("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

vi.mock("@ecency/render-helper", () => ({
  setProxyBase: vi.fn(),
  postBodySummary: vi.fn((entry: any) => `summary:${entry?.permlink ?? ""}`),
  catchPostImage: vi.fn(() => ""),
  proxifyImageSrc: vi.fn(() => "")
}));

// Stub the heavy children. They are irrelevant here and some of them mount
// portals whose own (legitimate, static) ids would only add noise.
vi.mock("@/features/shared", async () => {
  const { makeEntryPath } =
    await vi.importActual<typeof import("@/utils/make-path")>("@/utils/make-path");
  const Real = await import("react");

  return {
    EntryLink: ({ entry, children, className }: any) =>
      Real.createElement(
        "a",
        { href: makeEntryPath(entry.category, entry.author, entry.permlink), className },
        children
      ),
    ProfileLink: ({ username, children }: any) =>
      Real.createElement("a", { href: `/@${username}` }, children),
    EcencySourceBadge: () => null,
    UserAvatar: ({ username }: any) => Real.createElement("span", null, username),
    ProfilePopover: () => Real.createElement("span", null),
    TimeLabel: ({ created }: any) => Real.createElement("span", null, created),
    EntryVoteBtn: () => Real.createElement("span", null),
    EntryPayout: () => Real.createElement("span", null),
    EntryVotes: () => Real.createElement("span", null),
    EntryReblogBtn: () => Real.createElement("span", null),
    EntryTipBtn: () => Real.createElement("span", null),
    EntryMenu: () => Real.createElement("span", null)
  };
});

vi.mock("@/features/shared/tag", () => ({
  TagLink: ({ children }: any) => React.createElement("span", null, children)
}));
vi.mock("@/features/shared/entry-list-item/entry-list-item-cross-post", () => ({
  EntryListItemCrossPost: () => null
}));
vi.mock("@/features/shared/entry-list-item/entry-list-item-client-init", () => ({
  EntryListItemClientInit: () => null
}));
vi.mock("@/features/shared/entry-list-item/entry-list-item-poll-icon", () => ({
  EntryListItemPollIcon: () => null
}));
vi.mock("@/features/shared/entry-list-item/entry-list-item-thumbnail", () => ({
  EntryListItemThumbnail: () => null
}));

import { EntryListItem } from "@/features/shared/entry-list-item";

function renderCards(entries: Entry[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {entries.map((entry, i) => (
        <EntryListItem key={`${entry.author}-${entry.permlink}`} entry={entry} order={i} />
      ))}
    </QueryClientProvider>
  );
}

const idsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[id]")).map((el) => el.id);

// The exact live case from /@ecency: two release posts whose permlinks differ
// only in their digits.
const RELEASE_POSTS = [
  mockEntry({ author: "ecency", permlink: "ecency-mobile-3-5-9", title: "Mobile 3.5.9" }),
  mockEntry({ author: "ecency", permlink: "ecency-mobile-3-5-8", title: "Mobile 3.5.8" })
];

describe("EntryListItem DOM ids (#1806)", () => {
  it("gives a single card no duplicate ids", () => {
    const { container } = renderCards([RELEASE_POSTS[0]]);

    const ids = idsOf(container);
    expect(ids).toEqual([...new Set(ids)]);
  });

  it("keeps ids unique across cards whose permlinks differ only in digits", () => {
    const { container } = renderCards(RELEASE_POSTS);

    // Both cards are really there, so an empty container cannot pass this.
    expect(container.querySelectorAll(".entry-list-item")).toHaveLength(2);

    const ids = idsOf(container);
    expect(ids).toEqual([...new Set(ids)]);
  });

  it("keeps the digits, so two releases do not collapse onto one id", () => {
    const { container } = renderCards(RELEASE_POSTS);

    const ids = idsOf(container);
    expect(ids).toContain("ecency-ecency-mobile-3-5-9");
    expect(ids).toContain("ecency-ecency-mobile-3-5-8");
  });

  it("puts exactly one id on a card, on its root", () => {
    const { container } = renderCards([RELEASE_POSTS[0]]);

    const root = container.querySelector(".entry-list-item")!;
    expect(root.getAttribute("id")).toBe("ecency-ecency-mobile-3-5-9");
    // The author block used to carry the same id on two nested divs.
    expect(container.querySelector(".author-part")!.querySelectorAll("[id]")).toHaveLength(0);
    expect(container.querySelector(".author-part")!.hasAttribute("id")).toBe(false);
  });

  // A cross-post card renders the post it WRAPS, so an id taken from the
  // rendered entry names the original — and a feed carrying both the cross-post
  // and that original would stamp one id on two cards. The id comes from the
  // card's own post instead.
  it("gives a cross-post its own id, not the id of the post it wraps", () => {
    const original = mockEntry({ author: "alice", permlink: "the-original" });
    const crossPost = mockEntry({
      author: "bob",
      permlink: "the-original-hive-125125",
      original_entry: original
    } as never);

    const { container } = renderCards([original, crossPost] as never);

    expect(container.querySelectorAll(".entry-list-item")).toHaveLength(2);
    const ids = idsOf(container);
    expect(ids).toEqual([...new Set(ids)]);
    expect(ids).toContain("alice-the-original");
    expect(ids).toContain("bob-the-original-hive-125125");
  });

});
