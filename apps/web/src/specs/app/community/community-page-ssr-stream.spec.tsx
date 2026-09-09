import React from "react";
import { describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";

// Streams the real community feed page through React's server renderer and
// asserts on the HTML a browser would receive: the first card must be part of
// the shell, never inside a hidden segment that a later swap script reveals.
//
// progressiveChunkSize is forced tiny so React outlines any completed Suspense
// boundary the way it does in production, where the head, navbar and community
// card alone exceed the 12.8 KB default: a <Suspense> re-introduced anywhere
// above the list (page.tsx, a child component, an aliased import) shows up here
// as `<div hidden id="S:n">` around the cards and fails the test. A route-level
// loading.tsx cannot be exercised through a component render; the structure
// spec next to this one pins its absence, on the route AND on every ancestor
// segment.
//
// Both trees this page file renders are covered: the default feed (page 1 plus
// the client infinite list) and the ?before=<cursor> archive branch, which
// renders an EntryArchivePager instead and is served on the same URLs.

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ host: "ecency.com" })
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/created/hive-123456",
  useParams: () => ({ community: "hive-123456", tag: "created" }),
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
// every hook under the page would then throw.
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/features/i18n", () => ({ initI18next: async () => undefined }));
vi.mock("@/utils/server-app-base", () => ({ getServerAppBase: async () => "https://ecency.com" }));

// setup-any-spec replaces @/utils wholesale with two stubs. The cards read
// makeEntryPath, isCommunity and useEntryLocation from it, so opt back in to
// the real module — the assertion is about the real card markup.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

const CARD_TITLE = "First community card that has to reach the browser in the shell";
const ARCHIVE_TITLE = "First archived community card that has to reach the browser in the shell";

const fixtures = vi.hoisted(() => ({
  community: null as any,
  feed: [] as any[],
  archive: [] as any[]
}));

// The feed builders live in @ecency/sdk, which the global mock replaces, so the
// query options this module builds cannot be exercised. Stub the two entry
// points the page and its client children use: the server prefetch, and the
// hook that ProfileEntriesLayout / CommunityContentInfiniteList subscribe with.
vi.mock("@/api/queries", async () => {
  const { mockEntry } = await import("@/specs/test-utils");
  fixtures.feed = Array.from({ length: 20 }, (_, i) =>
    mockEntry({
      author: `author${i}`,
      permlink: `post-${i}`,
      category: "hive-123456",
      community: "hive-123456",
      community_title: "Test Community",
      title: i === 0 ? CARD_TITLE : `Community post ${i}`,
      body: `Body of community post ${i}. `.repeat(20),
      json_metadata: { tags: ["test"], app: "ecency/test" }
    })
  );
  return {
    prefetchGetPostsFeedQuery: async () => ({
      pages: [fixtures.feed],
      pageParams: [""]
    }),
    usePostsFeedQuery: () => ({
      data: undefined,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      dataUpdatedAt: 0
    })
  };
});

// fetchRankedCursorPage goes through the SDK's ranked-posts options too; the
// pure cursor helpers around it are the real ones, so the page still takes the
// archive branch for the same `before` values production accepts.
vi.mock("@/features/seo/ranked-archive", async () => {
  const actual = await vi.importActual<typeof import("@/features/seo/ranked-archive")>(
    "@/features/seo/ranked-archive"
  );
  const { mockEntry } = await import("@/specs/test-utils");
  fixtures.archive = Array.from({ length: 20 }, (_, i) =>
    mockEntry({
      author: `older${i}`,
      permlink: `older-post-${i}`,
      category: "hive-123456",
      community: "hive-123456",
      community_title: "Test Community",
      title: i === 0 ? ARCHIVE_TITLE : `Older community post ${i}`,
      body: `Body of older community post ${i}. `.repeat(20),
      json_metadata: { tags: ["test"], app: "ecency/test" }
    })
  );
  return {
    ...actual,
    fetchRankedCursorPage: async () => ({
      entries: fixtures.archive,
      nextCursor: { author: "older19", permlink: "older-post-19" }
    })
  };
});

// getCommunityCache spreads getCommunityQueryOptions, which the global SDK mock
// does not provide. Keep the rest of the barrel real and hand the page a key it
// can seed.
vi.mock("@/core/caches", async () => ({
  ...(await vi.importActual<typeof import("@/core/caches")>("@/core/caches")),
  getCommunityCache: (name?: string) => ({
    queryKey: ["communities", name],
    queryFn: async () => fixtures.community,
    enabled: !!name
  })
}));

// The viewer's mute list is client-only data behind an SDK query builder the
// global mock omits. This spec streams an ANONYMOUS render, where
// useMutedAuthors resolves to undefined and useVisibleEntries is the identity —
// reproduce exactly that, so the card list is the real one.
vi.mock("@/features/shared/entry-list-item/use-muted-authors", () => ({
  useMutedAuthors: () => undefined,
  useVisibleEntries: <T,>(items: T[]) => items
}));

vi.mock("@/core/react-query", async () => {
  const actual = await vi.importActual<typeof import("@/core/react-query")>("@/core/react-query");
  const { mockCommunity } = await import("@/specs/test-utils");
  fixtures.community = mockCommunity({ name: "hive-123456", title: "Test Community" });
  return {
    ...actual,
    prefetchQuery: async (options: { queryKey: readonly unknown[] }) => {
      actual.getQueryClient().setQueryData(options.queryKey, fixtures.community);
      return fixtures.community;
    }
  };
});

// Siblings of the card list that are not on the LCP path and drag in network,
// debounced routing or lazy chunks. Each is replaced by an inert component;
// none of them may add a boundary above the cards, and the page keeps its own
// tree.
vi.mock("@/app/(dynamicPages)/community/[community]/_components/community-content-search", () => ({
  CommunityContentSearch: () => null
}));

// The card's action bar (vote/payout/votes/reblog/tip/menu/translate) is the
// heavy interactive cluster; the top two cards render it immediately, and it
// reaches for SDK mutations the global mock omits. It sits BELOW the title and
// summary in the card, so it is not on the LCP path this spec asserts about.
vi.mock("@/features/shared/entry-vote-btn", () => ({ EntryVoteBtn: () => null }));
vi.mock("@/features/shared/entry-payout", () => ({ EntryPayout: () => null }));
vi.mock("@/features/shared/entry-votes", () => ({ EntryVotes: () => null }));
vi.mock("@/features/shared/entry-reblog-btn", () => ({ EntryReblogBtn: () => null }));
vi.mock("@/features/shared/entry-tip-btn", () => ({ EntryTipBtn: () => null }));
vi.mock("@/features/shared/entry-menu", () => ({ EntryMenu: () => null }));
vi.mock("@/features/shared/entry-translate/translate-chip", () => ({ TranslateChip: () => null }));

async function streamPage(searchParams: Record<string, string>): Promise<string> {
  const { renderToReadableStream } = await import("react-dom/server.browser");
  const { getQueryClient } = await import("@/core/react-query");
  const { default: CommunityPostsPage } = await import(
    "@/app/(dynamicPages)/community/[community]/[tag]/page"
  );
  const element = await CommunityPostsPage({
    params: Promise.resolve({ community: "hive-123456", tag: "created" }),
    searchParams: Promise.resolve(searchParams)
  });
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

function expectCardInShell(html: string, title: string) {
  const card = html.indexOf("entry-list-item");
  expect(card).toBeGreaterThan(-1);
  expect(html).toContain(title);
  // The title is the card's own text, so it must be in the shell too.
  expect(html.indexOf(title)).toBeGreaterThan(card);

  // Anything outlined by React lands after the shell as a hidden segment.
  const firstHidden = html.indexOf("<div hidden id=");
  if (firstHidden !== -1) {
    expect(card).toBeLessThan(firstHidden);
    expect(html.indexOf(title)).toBeLessThan(firstHidden);
  }
  // No boundary placeholder (pending or outlined) may precede the cards.
  const firstPlaceholder = html.indexOf("<template id=");
  if (firstPlaceholder !== -1) {
    expect(card).toBeLessThan(firstPlaceholder);
    expect(html.indexOf(title)).toBeLessThan(firstPlaceholder);
  }
}

describe("community feed page streamed HTML", () => {
  it(
    "ships the first card in the shell, outside every hidden segment",
    { timeout: 20000 },
    async () => {
      expectCardInShell(await streamPage({}), CARD_TITLE);
    }
  );

  // ?before=<cursor> renders the archive tree (EntryArchivePager, no infinite
  // list). Same URLs, same cards, so it gets the same guarantee.
  it(
    "ships the first card in the shell on the ?before= archive branch",
    { timeout: 20000 },
    async () => {
      const html = await streamPage({ before: "older0/older-post-0" });
      expect(html).toContain("entry-archive-pager");
      expectCardInShell(html, ARCHIVE_TITLE);
    }
  );
});
