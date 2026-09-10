import React from "react";
import { describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { EAGER_THUMB_CARD_COUNT } from "@/features/shared/entry-list-item/thumb-lcp";

// Streams the real feed page through React's server renderer and asserts on the
// HTML a browser would receive: the first cards must be part of the shell,
// never inside a hidden segment that a later swap script reveals (#1786).
//
// progressiveChunkSize is forced tiny so React outlines any completed Suspense
// boundary the way it does in production, where the head and navbar alone
// exceed the 12.8 KB default: a <Suspense> re-introduced anywhere above the
// cards shows up here as `<div hidden id="S:n">` around them and fails the
// test. A route-level loading.tsx cannot be exercised through a component
// render; the structure spec next to this one pins its absence, on the route
// AND on every ancestor segment.
//
// Both branches of the page are streamed. One page file serves /trending,
// /hot, /created, /payout, /muted, /promoted, every /:filter/:tag, /tags/:tag,
// /@user/feed and /feed/{comments,replies}/@user — all of which take the
// default branch — while ?before= renders a different tree entirely
// (server-rendered archive page + crawlable pager, no infinite list). Pinning
// only page 1 would leave half the route unguarded.

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ host: "ecency.com" })
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/hot/photography",
  useParams: () => ({ sections: ["hot", "photography"] }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  }),
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  }
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false })
}));

vi.mock("next/dynamic", () => ({ default: () => () => null }));

// The global SDK mock stays in place: importing the real SDK here would pull a
// second React copy (vitest has no react-query alias, next.config does), and
// every SDK hook under the page then throws on a null dispatcher — verified,
// FollowTagBtn's mutation is the first to go.
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/features/i18n", () => ({ initI18next: async () => undefined }));
vi.mock("@/utils/server-app-base", () => ({ getServerAppBase: async () => "https://ecency.com" }));

vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

const fixtures = vi.hoisted(() => ({ entries: [] as any[], archive: [] as any[] }));

// The feed's data seam. The page prefetches page 1 and the client list reads it
// back through usePostsFeedQuery; both are pinned here so the spec is about
// WHERE the cards land in the stream, not about which node answered.
vi.mock("@/api/queries", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/api/queries");
  const { mockEntry } = await import("@/specs/test-utils");
  fixtures.entries = [0, 1, 2].map((i) =>
    mockEntry({
      author: "alice",
      permlink: `card-${i}`,
      title: `Feed card ${i} in the shell`,
      body: "Body of a feed card.",
      category: "photography",
      json_metadata: { tags: ["photography"], image: [`https://images.ecency.com/p/card-${i}.png`] }
    })
  );
  fixtures.archive = [0, 1].map((i) =>
    mockEntry({
      author: "bob",
      permlink: `archive-${i}`,
      title: `Archive card ${i} in the shell`,
      body: "Body of an archive card.",
      category: "photography",
      json_metadata: { tags: ["photography"] }
    })
  );
  const page = { pages: [fixtures.entries], pageParams: [undefined] };
  return {
    ...actual,
    prefetchGetPostsFeedQuery: async () => page,
    getPostsFeedQueryData: () => page,
    usePostsFeedQuery: () => ({
      data: page,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn()
    })
  };
});

// Siblings of the cards that are not on the LCP path and drag network-backed
// SDK hooks into the render. The tag header keeps a placeholder element so its
// position above the list is still occupied.
vi.mock("@/app/(dynamicPages)/feed/_components/tag-feed-header", () => ({
  TagFeedHeader: () => <div data-tag-header="" />
}));

// The card's action bar — vote, payout, votes, reblog, tip, menu — is the heavy
// interactive cluster EntryListItem already defers behind HydrateOnVisible for
// below-the-fold rows. Rendering only its placeholder here is what production
// ships for every card past the second one, and it keeps a dozen SDK mutation
// hooks out of a spec that is about the title and thumbnail. It sits BELOW the
// title in the tree, so it cannot hide what this spec measures.
vi.mock("@/features/shared/hydrate-on-visible", () => ({
  HydrateOnVisible: ({ placeholder }: { placeholder?: React.ReactNode }) => <>{placeholder}</>
}));

// The mute filter is a client query with its own specs; here it would only
// decide which rows exist, and this spec is about where the rows land.
vi.mock("@/features/shared/entry-list-item/use-muted-authors", () => ({
  useMutedAuthors: () => undefined,
  useVisibleEntries: (entries: unknown[]) => entries
}));

// The outer feed layout's sidebar furniture. None of it is on the card path,
// all of it reaches SDK query builders the global mock does not stand in for,
// and none of it is touched by the change this file guards. The tab bar is
// NOT mocked: it hosts the per-Link pending probe, which has to prove it
// renders nothing on the server.
vi.mock("@/app/_components/my-favorites-widget", () => ({ MyFavoritesWidget: () => null }));
vi.mock("@/app/_components/trending-tags-card", () => ({ TrendingTagsCard: () => null }));
vi.mock("@/app/_components/top-communities-widget", () => ({ TopCommunitiesWidget: () => null }));
vi.mock("@/features/shared/navbar", () => ({ Navbar: () => null }));
vi.mock("@/features/shared/feedback", () => ({ Feedback: () => null }));

vi.mock("@/features/seo/ranked-archive", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/features/seo/ranked-archive")),
  fetchRankedCursorPage: async () => ({
    entries: fixtures.archive,
    nextCursor: { author: "bob", permlink: "archive-older" }
  })
}));

async function streamElement(element: React.ReactElement): Promise<string> {
  const { renderToReadableStream } = await import("react-dom/server.browser");
  const { getQueryClient } = await import("@/core/react-query");
  const stream = await renderToReadableStream(
    <QueryClientProvider client={getQueryClient()}>{element}</QueryClientProvider>,
    { progressiveChunkSize: 512 }
  );
  await stream.allReady;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let html = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
  }
  return html;
}

async function streamPage(searchParams: Record<string, string>): Promise<string> {
  const { default: FeedPage } = await import("@/app/(dynamicPages)/feed/[...sections]/page");
  const element = await FeedPage({
    params: Promise.resolve({ sections: ["hot", "photography"] }),
    searchParams: Promise.resolve(searchParams)
  });
  return streamElement(element as React.ReactElement);
}

/**
 * Nothing React outlined, and no boundary of any kind, may sit between the
 * start of the document and the marker.
 *
 * The hidden-segment and placeholder checks catch a boundary React DECIDED to
 * outline. They are not enough on their own: React only outlines once the shell
 * has passed progressiveChunkSize, so a boundary wrapping the cards in a small
 * render is inlined and both checks stay green while production — where the
 * head and navbar alone blow past the threshold — would outline it. So the
 * boundary comments are counted too: React opens one with `<!--$-->` (or
 * `<!--$?-->` pending, `<!--$!-->` errored) and closes it with `<!--/$-->`, and
 * an unbalanced count before the marker means the marker is inside a boundary.
 */
function expectInShell(html: string, marker: string) {
  const at = html.indexOf(marker);
  expect(at, `${marker} missing from the streamed HTML`).toBeGreaterThan(-1);

  const firstHidden = html.indexOf("<div hidden id=");
  if (firstHidden !== -1) {
    expect(at).toBeLessThan(firstHidden);
  }
  const firstPlaceholder = html.indexOf("<template id=");
  if (firstPlaceholder !== -1) {
    expect(at).toBeLessThan(firstPlaceholder);
  }

  const before = html.slice(0, at);
  const opened = (before.match(/<!--\$[?!]?-->/g) ?? []).length;
  const closed = (before.match(/<!--\/\$-->/g) ?? []).length;
  expect(opened - closed, `${marker} is inside an open Suspense boundary`).toBe(0);
}

describe("feed page streamed HTML", () => {
  it("ships the first cards in the shell", { timeout: 20000 }, async () => {
    const html = await streamPage({});
    expect(html).toContain("entry-list-item");
    expectInShell(html, "Feed card 0 in the shell");
    expectInShell(html, "Feed card 1 in the shell");
  });

  // The eager card's own <img> and the preload React hoists for it are the LCP
  // path, so both are pinned here: a thumbnail that stops server-rendering (a
  // client-only import, a lazy branch) would leave every other assertion in
  // this file green while the thing the change exists to paint disappeared.
  // The layout is streamed with the page because it used to wrap a preload of
  // its own in a Suspense; it is now a pass-through, and this test is what
  // would notice a boundary coming back into it.
  it("ships the eager card's image and its preload in the shell", { timeout: 20000 }, async () => {
    const { default: FeedPage } = await import("@/app/(dynamicPages)/feed/[...sections]/page");
    const { default: FeedSectionsLayout } = await import(
      "@/app/(dynamicPages)/feed/[...sections]/layout"
    );
    const params = Promise.resolve({ sections: ["hot", "photography"] });
    const page = await FeedPage({ params, searchParams: Promise.resolve({}) });
    const html = await streamElement(
      FeedSectionsLayout({ params, children: page as React.ReactNode }) as React.ReactElement
    );

    expectInShell(html, "Feed card 0 in the shell");
    expect(html).not.toContain("<div hidden id=");
    expect(html).not.toContain("<template id=");

    // The card renders its thumbnail server-side. Card 0 emits two <img>s: the
    // LQIP blur layer and the real one, and only the second carries the eager
    // hints, so match on those rather than on the first tag that mentions the
    // image.
    const imgs = (html.match(/<img[^>]*>/g) ?? []).filter((t) => t.includes("card-0"));
    expect(imgs.length, "card 0 renders no <img> in the SSR output").toBeGreaterThan(0);
    const eager = imgs.find((t) => t.includes('fetchPriority="high"'));
    expect(eager, "card 0's thumbnail is not the eager/high-priority one").toBeTruthy();
    expect(eager!).toContain('loading="eager"');
    expectInShell(html, eager!);

    // ...and next/image hoists a preload for it, ahead of the card itself.
    const preload = html.match(/<link[^>]+rel="preload"[^>]+card-0[^>]*>/);
    expect(preload, "no hoisted preload for the eager card").toBeTruthy();
    expect(html.indexOf(preload![0])).toBeLessThan(html.indexOf("Feed card 0 in the shell"));
  });

  // The OUTER feed layout, streamed with the route layout and the page beneath
  // it. That layout gained a client wrapper around `{children}` in #1789 — the
  // cached repaint, which paints the reader's own rows for the feed a soft
  // navigation is heading to. It has no server render at all (its stores return
  // nothing through getServerSnapshot), and this is the test that says so: a
  // wrapper that started emitting an element, or a boundary, would put the
  // cards behind a $RC swap script again exactly as loading.tsx did.
  it("ships the cards in the shell through the whole layout chain", { timeout: 20000 }, async () => {
    const { default: FeedPage } = await import("@/app/(dynamicPages)/feed/[...sections]/page");
    const { default: FeedSectionsLayout } = await import(
      "@/app/(dynamicPages)/feed/[...sections]/layout"
    );
    const { default: FeedSegmentLayout } = await import("@/app/(dynamicPages)/feed/layout");
    const params = Promise.resolve({ sections: ["hot", "photography"] });
    const page = await FeedPage({ params, searchParams: Promise.resolve({}) });
    const html = await streamElement(
      FeedSegmentLayout({
        children: FeedSectionsLayout({ params, children: page as React.ReactNode })
      }) as React.ReactElement
    );

    expectInShell(html, "Feed card 0 in the shell");
    expectInShell(html, "Feed card 1 in the shell");
    expect(html).not.toContain("<div hidden id=");
    expect(html).not.toContain("<template id=");
    // The repaint marks its own surface; on the server it must not exist.
    expect(html).not.toContain("data-feed-repaint");
    // Anti-vacuity: the chain really did render the layout around the page.
    expect(html).toContain("entry-page-content");
    expect(html).toContain("entry-index-menu");
  });

  it("ships the ?before= archive cards in the shell", { timeout: 20000 }, async () => {
    const html = await streamPage({ before: "bob/archive-cursor" });
    expect(html).toContain("entry-list-item");
    expectInShell(html, "Archive card 0 in the shell");
    // The crawlable pager is the whole point of this branch; it must be in the
    // shell too, or a crawler that does not run $RC never sees the chain.
    expectInShell(html, "archive-older");
  });

  // React hoists a <link rel="preload" as="image"> into <head> for every EAGER
  // <img> it renders in the shell. Each card draws two images — the LQIP blur
  // layer and the thumbnail — so a 20-card feed with an eager blur layer put
  // ~21 preloads in <head>, every one of them competing with the real LCP image
  // on a throttled link. While the feed sat behind loading.tsx those links were
  // held back with the boundary, which is why it took #1786 to expose it. Bound
  // the count to what the eager window can justify.
  it("preloads only the eager cards' images, not every card's", { timeout: 20000 }, async () => {
    const html = await streamPage({});
    const preloads = html.match(/<link[^>]+rel="preload"[^>]+as="image"[^>]*>/g) ?? [];
    const blur = preloads.filter((l) => l.includes("blur=1"));

    // Two images per eager card (placeholder + thumbnail) is the ceiling.
    expect(preloads.length).toBeLessThanOrEqual(EAGER_THUMB_CARD_COUNT * 2);
    expect(blur.length).toBeLessThanOrEqual(EAGER_THUMB_CARD_COUNT);
    // ...and the guard is only worth something while the page really renders
    // more cards than that.
    expect((html.match(/Feed card \d+ in the shell/g) ?? []).length).toBeGreaterThan(
      EAGER_THUMB_CARD_COUNT * 2
    );
  });
});
