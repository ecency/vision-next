import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// The feed catch-all ships its first cards inside the SSR shell. Nothing above
// the card list may be a Suspense boundary: page.tsx awaits the feed page and
// then renders it through client components, so a boundary anywhere above them
// is emitted pending — skeleton in the shell, cards in a hidden <div id="S:n">
// chunk that a $RC swap script reveals only once the parser reaches it. On a
// throttled MotoG/4G-slow run that route measured LCP 9.07s, Speed Index 6.20s
// and shipped 5 hidden segments with 4 swap scripts (#1786).
//
// A loading module counts as such a boundary for its OWN segment AND for every
// segment nested under it, so the absence has to be checked on the route and on
// every ancestor segment up to app/, not just next to page.tsx.
const APP = path.resolve(__dirname, "../../app");
const DYNAMIC = path.join(APP, "(dynamicPages)");
const FEED = path.join(DYNAMIC, "feed");
const ROUTE = path.join(FEED, "[...sections]");
// Route first, then every ancestor segment. Route groups are segments on disk
// even though they are not path segments, and a loading.tsx in one applies to
// everything under it, so "(dynamicPages)" belongs in this list.
const SEGMENTS = [ROUTE, FEED, DYNAMIC, APP];
const LOADING_NAMES = ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"];

const SHARED = path.resolve(__dirname, "../../features/shared");

/**
 * Source with comments removed.
 *
 * Every check below reads for `<Suspense`, and the files it reads are the ones
 * whose comments explain why the boundary is gone. Matching prose would make
 * this spec fail on its own documentation — and, worse, pass once someone
 * deleted the prose. Only the code is evidence.
 */
function read(file: string) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

function pageSource() {
  return read(path.join(ROUTE, "page.tsx"));
}

describe("feed page has no SSR skeleton boundary above the cards", () => {
  it("route directory exists", () => {
    expect(fs.existsSync(path.join(ROUTE, "page.tsx"))).toBe(true);
  });

  it("has no loading module on the route or on any ancestor segment", () => {
    for (const dir of SEGMENTS) {
      for (const name of LOADING_NAMES) {
        expect(
          fs.existsSync(path.join(dir, name)),
          `${path.relative(APP, dir) || "app"}/${name}`
        ).toBe(false);
      }
    }
  });

  // One page file serves /trending, /hot, /created, /payout, /muted, /promoted,
  // every /:filter/:tag and /tags/:tag, /@user/feed, and the directly
  // addressable /feed/comments/@user and /feed/replies/@user. There is no
  // second page under this segment that could keep a skeleton of its own.
  it("is the only page under the feed segment", () => {
    const pages = fs
      .readdirSync(FEED, { withFileTypes: true, recursive: true } as never)
      .filter((e: fs.Dirent) => e.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(e.name));
    expect(pages.length).toBe(1);
  });

  // Both branches of the page. The default branch hands the cards to FeedList
  // inside FeedLayout; the ?before= cursor branch renders a different tree
  // (EntryListContent + EntryArchivePager, no infinite list). A guard that
  // pinned only one of them would leave half the route unpinned.
  it("renders no <Suspense> in the page, on either branch", () => {
    const source = pageSource();
    const fn = source.indexOf("export default async function FeedPage");
    expect(fn).toBeGreaterThan(-1);

    // Anti-vacuity: the assertion below says nothing unless both branches are
    // still here and still rendered by this function.
    const cursorBranch = source.indexOf("<EntryListContent", fn);
    const defaultBranch = source.indexOf("<FeedList", fn);
    expect(cursorBranch).toBeGreaterThan(fn);
    expect(defaultBranch).toBeGreaterThan(cursorBranch);

    expect(source).not.toMatch(/<(React\.)?Suspense/);
    expect(source).not.toMatch(/\bSuspense\b.*from "react"/);
  });

  // The route layout used to hold one <Suspense> around a thumbnail preload.
  // That preload only re-emitted links the eager cards already hoist through
  // next/image (measured on the streamed HTML: identical links at byte 0 either
  // way), so it is gone and this route now has no boundary anywhere on its
  // chain. A sibling boundary here would be defensible; one around {children}
  // would put the cards back in a hidden segment, and the difference is one
  // easy edit, so pin the simpler property: no boundary in this file at all.
  it("keeps the route layout free of Suspense", () => {
    const file = path.join(ROUTE, "layout.tsx");
    const source = read(file);
    expect(source).not.toMatch(/<(React\.)?Suspense/);
    expect(source).not.toMatch(/\bSuspense\b[^\n]*from "react"/);
    expect(source).toContain("{children}");
  });

  // #1789 put a client wrapper around `{children}` in the feed layout — the
  // cached repaint. It is the one component in this tree allowed to decide what
  // renders in place of the page, so it is the one most likely to grow a
  // boundary or a client-only import. Both would put the cards back behind a
  // swap script for every URL this route serves.
  it("keeps the feed layout's repaint wrapper free of Suspense and client-only imports", () => {
    const file = path.join(FEED, "_components/feed-cached-repaint.tsx");
    expect(fs.existsSync(file), file).toBe(true);
    const source = read(file);

    expect(source).not.toMatch(/<(React\.)?Suspense/);
    expect(source).not.toMatch(/\bSuspense\b[^\n]*from "react"/);
    expect(source).not.toMatch(/ssr:\s*false/);
    // Anti-vacuity: it still has children to pass through, and still returns
    // them untouched on the path the server render takes.
    expect(source).toContain("{children}");

    // ...and the layout really does route the page through it, or the checks
    // above are about a file nothing renders.
    const layout = read(path.join(FEED, "layout.tsx"));
    expect(layout).toMatch(/<FeedCachedRepaint>\s*\{children\}\s*<\/FeedCachedRepaint>/);
  });

  it("no other layout on the chain adds Suspense above the page", () => {
    let checked = 0;
    for (const dir of SEGMENTS) {
      for (const name of ["layout.tsx", "template.tsx"]) {
        const file = path.join(dir, name);
        if (!fs.existsSync(file)) continue;
        checked += 1;
        expect(read(file), path.relative(APP, file)).not.toMatch(/<(React\.)?Suspense/);
      }
    }
    // The route layout, the feed layout and the root layout at least.
    expect(checked).toBeGreaterThanOrEqual(3);
  });

  // page.tsx hands the entries to the components below, which reach the card
  // title. A <Suspense> — or a client-only dynamic import, which empties the
  // server render just as thoroughly — in any of them would hide the cards
  // again without touching page.tsx, so the chain is pinned too.
  it("no component between the page and a card adds Suspense or drops SSR", () => {
    const chain = [
      path.join(FEED, "_components/feed-layout.tsx"),
      path.join(FEED, "_components/feed-list.tsx"),
      path.join(SHARED, "entry-archive-pager/index.tsx"),
      path.join(SHARED, "entry-list-content/index.tsx"),
      path.join(SHARED, "entry-list-item/index.tsx"),
      path.join(SHARED, "entry-list-item/entry-list-item-muted-content.tsx"),
      // The LCP image itself: a client-only dynamic import here would empty the
      // card of the one element the whole change exists to paint early.
      path.join(SHARED, "entry-list-item/entry-list-item-thumbnail.tsx")
    ];
    for (const file of chain) {
      expect(fs.existsSync(file), file).toBe(true);
      const source = read(file);
      expect(source, file).not.toMatch(/<(React\.)?Suspense/);
      expect(source, file).not.toMatch(/ssr:\s*false/);
    }
    // The chain list is only worth something if it still ends at a card and at
    // the image that card paints.
    const card = read(path.join(SHARED, "entry-list-item/entry-list-item-muted-content.tsx"));
    expect(card).toMatch(/item-title/);
    expect(card).toMatch(/entry\.title/);
    const thumb = read(path.join(SHARED, "entry-list-item/entry-list-item-thumbnail.tsx"));
    expect(thumb).toMatch(/priority=\{isThumbLcp\}/);
  });

  // The route children reach this page through a chain of wrappers, not just
  // the last one: RootLayout -> Providers -> NewsletterRuntimeProvider ->
  // ClientProviders -> {children}. A <Suspense> around {children} in ANY of
  // them hides every page body in the app behind a swap script, and a guard
  // that reads only client-providers.tsx leaves the first two unwatched.
  it("no provider in the root wrapper chain puts the route children in Suspense", () => {
    const chain = [
      path.join(APP, "providers.tsx"),
      path.resolve(APP, "../features/newsletter/runtime.tsx"),
      path.join(APP, "client-providers.tsx")
    ];
    let sawChildren = 0;
    for (const file of chain) {
      expect(fs.existsSync(file), file).toBe(true);
      const source = fs.readFileSync(file, "utf8");
      if (/\{(props\.)?children\}/.test(source)) sawChildren += 1;
      const blocks =
        source.match(/<(React\.)?Suspense\b[^>]*>[\s\S]*?<\/(React\.)?Suspense>/g) ?? [];
      for (const boundary of blocks) {
        expect(boundary, file).not.toMatch(/\{(props\.)?children\}/);
      }
    }
    // Every file in the chain must actually hand children on, or the list has
    // drifted from the tree it claims to describe.
    expect(sawChildren).toBe(chain.length);
  });
});
