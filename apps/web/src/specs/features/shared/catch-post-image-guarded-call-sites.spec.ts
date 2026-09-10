import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

/**
 * The SSR call sites that run `catchPostImage` on a body the app did not slim.
 *
 * Feed rows normally arrive with `body: ""` (slimEntry), which starves the
 * extractor's markdown tier, but three paths carry a FULL body here:
 *   - slimEntrySafely returns the un-slimmed entry when slimming throws
 *     (core/entries/slim-entry.ts),
 *   - BODY_BACKED_SECTIONS skips slimming for the comments/replies profile
 *     feeds (api/queries/get-account-posts-feed-query.ts, reachable as
 *     /feed/comments/@user),
 *   - the profile's pinned entry is fetched through the post cache, unslimmed.
 * Search rows are never slimmed at all.
 *
 * A throw at any of them is a blank route, not a missing image: they render
 * during SSR with no Suspense boundary above them. entry-list-item-hostile-body
 * proves the first three degrade; this pins the search row too (which has no
 * render spec of its own) and stops a new edit from quietly reaching back for
 * the unguarded export.
 */
const SRC = path.resolve(__dirname, "../../..");

const SITES: { file: string; calls: number }[] = [
  // Full-size thumbnail + the LQIP placeholder behind it.
  { file: "features/shared/entry-list-item/entry-list-item-thumbnail.tsx", calls: 2 },
  { file: "features/shared/search-list-item/index.tsx", calls: 1 }
];

const read = (file: string) => fs.readFileSync(path.join(SRC, file), "utf8");

describe("feed and search thumbnails go through the catchPostImage guard", () => {
  it.each(SITES)("$file imports the guard, not the raw export", ({ file }) => {
    const source = read(file);
    expect(source).toContain(
      'import { catchPostImageSafely } from "@/core/entries/catch-post-image-safely";'
    );
    // Only the guard module may import catchPostImage from the package here.
    expect(source).not.toMatch(/import\s*{[^}]*\bcatchPostImage\b[^}]*}\s*from\s*"@ecency\/render-helper"/);
  });

  it.each(SITES)("$file makes all $calls of its calls through the guard", ({ file, calls }) => {
    const source = read(file);
    expect(source.match(/catchPostImageSafely\(/g)?.length ?? 0).toBe(calls);
    expect(source.match(/(?<!Safely)\bcatchPostImage\(/g)).toBeNull();
  });

  it("the guard swallows the throw and reports rather than rethrowing", () => {
    const source = read("core/entries/catch-post-image-safely.ts");
    expect(source).toMatch(/catch\s*\([\s\S]*?\)\s*{[\s\S]*?return null;/);
    // The report-once bookkeeping moved into report-render-helper-failure.ts,
    // shared with the summary guard; the guard must still call it.
    expect(source).toMatch(/reportRenderHelperFailureOnce\(\s*"catchPostImage"/);
    expect(read("core/entries/report-render-helper-failure.ts")).toContain("reportedFailures");
  });
});
