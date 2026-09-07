import { describe, expect, it } from "vitest";
import { globalFeedFallbackPath } from "@/app/_components/entry-index-menu/use-feed-menu";

/**
 * Logged-out visitors are pushed off the Communities feed (`/{sort}/my`) onto
 * Global. The match must be anchored: the previous `includes("/my")` guard plus
 * an unanchored `replace` sent /created/myhivejourney to /createdhivejourney,
 * a 404 that any logged-out visitor hit on a tag beginning with "my".
 */
describe("globalFeedFallbackPath", () => {
  it("strips the trailing /my for each sort", () => {
    expect(globalFeedFallbackPath("/created/my")).toBe("/created");
    expect(globalFeedFallbackPath("/trending/my")).toBe("/trending");
    expect(globalFeedFallbackPath("/hot/my")).toBe("/hot");
    expect(globalFeedFallbackPath("/payout/my")).toBe("/payout");
  });

  it("leaves tags that merely begin with my alone", () => {
    for (const p of [
      "/created/myhivejourney",
      "/created/myhivegoals",
      "/trending/myopia",
      "/payout/myocarditis",
      "/hot/mystery"
    ]) {
      expect(globalFeedFallbackPath(p)).toBeNull();
    }
  });

  it("does not match /my inside a deeper path", () => {
    expect(globalFeedFallbackPath("/created/my/extra")).toBeNull();
    expect(globalFeedFallbackPath("/@mystery/my-post")).toBeNull();
  });

  it("falls back to the root rather than an empty push", () => {
    expect(globalFeedFallbackPath("/my")).toBe("/");
  });

  it("tolerates a missing pathname", () => {
    expect(globalFeedFallbackPath(null)).toBeNull();
    expect(globalFeedFallbackPath(undefined)).toBeNull();
    expect(globalFeedFallbackPath("")).toBeNull();
  });
});
