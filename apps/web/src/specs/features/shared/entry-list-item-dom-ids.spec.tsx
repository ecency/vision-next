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

  it("derives no id from the author or the permlink", () => {
    const { container } = renderCards(RELEASE_POSTS);

    const ids = idsOf(container);
    for (const id of ids) {
      expect(id).not.toContain("ecency");
      expect(id).not.toContain("mobile");
    }
  });

  it("leaves the card root and the author block without an id attribute", () => {
    const { container } = renderCards([RELEASE_POSTS[0]]);

    const root = container.querySelector(".entry-list-item");
    expect(root).not.toBeNull();
    expect(root!.hasAttribute("id")).toBe(false);

    const authorPart = container.querySelector(".author-part");
    expect(authorPart).not.toBeNull();
    expect(authorPart!.hasAttribute("id")).toBe(false);
    expect(authorPart!.querySelectorAll("[id]")).toHaveLength(0);
  });
});
