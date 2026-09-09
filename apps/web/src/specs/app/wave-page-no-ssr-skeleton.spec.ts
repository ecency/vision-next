import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// The wave page ships the wave body inside the SSR shell. Nothing above the
// body may be a Suspense boundary: page.tsx awaits the entry, so a boundary
// anywhere above it is emitted pending — fallback in the shell, body in a
// hidden <div id="S:n"> chunk that a $RC swap script reveals only once the
// parser reaches it. On a throttled phone that ran seconds after the HTML had
// arrived (#1783: the swap sat at 99% of the document).
//
// A loading module counts as such a boundary for its OWN segment AND for every
// segment nested under it, which is why app/waves/loading.tsx had to move: it
// belongs to the feed page, but it also wrapped /waves/[author]/[permlink].
// The (feed) route group keeps that skeleton for /waves alone.
const APP = path.resolve(__dirname, "../../app");
const WAVES = path.join(APP, "waves");
const ROUTE = path.join(WAVES, "[author]/[permlink]");
const SEGMENTS = [ROUTE, path.join(WAVES, "[author]"), WAVES, APP];
const LOADING_NAMES = ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"];

function pageSource() {
  return fs.readFileSync(path.join(ROUTE, "page.tsx"), "utf8");
}

describe("wave page has no SSR skeleton boundary above the wave body", () => {
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

  // The feed skeleton is allowed to exist, but only inside the route group that
  // holds the feed page. Moving it back up one directory would restore the
  // boundary above every nested wave route, and the check above would go red.
  it("keeps the feed loading module scoped to the (feed) route group", () => {
    const group = path.join(WAVES, "(feed)");
    expect(fs.existsSync(path.join(group, "page.tsx"))).toBe(true);
    expect(LOADING_NAMES.some((name) => fs.existsSync(path.join(group, name)))).toBe(true);
  });

  it("renders no <Suspense> before the wave details in the page function", () => {
    const source = pageSource();
    const fn = source.indexOf("export default async function WaveViewPage");
    const body = source.indexOf("<WaveViewDetails");
    expect(fn).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(fn);
    const firstSuspense = source.indexOf("<Suspense", fn);
    expect(firstSuspense === -1 || firstSuspense > body).toBe(true);
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
    // The waves layout, the route layout and the root layout at least.
    expect(checked).toBeGreaterThanOrEqual(3);
  });

  // page.tsx hands the wave to WaveViewDetails, which reaches the rendered
  // markdown through the files below. A <Suspense> inside any of them would
  // hide the body again without touching page.tsx, so they are pinned too.
  it("no component between the page and the rendered body adds Suspense", () => {
    const chain = [
      path.join(ROUTE, "_components/wave-view-details.tsx"),
      path.resolve(__dirname, "../../features/shared/post-content-renderer.tsx"),
      path.resolve(__dirname, "../../features/post-renderer/components/ecency-renderer.tsx")
    ];
    for (const file of chain) {
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.readFileSync(file, "utf8"), file).not.toMatch(/<Suspense/);
    }
    // The chain list is only worth something if it still ends at the body.
    const renderer = fs.readFileSync(chain[chain.length - 1], "utf8");
    expect(renderer).toMatch(/markdown-view/);
    expect(renderer).toMatch(/renderPostBody\(/);
  });
});
