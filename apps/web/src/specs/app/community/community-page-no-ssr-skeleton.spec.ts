import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// The community feed route (/created/hive-NNNNN and every other :tag, rewritten
// to /community/[community]/[tag]) ships its cards inside the SSR shell.
// Nothing above the card list may be a Suspense boundary: page.tsx awaits the
// feed before returning JSX, so a boundary anywhere above it is emitted
// pending — fallback in the shell, cards in a hidden <div id="S:n"> chunk that
// a $RC swap script reveals only once the parser reaches it. Alpha measured
// 3 hidden segments, 1 pending boundary and 1 $RC swap on this route, LCP 2.94s.
//
// A loading module counts as such a boundary for its OWN segment AND for every
// segment nested under it, which is the mistake the wave route made
// (app/waves/loading.tsx wrapped /waves/[author]/[permlink] too). Here the
// deleted module sat on [tag] itself, so the ancestor scan below is what stops
// it coming back one directory up at [community], where it would also take out
// /community/hive-NNNNN, /community/hive-NNNNN/subscribers, /activities and
// /roles — none of which ever had a skeleton.
const APP = path.resolve(__dirname, "../../../app");
const COMMUNITY = path.join(APP, "(dynamicPages)/community");
const ROUTE = path.join(COMMUNITY, "[community]/[tag]");
const SEGMENTS = [
  ROUTE,
  path.join(COMMUNITY, "[community]"),
  COMMUNITY,
  path.join(APP, "(dynamicPages)"),
  APP
];
const LOADING_NAMES = ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"];

function pageSource() {
  return fs.readFileSync(path.join(ROUTE, "page.tsx"), "utf8");
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

describe("community feed page has no SSR skeleton boundary above the cards", () => {
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

  // The ancestor list above only knows the segments that exist today. A route
  // group ([community]/(feed)/loading.tsx, say) is a directory Next erases from
  // the URL, so it would re-wrap the page while passing the segment scan above.
  // Route groups are therefore erased before deciding whether a module sits on
  // this route's chain. Sibling leaf routes under /community (subscribers,
  // roles, activities) are NOT this PR's to pin: they never had a skeleton, but
  // they are free to grow one, and forbidding it here would fail a change this
  // route has no stake in.
  it("has no loading module on the route's chain, route groups erased", () => {
    const chain = path.relative(APP, ROUTE).split(path.sep).filter((p) => !p.startsWith("("));
    const wrapping = walk(COMMUNITY)
      .filter((f) => LOADING_NAMES.includes(path.basename(f)))
      .filter((f) => {
        const segs = path
          .relative(APP, path.dirname(f))
          .split(path.sep)
          .filter((p) => !p.startsWith("("));
        return segs.every((seg, i) => chain[i] === seg);
      });
    expect(wrapping.map((f) => path.relative(APP, f))).toEqual([]);
  });

  // The sibling that serves /community/hive-NNNNN renders the same feed and
  // never had a loading module, so it already shipped its cards in the shell.
  // It is the reference for what the [tag] route now does; if it ever grows a
  // boundary the check above goes red with it.
  it("keeps the sibling community page rendering the cards directly", () => {
    const sibling = fs.readFileSync(path.join(COMMUNITY, "[community]/page.tsx"), "utf8");
    expect(sibling).toMatch(/<EntryListContent/);
    expect(sibling).not.toMatch(/<Suspense/);
  });

  it("renders no <Suspense> before the cards in the page function", () => {
    const source = pageSource();
    const fn = source.indexOf("export default async function CommunityPostsPage");
    // LAST occurrence, not the first: the cursor branch's list is written above
    // the page-1 branch's, so anchoring on the first one would leave a
    // <Suspense> around the page-1 list (the one /created/hive-NNNNN actually
    // renders) sitting "after the cards" and pass.
    const cards = source.lastIndexOf("<EntryListContent");
    expect(fn).toBeGreaterThan(-1);
    expect(cards).toBeGreaterThan(fn);
    const firstSuspense = source.indexOf("<Suspense", fn);
    expect(firstSuspense === -1 || firstSuspense > cards).toBe(true);
  });

  // ?before=<cursor> renders a SECOND tree (the archive branch: no infinite
  // list, an EntryArchivePager instead). Both branches end at EntryListContent,
  // and a boundary added to either one hides the cards on the URLs it serves.
  it("keeps both page branches free of Suspense", () => {
    const source = pageSource();
    const lists = source.match(/<EntryListContent/g) ?? [];
    expect(lists.length).toBe(2); // cursor branch + page-1 branch
    expect(source).toMatch(/<EntryArchivePager/);
    expect(source).not.toMatch(/<Suspense/);
  });

  it("no route or ancestor layout adds Suspense above the page", () => {
    let checked = 0;
    for (const dir of SEGMENTS) {
      for (const name of ["layout.tsx", "template.tsx"]) {
        const file = path.join(dir, name);
        if (!fs.existsSync(file)) continue;
        checked += 1;
        expect(fs.readFileSync(file, "utf8"), path.relative(APP, file)).not.toMatch(/<Suspense/);
      }
    }
    // The community layout and the root layout at least.
    expect(checked).toBeGreaterThanOrEqual(2);
  });

  // The root layout hands {children} to ClientProviders, which mounts its own
  // lazy widgets inside Suspense. Those boundaries must never enclose the route
  // children, or every page's cards would be hidden behind a swap again.
  it("client providers keep the route children outside every Suspense", () => {
    const source = fs.readFileSync(path.join(APP, "client-providers.tsx"), "utf8");
    expect(source).toMatch(/\{props\.children\}/);
    const blocks = source.match(/<Suspense\b[^>]*>[\s\S]*?<\/Suspense>/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block).not.toMatch(/\{(props\.)?children\}/);
    }
  });

  // page.tsx hands the entries to EntryListContent, which reaches the first
  // card's title through the files below. A <Suspense> inside any of them would
  // hide the cards again without touching page.tsx, so they are pinned too.
  it("no component between the page and the first card adds Suspense", () => {
    const chain = [
      path.join(APP, "(dynamicPages)/profile/[username]/_components/profile-entries-layout.tsx"),
      path.resolve(__dirname, "../../../features/shared/entry-list-content/index.tsx"),
      path.resolve(__dirname, "../../../features/shared/entry-list-item/index.tsx"),
      path.resolve(
        __dirname,
        "../../../features/shared/entry-list-item/entry-list-item-muted-content.tsx"
      )
    ];
    for (const file of chain) {
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.readFileSync(file, "utf8"), file).not.toMatch(/<Suspense/);
    }
    // The chain list is only worth something if it still ends at a card.
    const card = fs.readFileSync(chain[2], "utf8");
    expect(card).toMatch(/"entry-list-item": true/);
    const summary = fs.readFileSync(chain[3], "utf8");
    expect(summary).toMatch(/item-title/);
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
