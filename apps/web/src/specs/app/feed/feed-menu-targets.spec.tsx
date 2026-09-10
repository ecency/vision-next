import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

// Every tab in the feed bar carries the catch-all segments its href resolves to
// (`FeedMenuItem.feed`), because the cached repaint needs the query key of the
// feed a navigation is heading TO and the hrefs here are the PUBLIC urls, which
// next.config rewrites before the route ever sees them (#1789).
//
// Two copies of the same fact drift. This is the test that stops them: it
// rebuilds the public url from `feed` and requires it to be the href the tab
// actually links to. A tab whose href moves without its `feed` moving would
// still navigate correctly and would silently repaint some OTHER feed's rows
// over the reader — the worst possible failure of this feature, and invisible
// to every other spec.

let mockSections: string[] = [];

vi.mock("next/navigation", () => ({
  useParams: () => ({ sections: mockSections }),
  useRouter: () => ({ push: vi.fn() })
}));

import { useFeedMenu, type FeedMenuItem } from "@/app/_components/entry-index-menu/use-feed-menu";

const mockedUseActiveAccount = vi.mocked(useActiveAccount);

function setLoggedIn(loggedIn: boolean) {
  mockedUseActiveAccount.mockReturnValue({
    activeUser: loggedIn ? ({ username: "alice" } as never) : null,
    username: loggedIn ? "alice" : null,
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: loggedIn,
    error: null,
    refetch: vi.fn()
  } as ReturnType<typeof useActiveAccount>);
}

/**
 * The public url the feed catch-all serves for a pair of segments.
 *
 * The inverse of next.config's feed rewrites, restricted to the shapes this bar
 * produces: `/feed/feed/@user` is published as `/@user/feed`, and everything
 * else as `/:filter(/:tag)`.
 */
function publicHref({ filter, tag }: FeedMenuItem["feed"]): string {
  if (filter === "feed" && tag.startsWith("@")) {
    return `/${tag}/feed`;
  }
  return tag ? `/${filter}/${tag}` : `/${filter}`;
}

function allItems(sections: string[], loggedIn: boolean): FeedMenuItem[] {
  mockSections = sections;
  setLoggedIn(loggedIn);
  const { result } = renderHook(() => useFeedMenu());
  return [...result.current.sources, ...result.current.sorts, ...result.current.additionalFilters];
}

const ROUTES: { name: string; sections: string[]; loggedIn: boolean }[] = [
  { name: "logged-out global", sections: [], loggedIn: false },
  { name: "logged-out hot", sections: ["hot"], loggedIn: false },
  { name: "signed-in global", sections: ["trending"], loggedIn: true },
  { name: "a hashtag feed", sections: ["created", "photography"], loggedIn: true },
  { name: "a community feed", sections: ["hot", "hive-125125"], loggedIn: true },
  { name: "the communities feed", sections: ["payout", "my"], loggedIn: true },
  { name: "the following feed", sections: ["feed", "@alice"], loggedIn: true },
  { name: "the muted feed", sections: ["muted"], loggedIn: true }
];

describe("feed menu navigation targets", () => {
  beforeEach(() => {
    mockSections = [];
    mockedUseActiveAccount.mockReset();
  });

  it.each(ROUTES)("$name: every tab's feed matches its href", ({ sections, loggedIn }) => {
    const items = allItems(sections, loggedIn);

    // Anti-vacuity: an empty bar would pass every assertion below.
    expect(items.length).toBeGreaterThan(2);

    for (const item of items) {
      expect(item.feed, item.id).toBeDefined();
      expect(publicHref(item.feed), `${item.id} -> ${item.href}`).toBe(item.href);
    }
  });

  // The one target the rewrite makes non-obvious, called out on its own so the
  // shape is pinned rather than merely round-tripped.
  it("sends the Following tab to the account-posts feed, not to a `@alice` tag", () => {
    const following = allItems(["feed", "@alice"], true).find((i) => i.id === "following");

    expect(following?.href).toBe("/@alice/feed");
    expect(following?.feed).toEqual({ filter: "feed", tag: "@alice" });
  });

  it("keeps the tag on a sort switch", () => {
    const trending = allItems(["created", "photography"], false).find((i) => i.id === "trending");

    expect(trending?.href).toBe("/trending/photography");
    expect(trending?.feed).toEqual({ filter: "trending", tag: "photography" });
  });

  it("drops the tag on the global tab", () => {
    const global = allItems(["created", "photography"], true).find((i) => i.id === "global");

    expect(global?.href).toBe("/created");
    expect(global?.feed).toEqual({ filter: "created", tag: "" });
  });
});
