import React from "react";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { QueryKeys } from "@ecency/sdk";
import type { Entry } from "@/entities";
import { renderWithQueryClient } from "@/specs/test-utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";

// The cache-first repaint, rebuilt outside a Suspense boundary (#1789).
//
// The behaviour under test is deliberately asymmetric and that asymmetry is the
// point of the whole change, so it is what most of this file asserts: when the
// reader's cache HAS the feed they are navigating to, those rows go up straight
// away; when it does not, the wrapper renders its children and NOTHING else, so
// the previous page keeps standing under the app-wide progress bar. Its deleted
// ancestor (FeedLoading, a loading.tsx fallback) fell back to skeletons there,
// which as an overlay would be a downgrade rather than a repaint.

const VIEWER = "viewer";

const cached = vi.hoisted(() => ({ value: undefined as unknown, key: "" }));

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
  getMutedUsersQueryOptions: vi.fn((username?: string) => ({
    queryKey: QueryKeys.accounts.mutedUsers(username!),
    queryFn: async () => [] as string[],
    enabled: false
  }))
}));

// The cache seam. Records the (filter, tag, limit, observer) it was asked for so
// the tests can assert the repaint looked up the feed the reader is heading TO,
// not the one they are standing on.
vi.mock("@/api/queries", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/api/queries")),
  getPostsFeedQueryData: vi.fn((filter: string, tag: string, limit: number, observer: string) => {
    cached.key = `${filter}|${tag}|${limit}|${observer}`;
    return cached.value;
  })
}));

vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (state: unknown) => unknown) =>
    selector({ activeUser: { username: VIEWER }, listStyle: "row" })
}));

// Same seam feed-list.spec.tsx mocks: this spec is about WHICH rows the repaint
// paints, not about how a card renders.
vi.mock("@/features/shared/entry-list-content", () => ({
  EntryListContent: ({ entries }: { entries: Entry[] }) => (
    <div data-testid="entries">{entries.map((e) => e.permlink).join(",")}</div>
  )
}));

import { FeedCachedRepaint } from "@/app/(dynamicPages)/feed/_components/feed-cached-repaint";
import {
  resetFeedNavigationTarget,
  setFeedNavigationTarget,
  type FeedNavigationTarget
} from "@/app/(dynamicPages)/feed/_components/feed-navigation-intent";

const CURRENT_PAGE = "the page already on screen";

function renderRepaint(muted?: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (muted) {
    queryClient.setQueryData(QueryKeys.accounts.mutedUsers(VIEWER), muted);
    vi.mocked(useActiveAccount).mockReturnValue({
      activeUser: { username: VIEWER },
      username: VIEWER
    } as ReturnType<typeof useActiveAccount>);
  }
  return renderWithQueryClient(
    <FeedCachedRepaint>
      <main>{CURRENT_PAGE}</main>
    </FeedCachedRepaint>,
    { queryClient }
  );
}

/** Start a navigation the way the tab bar does, from outside React's render. */
function navigateTo(target: Partial<FeedNavigationTarget>) {
  act(() => {
    setFeedNavigationTarget({ filter: "hot", tag: "", noReblog: false, ...target });
  });
}

function twoRows() {
  return {
    pages: [
      [
        { author: "bob", permlink: "one" },
        { author: "carol", permlink: "two" }
      ]
    ],
    pageParams: [null]
  };
}

/** The children are painted, and no repaint is on top of them. */
function expectChildrenOnly(container: HTMLElement) {
  expect(screen.getByText(CURRENT_PAGE)).toBeVisible();
  expect(screen.queryByTestId("entries")).not.toBeInTheDocument();
  expect(container.querySelector("[data-feed-repaint]")).toBeNull();
}

describe("feed cached repaint", () => {
  afterEach(() => {
    cached.value = undefined;
    cached.key = "";
    act(() => resetFeedNavigationTarget());
    vi.mocked(useActiveAccount).mockReset();
  });

  it("is a pass-through while no navigation is in flight", () => {
    cached.value = twoRows();

    const { container } = renderRepaint();

    expectChildrenOnly(container);
  });

  it("paints the cached rows for the feed the reader is heading to", () => {
    cached.value = twoRows();

    const { container } = renderRepaint();
    navigateTo({ filter: "trending", tag: "photography" });

    expect(screen.getByTestId("entries")).toHaveTextContent("one,two");
    expect(container.querySelector("[data-feed-repaint]")).toHaveAttribute(
      "data-feed-repaint",
      "trending/photography"
    );
    // ...read under the TARGET's key, not the current page's.
    expect(cached.key).toBe(`trending|photography|20|${VIEWER}`);
  });

  // The previous page is hidden rather than unmounted: the destination replaces
  // this subtree a moment later, and tearing its DOM down and back up would
  // throw away every card's hydration for the sake of that moment.
  it("keeps the current page mounted, hidden, under the repaint", () => {
    cached.value = twoRows();

    renderRepaint();
    navigateTo({ filter: "trending", tag: "photography" });

    const current = screen.getByText(CURRENT_PAGE);
    expect(current).toBeInTheDocument();
    expect(current.closest("[hidden]")).not.toBeNull();
  });

  // The load-bearing difference from the deleted FeedLoading.
  it("leaves the current page alone when the target is not cached", () => {
    const { container } = renderRepaint();
    navigateTo({ filter: "trending", tag: "photography" });

    expectChildrenOnly(container);
    // ...and specifically no skeletons, which is what a route fallback would
    // have shown and what would make this a downgrade rather than a repaint.
    expect(container.querySelectorAll(".entry-list-loading-item")).toHaveLength(0);
  });

  it("clears the repaint when the navigation lands", () => {
    cached.value = twoRows();

    const { container } = renderRepaint();
    navigateTo({ filter: "trending", tag: "photography" });
    expect(screen.getByTestId("entries")).toBeInTheDocument();

    act(() => resetFeedNavigationTarget());

    expectChildrenOnly(container);
  });

  // `/hot/Photography` is served as the `photography` feed, so the cache entry
  // is under the lowercased tag. Looking it up raw would miss every time.
  it("looks the feed up under the normalised tag", () => {
    cached.value = twoRows();

    renderRepaint();
    navigateTo({ filter: "hot", tag: "Photography" });

    expect(cached.key).toBe(`hot|photography|20|${VIEWER}`);
    expect(screen.getByTestId("entries")).toHaveTextContent("one,two");
  });

  // `queryable: false` means no query was ever made under this key, so any hit
  // would belong to a different feed.
  it("does not paint a tag hivemind cannot answer", () => {
    cached.value = twoRows();

    const { container } = renderRepaint();
    navigateTo({ filter: "hot", tag: "Not A Tag!" });

    expectChildrenOnly(container);
  });

  it("does not paint an author the reader has muted", () => {
    cached.value = twoRows();

    renderRepaint(["bob"]);
    navigateTo({ filter: "hot", tag: "" });

    expect(screen.getByTestId("entries")).toHaveTextContent("two");
    expect(screen.getByTestId("entries")).not.toHaveTextContent("one");
  });

  it("leaves the current page alone when every cached row is muted", () => {
    cached.value = { pages: [[{ author: "bob", permlink: "one" }]], pageParams: [null] };

    const { container } = renderRepaint(["bob"]);
    navigateTo({ filter: "hot", tag: "" });

    expectChildrenOnly(container);
  });

  it("honours the destination's no-reblog filter", () => {
    cached.value = {
      pages: [
        [
          { author: "bob", permlink: "own" },
          { author: "carol", permlink: "reblogged", reblogged_by: ["dave"] }
        ]
      ],
      pageParams: [null]
    };

    renderRepaint();
    navigateTo({ filter: "feed", tag: "@viewer", noReblog: true });

    expect(screen.getByTestId("entries")).toHaveTextContent("own");
    expect(screen.getByTestId("entries")).not.toHaveTextContent("reblogged");
  });
});
