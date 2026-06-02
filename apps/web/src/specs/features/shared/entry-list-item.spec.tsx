import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Entry } from "@/entities";
import { mockEntry } from "@/specs/test-utils";

// `@/utils` is globally mocked to only expose `random` + `getAccessToken`.
// EntryListItem (and its muted-content child) import several other helpers
// (makeEntryPath, isHiddenPost, useEntryLocation). Re-mock locally with
// importActual so those real implementations are preserved while the globally
// stubbed functions stay stubbed.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<typeof import("@/utils")>("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// `@ecency/render-helper` is not globally mocked. Stub the bits the component
// touches so nothing reaches the network / image proxy during the test.
vi.mock("@ecency/render-helper", () => ({
  setProxyBase: vi.fn(),
  postBodySummary: vi.fn((entry: any) => `summary:${entry?.permlink ?? ""}`),
  catchPostImage: vi.fn(() => ""),
  proxifyImageSrc: vi.fn(() => "")
}));

// The muted-content child reads the muted-users list from the SDK. The global
// SDK mock doesn't expose this builder, so add it here (returns a disabled,
// empty query so the post renders normally, not as muted).
vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
  getMutedUsersQueryOptions: vi.fn(() => ({
    queryKey: ["muted-users"],
    queryFn: async () => [] as string[],
    enabled: false
  }))
}));

// Mock the heavy / network-bound sibling and child components from the shared
// barrel. We keep a real-logic `EntryLink` so the title link's href is genuinely
// computed by makeEntryPath, and a real-logic `ProfileLink` so the author link
// is exercised. Everything else (votes, menu, payout, avatar, popover...) is a
// deterministic stub.
vi.mock("@/features/shared", async () => {
  const { makeEntryPath } = await vi.importActual<typeof import("@/utils/make-path")>(
    "@/utils/make-path"
  );
  const Real = await import("react");

  const EntryLink = ({ entry, children, className }: any) =>
    Real.createElement(
      "a",
      { href: makeEntryPath(entry.category, entry.author, entry.permlink), className },
      children
    );

  const ProfileLink = ({ username, children }: any) =>
    Real.createElement("a", { href: `/@${username}`, "data-testid": "profile-link" }, children);

  return {
    EntryLink,
    ProfileLink,
    UserAvatar: ({ username }: any) =>
      Real.createElement("span", { "data-testid": "user-avatar" }, username),
    ProfilePopover: () => Real.createElement("span", { "data-testid": "profile-popover" }),
    TimeLabel: ({ created }: any) =>
      Real.createElement("span", { "data-testid": "time-label" }, created),
    EntryVoteBtn: () => Real.createElement("span", { "data-testid": "entry-vote-btn" }),
    EntryPayout: ({ entry }: any) =>
      Real.createElement("span", { "data-testid": "entry-payout" }, entry.pending_payout_value),
    EntryVotes: () => Real.createElement("span", { "data-testid": "entry-votes" }),
    EntryReblogBtn: () => Real.createElement("span", { "data-testid": "entry-reblog-btn" }),
    EntryMenu: () => Real.createElement("span", { "data-testid": "entry-menu" })
  };
});

// The tag link is rendered in the header (category / community pill).
vi.mock("@/features/shared/tag", () => ({
  TagLink: ({ children }: any) =>
    React.createElement("span", { "data-testid": "tag-link" }, children)
}));

// Child components private to entry-list-item that pull extra trees — stub them
// so the test focuses on the composite's own wiring.
vi.mock("@/features/shared/entry-list-item/entry-list-item-cross-post", () => ({
  EntryListItemCrossPost: () => null
}));
vi.mock("@/features/shared/entry-list-item/entry-list-item-client-init", () => ({
  EntryListItemClientInit: () => null
}));
vi.mock("@/features/shared/entry-list-item/entry-list-item-poll-icon", () => ({
  EntryListItemPollIcon: () => null
}));
// The thumbnail does image-downloader queries; stub it out (the title + body
// links are rendered separately by the muted-content component).
vi.mock("@/features/shared/entry-list-item/entry-list-item-thumbnail", () => ({
  EntryListItemThumbnail: () => null
}));

import { EntryListItem } from "@/features/shared/entry-list-item";

function renderItem(entry: Entry, props: Partial<React.ComponentProps<typeof EntryListItem>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EntryListItem entry={entry} order={0} {...props} />
    </QueryClientProvider>
  );
}

describe("EntryListItem", () => {
  it("renders the entry title and author", () => {
    const entry = mockEntry({
      author: "alice",
      permlink: "my-first-post",
      title: "Hello Hive World",
      category: "hive-101"
    });

    renderItem(entry);

    expect(screen.getByText("Hello Hive World")).toBeInTheDocument();
    // Author appears via the avatar stub inside the profile link.
    expect(screen.getByTestId("user-avatar")).toHaveTextContent("alice");
    expect(screen.getByTestId("profile-link")).toHaveAttribute("href", "/@alice");
  });

  it("links the title to the bare /@author/permlink canonical path (no category segment)", () => {
    const entry = mockEntry({
      author: "alice",
      permlink: "my-first-post",
      title: "Hello Hive World",
      category: "hive-101"
    });

    renderItem(entry);

    const titleLink = screen.getByText("Hello Hive World").closest("a");
    expect(titleLink).not.toBeNull();
    expect(titleLink).toHaveAttribute("href", "/@alice/my-first-post");
    // Regression guard: the leading category segment must be stripped to avoid
    // the 308 redirect hop.
    expect(titleLink?.getAttribute("href")).not.toContain("hive-101");
  });

  it("renders the post body summary text", () => {
    const entry = mockEntry({
      author: "bob",
      permlink: "another-post",
      title: "Another Post",
      // ensure no json_metadata.description short-circuit, so postBodySummary runs
      json_metadata: { tags: ["test"], app: "ecency/test" }
    });

    renderItem(entry);

    expect(screen.getByText("summary:another-post")).toBeInTheDocument();
  });

  it("renders a replies link to the entry when the post has children", () => {
    const entry = mockEntry({
      author: "carol",
      permlink: "popular-post",
      title: "Popular Post",
      category: "photography",
      children: 3
    });

    renderItem(entry);

    // The comments count link shows the children count and links to the entry.
    const repliesLink = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === "/@carol/popular-post" && a.textContent?.includes("3"));
    expect(repliesLink).toBeTruthy();
  });

  it("does not render a replies link when the post has no children", () => {
    const entry = mockEntry({
      author: "dave",
      permlink: "quiet-post",
      title: "Quiet Post",
      children: 0
    });

    const { container } = renderItem(entry);

    // Only the title/body EntryLinks point at the entry; there is no extra
    // comments-count anchor containing a UilComment icon.
    const commentIcons = container.querySelectorAll("svg.w-3\\.5.h-3\\.5");
    expect(commentIcons.length).toBe(0);
  });

  it("shows the promoted badge and faq link when promoted", () => {
    const entry = mockEntry({ author: "erin", permlink: "ad-post", title: "Ad Post" });

    renderItem(entry, { promoted: true });

    const promotedLink = screen.getByText("entry-list-item.promoted").closest("a");
    expect(promotedLink).toHaveAttribute("href", "/faq#how-promotion-work");
  });

  it("renders the cross-posted ORIGINAL entry's title and links to the original post", () => {
    const original = mockEntry({
      author: "origauthor",
      permlink: "original-permlink",
      title: "The Original Title",
      category: "art"
    });
    const crossPost = mockEntry({
      author: "reposter",
      permlink: "cross-permlink",
      title: "Crosspost wrapper",
      category: "hive-art",
      original_entry: original
    });

    renderItem(crossPost as Entry);

    // For a cross-post the composite unwraps `original_entry`, so it renders the
    // ORIGINAL entry's title (not the wrapper's), and the title links to the
    // original post's bare canonical path.
    const titleNode = screen.getByText("The Original Title");
    expect(titleNode).toBeInTheDocument();
    expect(screen.queryByText("Crosspost wrapper")).not.toBeInTheDocument();
    const titleLink = titleNode.closest("a");
    expect(titleLink).toHaveAttribute("href", "/@origauthor/original-permlink");
  });
});
