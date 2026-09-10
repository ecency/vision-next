import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// The profile TAB routes — /@user/posts, /@user/blog, /@user/comments,
// /@user/replies — ship their cards inside the SSR shell. #1787 removed
// profile/[username]/loading.tsx but deliberately left [section]/loading.tsx
// alone, because that segment had a module of its own and nothing had measured
// what it cost. #1805 measured it, on production:
//
//   /@ecency/comments  first card at 69.2% of the document, 1 pending boundary,
//                      2 hidden segments, 1 swap script
//   /@ecency/replies   68.2%, same three
//   /@ecency/blog      62.0%, same three
//   /@ecency (fixed)   15.2%, none of the three
//
// The mechanism is the index's, one segment down: page.tsx awaits the account
// and the first feed page before it returns any JSX, so a boundary above it is
// emitted PENDING — skeleton in the shell, cards in a hidden <div id="S:n">
// chunk that a $RC swap script reveals only when the parser reaches it.
//
// What this does NOT claim is an LCP win. Measured with PageSpeed Insights on
// all three tabs, the LCP element is the profile card's cover image
// (`div.pb-20 > div.reading-surface > div.rounded-xl > img.absolute`,
// /assets/promote-wave-bg.jpg at 378x96), which the profile LAYOUT renders
// outside the boundary either way. What moves is when the cards themselves
// reach the browser, and whether that nets out in LCP or Speed Index is a
// production before/after, not something this file can assert.
//
// A loading module counts as such a boundary for its OWN segment AND for every
// segment nested under it, so the absence has to be checked on the route and on
// every ancestor segment up to app/, not just next to page.tsx.
const APP = path.resolve(__dirname, "../../app");
const DYNAMIC = path.join(APP, "(dynamicPages)");
const PROFILE = path.join(DYNAMIC, "profile");
const USERNAME = path.join(PROFILE, "[username]");
const ROUTE = path.join(USERNAME, "[section]");
// Route first, then every ancestor segment. Route groups are segments on disk
// even though they are not path segments, and a loading.tsx in one applies to
// everything under it, so "(dynamicPages)" belongs in this list.
const SEGMENTS = [ROUTE, USERNAME, PROFILE, DYNAMIC, APP];
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

/**
 * A boundary can also arrive under an alias — `import { Suspense as Gate }` and
 * then `<Gate>` — which no amount of matching on `<Suspense` will see. Rejecting
 * the aliased IMPORT is what closes that, and it is the one form the streamed
 * spec next door cannot be relied on to catch for files it does not render.
 */
function assertNoSuspense(source: string, label: string) {
  expect(source, label).not.toMatch(/<(React\.)?Suspense/);
  expect(source, `${label}: aliased Suspense import`).not.toMatch(
    /import\s*\{[^}]*\bSuspense\s+as\s+\w+/
  );
  expect(source, `${label}: aliased React.Suspense binding`).not.toMatch(
    /=\s*React\.Suspense\b/
  );
}

describe("profile section page has no SSR skeleton boundary above the cards", () => {
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

  // The sibling tabs (communities/, followers/, settings/, ...) keep their leaf
  // modules and are none of this route's business — but a module in a segment
  // NESTED under [section] would wrap this page's own children, so the subtree
  // is checked too. There is nothing under it today; this is what would notice
  // one arriving.
  it("has no loading module anywhere below the route either", () => {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const child = path.join(dir, entry.name);
        if (LOADING_NAMES.some((name) => fs.existsSync(path.join(child, name)))) {
          found.push(path.relative(ROUTE, child));
        }
        walk(child);
      }
    };
    walk(ROUTE);
    expect(found, "loading modules nested under [section]").toEqual([]);
  });

  // One page file serves all four tabs, and #1805 exists because a module here
  // covered all four at once. A second page under this segment could carry a
  // skeleton of its own without any check above noticing.
  it("is the only page under the [section] segment", () => {
    const pages = fs
      .readdirSync(ROUTE, { withFileTypes: true, recursive: true } as never)
      .filter((e: fs.Dirent) => e.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(e.name));
    expect(pages.length).toBe(1);
  });

  // All THREE branches of the page. The default branch hands the feed to
  // ProfileEntriesList; `?before=` renders ProfileEntriesArchive (server-rendered
  // list + crawlable pager, no infinite scroll); `?q=` renders
  // ProfileSearchContent. A guard that pinned only one of them would leave two
  // thirds of the route unpinned.
  it("renders no <Suspense> in the page, on any branch", () => {
    const source = pageSource();
    const fn = source.indexOf("export default async function Page");
    expect(fn).toBeGreaterThan(-1);

    // Anti-vacuity: the assertion below says nothing unless all three branches
    // are still here and still rendered by this function.
    expect(source.indexOf("<ProfileEntriesArchive", fn)).toBeGreaterThan(fn);
    expect(source.indexOf("<ProfileSearchContent", fn)).toBeGreaterThan(fn);
    expect(source.indexOf("<ProfileEntriesList", fn)).toBeGreaterThan(fn);

    assertNoSuspense(source, "source");
    expect(source).not.toMatch(/\bSuspense\b[^\n]*from "react"/);
  });

  // The reason has to be written down where the next reader will be, or the
  // next person to add pending UI to these tabs re-runs #1805 from scratch.
  it("says in the page why the segment has no loading module", () => {
    const source = fs.readFileSync(path.join(ROUTE, "page.tsx"), "utf8");
    expect(source).toMatch(/NO loading\.tsx in this directory, on purpose/);
  });

  it("no route or ancestor layout adds Suspense above the page", () => {
    let checked = 0;
    for (const dir of SEGMENTS) {
      for (const name of ["layout.tsx", "template.tsx"]) {
        const file = path.join(dir, name);
        if (!fs.existsSync(file)) continue;
        checked += 1;
        expect(read(file), path.relative(APP, file)).not.toMatch(/<(React\.)?Suspense/);
      }
    }
    // The profile layout and the root layout at least.
    expect(checked).toBeGreaterThanOrEqual(2);
  });

  // page.tsx hands its data to the components below, which reach the rendered
  // card. A <Suspense> — or a client-only dynamic import, which empties the
  // server render just as thoroughly — in any of them would hide the cards
  // again without touching page.tsx, so the chain is pinned too. All three
  // branches are represented.
  it("no component between the page and a card adds Suspense or drops SSR", () => {
    const chain = [
      path.join(USERNAME, "_components/profile-entries-list.tsx"),
      path.join(USERNAME, "_components/profile-entries-archive.tsx"),
      path.join(USERNAME, "_components/profile-search-content.tsx"),
      path.join(USERNAME, "_components/profile-entries-layout.tsx"),
      path.join(SHARED, "entry-archive-pager/index.tsx"),
      path.join(SHARED, "entry-list-content/index.tsx"),
      path.join(SHARED, "entry-list-item/index.tsx"),
      path.join(SHARED, "entry-list-item/entry-list-item-muted-content.tsx"),
      path.join(SHARED, "search-list-item/index.tsx"),
      // The thumbnail: a client-only dynamic import here would empty the card
      // of the image on the blog/posts tabs.
      path.join(SHARED, "entry-list-item/entry-list-item-thumbnail.tsx")
    ];
    for (const file of chain) {
      expect(fs.existsSync(file), file).toBe(true);
      const source = read(file);
      assertNoSuspense(source, file);
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
