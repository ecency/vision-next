import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// The entry route ships the post body inside the SSR shell, and nothing above
// the body may be a Suspense boundary. Two mechanisms turn such a boundary into
// a hidden <div id="S:n"> chunk plus a $RC swap script that only reveals the
// body once the parser reaches it (on a starved main thread that was seconds
// after the HTML had arrived, so LCP was the swap, not the paint):
//  1. A boundary whose subtree AWAITS (loading.tsx around the page, which
//     awaits network before returning JSX, or a <Suspense> containing an async
//     server component) is emitted pending: fallback in the shell, content
//     later.
//  2. A boundary whose subtree resolves synchronously is still outlined when
//     it is over 500 bytes and the shell has passed React's
//     progressiveChunkSize (12.8 KB). The head + navbar ahead of the body
//     already exceed that, so a <Suspense> around EntryPageContentSSR would
//     be written as a pending placeholder + hidden chunk even though it is
//     complete (react-dom-server flushSegment / isEligibleForOutlining).
// Hence: no loading module on any segment, and no <Suspense> at or above the
// post body in page.tsx. The related-footer Suspense is fine because it sits
// BELOW the body.
const APP = path.resolve(__dirname, "../../app");
const ROUTE = path.join(APP, "(dynamicPages)/entry/[category]/[author]/[permlink]");
const SEGMENTS = [
  ROUTE,
  path.join(APP, "(dynamicPages)/entry/[category]/[author]"),
  path.join(APP, "(dynamicPages)/entry/[category]"),
  path.join(APP, "(dynamicPages)/entry"),
  path.join(APP, "(dynamicPages)"),
  APP
];

function pageSource() {
  return fs.readFileSync(path.join(ROUTE, "page.tsx"), "utf8");
}

describe("entry page has no SSR skeleton boundary above the post body", () => {
  it("route directory exists", () => {
    expect(fs.existsSync(path.join(ROUTE, "page.tsx"))).toBe(true);
  });

  it("has no loading.tsx on the route or on any ancestor segment", () => {
    for (const dir of SEGMENTS) {
      for (const name of ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"]) {
        expect(fs.existsSync(path.join(dir, name)), `${path.relative(APP, dir) || "app"}/${name}`).toBe(false);
      }
    }
  });

  it("renders no <Suspense> before the post body anywhere in the page function", () => {
    // Scans from the page component to the body, not just the slice between
    // EntryRenderBoundary and the body: a <Suspense fallback={<Skeleton/>}>
    // placed ABOVE the render boundary is the most natural way to bring the
    // skeleton back, and the slice-only check let it through. Prose comments
    // mention Suspense without the "<", which keeps this green on purpose.
    const source = pageSource();
    const fn = source.indexOf("export default async function EntryPage");
    const body = source.indexOf("<EntryPageContentSSR");
    expect(fn).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(fn);
    const firstSuspense = source.indexOf("<Suspense", fn);
    expect(firstSuspense === -1 || firstSuspense > body).toBe(true);
  });

  it("does not wrap the post body in Suspense", () => {
    const source = pageSource();
    const start = source.indexOf("<EntryRenderBoundary>");
    const body = source.indexOf("<EntryPageContentSSR");
    expect(start).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(start);
    expect(source.slice(start, body)).not.toMatch(/<Suspense/);
  });

  it("keeps the related-footer Suspense below the body", () => {
    const source = pageSource();
    const body = source.indexOf("<EntryPageContentSSR");
    const related = source.indexOf("<Suspense fallback={null}>");
    expect(related).toBeGreaterThan(body);
  });

  it("route layout adds no Suspense above the page", () => {
    const source = fs.readFileSync(path.join(ROUTE, "layout.tsx"), "utf8");
    expect(source).not.toMatch(/<Suspense/);
  });
});
