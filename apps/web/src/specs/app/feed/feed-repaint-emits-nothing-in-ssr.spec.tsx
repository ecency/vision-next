import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryKeys } from "@ecency/sdk";

// Byte-exact companion to specs/app/feed-page-ssr-stream.spec.tsx.
//
// That file proves the CARDS reach the shell through the whole layout chain.
// This one proves the reason they can: the two client modules #1789 added above
// them render nothing whatsoever on the server. Asserting on the exact string
// rather than on "no hidden segment" is the point — a wrapper element, a
// comment, a stray whitespace text node is enough to change the HTML the change
// promised not to touch, and every one of those passes a substring check.
//
// Deliberately does NOT mock next/link: the desktop probe calls the real
// `useLinkStatus`, and part of what is under test is that the real hook is safe
// to call in a server render, outside any <Link>. The streamed chain spec mocks
// it, so without this file nothing exercises the real one.

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
  getMutedUsersQueryOptions: vi.fn((username?: string) => ({
    queryKey: QueryKeys.accounts.mutedUsers(username!),
    queryFn: async () => [] as string[],
    enabled: false
  }))
}));

const cached = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock("@/api/queries", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/api/queries")),
  getPostsFeedQueryData: vi.fn(() => cached.value)
}));

import { FeedCachedRepaint } from "@/app/(dynamicPages)/feed/_components/feed-cached-repaint";
import { FeedLinkPendingProbe } from "@/app/(dynamicPages)/feed/_components/feed-link-pending-probe";
import {
  resetFeedNavigationTarget,
  setFeedNavigationTarget
} from "@/app/(dynamicPages)/feed/_components/feed-navigation-intent";

const CHILD = `<p id="child">the page</p>`;

async function streamToString(element: React.ReactElement): Promise<string> {
  const { renderToReadableStream } = await import("react-dom/server.browser");
  const { getQueryClient } = await import("@/core/react-query");
  const stream = await renderToReadableStream(
    <QueryClientProvider client={getQueryClient()}>{element}</QueryClientProvider>
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

describe("feed repaint emits nothing in the server render", () => {
  afterEach(() => {
    cached.value = undefined;
    resetFeedNavigationTarget();
  });

  it("streams its children and nothing else", async () => {
    const html = await streamToString(
      <FeedCachedRepaint>
        <p id="child">the page</p>
      </FeedCachedRepaint>
    );

    expect(html).toBe(CHILD);
  });

  // The one that matters. A navigation target and a warm cache are the exact
  // conditions under which this component paints in the browser; the server
  // snapshot of the navigation store is null unconditionally, so the same
  // conditions must still produce the children alone. Anything else would be a
  // per-request module singleton leaking into SSR — and a hydration mismatch on
  // the route whose whole cost model is "the cards are plain shell HTML".
  it("streams its children even with a target set and rows cached", async () => {
    cached.value = {
      pages: [[{ author: "bob", permlink: "one" }]],
      pageParams: [null]
    };
    setFeedNavigationTarget({ filter: "hot", tag: "photography", noReblog: false });

    const html = await streamToString(
      <FeedCachedRepaint>
        <p id="child">the page</p>
      </FeedCachedRepaint>
    );

    expect(html).toBe(CHILD);
  });

  it("streams nothing for the per-link pending probe", async () => {
    const html = await streamToString(
      <FeedLinkPendingProbe target={{ filter: "hot", tag: "", noReblog: false }} />
    );

    expect(html).toBe("");
  });
});
