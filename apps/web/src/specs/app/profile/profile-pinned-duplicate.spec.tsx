import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Entry, FullAccount } from "@/entities";
import { mockEntry, mockFullAccount } from "@/specs/test-utils";

// A pinned post rendered twice: once as the pinned card, once from the feed
// (#1807). Reproduced on /@m16uellop, where `posts` page 1 carries the
// account's own CROSS-POST of the pinned post
// (`haciendo-anillo-engastado-de-onix-hive-148441`). The card renders the post
// a cross-post wraps, not the wrapper —
//
//   const entry = entryProp.original_entry || entryProp;   entry-list-item
//
// — so that row came out with the pinned post's author, title and element id,
// while the dedupe compared raw permlinks and saw two different posts.
//
// The card chain is rendered for real here on purpose: the miss lives in the
// gap between what the filter compares (`item.permlink`) and what the card
// shows (`original_entry`), and a stubbed EntryListContent closes that gap by
// construction and would pass either way.
//
// NOT covered, because it is a different defect: the same profile also renders
// `shinaraa-in-the-magic-forest` twice, as the post AND as the account's own
// cross-post of it, with neither of them pinned. That duplicate is in the feed
// itself and needs its own issue.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false })
}));

// next/image needs Next's build-time image config, which no component render has.
vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} {...rest} />
}));

vi.mock("next/dynamic", () => ({ default: () => () => null }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/@alice",
  useParams: () => ({ username: "@alice" }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  })
}));

vi.mock("@/utils", async () => ({
  ...(await vi.importActual<typeof import("@/utils")>("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// The card's deferred action island (vote, payout, reblog, tip, menu) is a tree
// of query observers and floating-ui popovers that has nothing to do with which
// entries reach the list. Its placeholder is what production renders for every
// card past the top two anyway.
vi.mock("@/features/shared/hydrate-on-visible", () => ({
  HydrateOnVisible: ({ placeholder }: { placeholder?: React.ReactNode }) => <>{placeholder}</>
}));

// Community titles resolve through a query the global SDK mock does not carry;
// disabled options are what a non-community category yields in production.
vi.mock("@/core/caches/communities-cache", () => ({
  getCommunityCache: () => ({ queryKey: ["communities", "stub"], enabled: false })
}));

// The mute list is a per-viewer client query with no server counterpart.
vi.mock("@/features/shared/entry-list-item/use-muted-authors", () => ({
  useMutedAuthors: () => undefined,
  useVisibleEntries: (entries: unknown[]) => entries
}));

const feedQueryResult = vi.hoisted(() => ({
  data: undefined as unknown,
  fetchNextPage: vi.fn(),
  isFetching: false,
  isLoading: false,
  hasNextPage: false,
  isFetchingNextPage: false
}));

vi.mock("@/api/queries", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/api/queries")),
  getPostsFeedQueryData: () => undefined,
  usePostsFeedQuery: () => feedQueryResult
}));

// The pinned entry reaches the server component through the query cache, the
// way page.tsx's `prefetchQuery(getEntryQueryByPath(...))` puts it there.
const pinnedInCache = vi.hoisted(() => ({ entry: undefined as unknown }));

vi.mock("@/core/react-query", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/core/react-query")),
  getQueryData: () => pinnedInCache.entry
}));

import { ProfileEntriesList } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-list";
import {
  entryIdentityKeys,
  isPinnedDuplicate,
  pinnedIdentityKeys
} from "@/app/(dynamicPages)/profile/[username]/_helpers/pinned-permlink";

const PINNED_PERMLINK = "haciendo-anillo-engastado-de-onix";

const account = mockFullAccount({
  name: "alice",
  profile: { name: "Alice", pinned: PINNED_PERMLINK } as FullAccount["profile"]
});

const pinnedEntry = mockEntry({
  author: "alice",
  permlink: PINNED_PERMLINK,
  category: "jewelry",
  title: "Haciendo anillo engastado de onix"
});

/** The account's own cross-post of the pinned post, as the bridge + SDK hand it
 *  over: a separate post whose `original_entry` the SDK resolved. */
const pinnedCrossPost = mockEntry({
  author: "alice",
  permlink: `${PINNED_PERMLINK}-hive-148441`,
  category: "hive-148441",
  title: "Haciendo anillo engastado de onix",
  json_metadata: {
    tags: ["cross-post"],
    original_author: "alice",
    original_permlink: PINNED_PERMLINK
  },
  original_entry: pinnedEntry
});

const other = (permlink: string) =>
  mockEntry({ author: "alice", permlink, category: "jewelry", title: `Post ${permlink}` });

/** One entry per rendered card, identified the way the card identifies itself. */
async function renderedCardIds(firstPage: Entry[]) {
  feedQueryResult.data = { pageParams: [undefined], pages: [firstPage] };

  const element = await ProfileEntriesList({
    section: "posts",
    account,
    initialFeed: { pageParams: [undefined], pages: [firstPage] } as never
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(
    <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
  );

  return Array.from(container.querySelectorAll(".entry-list-item")).map((card) =>
    card.querySelector(".author-part")?.getAttribute("id")
  );
}

describe("profile pinned post is not rendered twice", () => {
  it("drops the feed's cross-post of the pinned post", async () => {
    pinnedInCache.entry = pinnedEntry;

    const ids = await renderedCardIds([other("first"), pinnedCrossPost, other("second")]);

    // Pinned card first, then the feed WITHOUT the cross-post that renders it.
    expect(ids).toEqual(["alice-haciendo-anillo-engastado-de-onix", "alice-first", "alice-second"]);
  });

  // Anti-vacuity: the same fixture with a plain (non cross-post) row proves the
  // list really does render the rows it is given, so the assertion above is
  // about the filter and not about a card that failed to render.
  it("still drops the pinned post's own row from the feed", async () => {
    pinnedInCache.entry = pinnedEntry;

    const ids = await renderedCardIds([other("first"), pinnedEntry, other("second")]);

    expect(ids).toEqual(["alice-haciendo-anillo-engastado-de-onix", "alice-first", "alice-second"]);
  });

  it("renders every unrelated row", async () => {
    pinnedInCache.entry = pinnedEntry;

    const ids = await renderedCardIds([other("first"), other("second")]);

    expect(ids).toEqual(["alice-haciendo-anillo-engastado-de-onix", "alice-first", "alice-second"]);
  });

  // Filtering without rendering a replacement is how a post disappears from a
  // profile altogether: no pinned card, and no feed row either.
  it("keeps the post in the feed when no pinned card was rendered", async () => {
    pinnedInCache.entry = undefined;

    const ids = await renderedCardIds([other("first"), pinnedCrossPost, other("second")]);

    expect(ids).toEqual(["alice-first", "alice-haciendo-anillo-engastado-de-onix", "alice-second"]);
  });
});

describe("pinned identity keys", () => {
  it("gives a cross-post both its own identity and the one it renders", () => {
    expect(entryIdentityKeys(pinnedCrossPost)).toEqual([
      `alice/${PINNED_PERMLINK}-hive-148441`,
      `alice/${PINNED_PERMLINK}`
    ]);
  });

  it("normalises case and whitespace from the profile's metadata", () => {
    const keys = pinnedIdentityKeys("alice", `  ${PINNED_PERMLINK.toUpperCase()}  `, pinnedEntry);
    expect(keys).toContain(`alice/${PINNED_PERMLINK}`);
  });

  it("is empty, and matches nothing, without a pinned entry", () => {
    const keys = pinnedIdentityKeys("alice", PINNED_PERMLINK, undefined);
    expect(keys).toEqual([]);
    expect(isPinnedDuplicate(pinnedEntry, keys)).toBe(false);
  });

  it("matches a pinned entry that is itself a cross-post of a feed row", () => {
    // getPostQueryOptions does not resolve cross-posts, so a profile pinning
    // `x-hive-1` gets the wrapper back; the feed still holds `x`.
    const keys = pinnedIdentityKeys("alice", `${PINNED_PERMLINK}-hive-148441`, pinnedCrossPost);
    expect(isPinnedDuplicate(pinnedEntry, keys)).toBe(true);
  });

  it("does not match an unrelated post", () => {
    const keys = pinnedIdentityKeys("alice", PINNED_PERMLINK, pinnedEntry);
    expect(isPinnedDuplicate(other("first"), keys)).toBe(false);
  });
});
