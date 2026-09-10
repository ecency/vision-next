import { describe, expect, it, vi } from "vitest";
import {
  feedIndexing,
  generateFeedMetadata,
  normalizeFeedTag
} from "@/app/(dynamicPages)/feed/[...sections]/_helpers";

// setup-any-spec stubs @/utils down to two exports; this helper needs the real
// `capitalize` (the metadata title/description are built from it).
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

const BASE = "https://ecency.com";

/**
 * #1800: every personal feed self-canonicalised to `https://ecency.com/feed`,
 * and `/feed` is a 404 — the canonical was built as `/{filter}` from the route
 * params, and `/@user/feed` reaches this route as filter `feed`.
 *
 * These pin BOTH halves of the decision: the personal-feed family names a URL
 * that resolves AND is deliberately noindex, and every other spelling sharing
 * the catch-all keeps the canonical it had.
 */
describe("feed canonical", () => {
  describe("personal feed (/@user/feed)", () => {
    it("canonicalises to its own URL, not the /feed 404", async () => {
      const meta = await generateFeedMetadata("feed", "%40ecency");
      expect(meta.alternates?.canonical).toBe(`${BASE}/@ecency/feed`);
      expect(meta.alternates?.canonical).not.toBe(`${BASE}/feed`);
      expect(meta.openGraph?.url).toBe("/@ecency/feed");
    });

    it("is noindex, follow — a personalised list of other people's posts", async () => {
      const meta = await generateFeedMetadata("feed", "%40ecency");
      expect(meta.robots).toBe("noindex, follow");
    });

    it("reads the same whether the @ arrives encoded (rewrite) or literal", async () => {
      const encoded = await generateFeedMetadata("feed", "%40ecency");
      const literal = await generateFeedMetadata("feed", "@ecency");
      expect(literal.alternates?.canonical).toBe(encoded.alternates?.canonical);
      expect(literal.robots).toBe(encoded.robots);
      expect(literal.title).toBe(encoded.title);
    });

    it("names the rewrite target when it has no account to point at", () => {
      // `/feed/feed` is reachable and used to canonicalise to /feed as well.
      expect(feedIndexing("feed", "")).toEqual({
        path: "/feed/feed",
        robots: "noindex, follow"
      });
    });
  });

  describe("account sorts that duplicate a profile section", () => {
    it.each([
      ["comments", "/@ecency/comments"],
      ["replies", "/@ecency/replies"],
      ["posts", "/@ecency/posts"],
      ["blog", "/@ecency/blog"]
    ])("/feed/%s/@user consolidates onto %s", async (filter, path) => {
      const meta = await generateFeedMetadata(filter, "%40ecency");
      expect(meta.alternates?.canonical).toBe(`${BASE}${path}`);
      // No noindex here: the canonical target IS indexed, and a noindex on a
      // duplicate can carry over to the URL it points at.
      expect(meta.robots).toBeUndefined();
    });

    it("keeps an account sort with no profile page out of the index", async () => {
      const meta = await generateFeedMetadata("payout", "%40ecency");
      expect(meta.alternates?.canonical).toBe(`${BASE}/feed/payout/@ecency`);
      expect(meta.robots).toBe("noindex, follow");
    });
  });

  // The other URLs that share /feed/[...sections]. Their canonicals are what
  // production served before #1800 and must not move.
  describe("the rest of the catch-all is unchanged", () => {
    it.each([
      ["/trending", "trending", "", "/trending"],
      ["/hot", "hot", "", "/hot"],
      ["/created", "created", "", "/created"],
      ["/payout", "payout", "", "/payout"],
      ["/muted", "muted", "", "/muted"],
      ["/promoted", "promoted", "", "/promoted"],
      ["/created/photography", "created", "photography", "/created/photography"],
      ["/tags/photography", "created", "photography", "/created/photography"],
      ["/hot/my", "hot", "my", "/hot/my"],
      ["/trending/hive-125", "trending", "hive-125", "/trending/hive-125"]
    ])("%s stays canonical to %s", async (_requested, filter, rawTag, path) => {
      const { tag } = normalizeFeedTag(rawTag);
      const meta = await generateFeedMetadata(filter, tag);
      expect(meta.alternates?.canonical).toBe(`${BASE}${path}`);
      expect(meta.robots).toBeUndefined();
    });

    it("still folds the tagless global feed onto the bare filter", async () => {
      const { tag } = normalizeFeedTag("global");
      const meta = await generateFeedMetadata("created", tag);
      expect(meta.alternates?.canonical).toBe(`${BASE}/created`);
    });

    it("still self-canonicalises a cursor archive page, noindex follow", async () => {
      const meta = await generateFeedMetadata("created", "photography", "alice/hello");
      expect(meta.alternates?.canonical).toBe(`${BASE}/created/photography?before=alice/hello`);
      expect(meta.robots).toBe("noindex, follow");
    });
  });

  // The defect class, not just the one URL: `/{filter}` only resolves for the
  // six ranked sorts, so no other spelling may be canonicalised onto it.
  it("never canonicalises onto a bare /{filter} that 404s", () => {
    const dead = ["feed", "comments", "replies", "posts", "blog"];
    for (const filter of dead) {
      for (const tag of ["%40ecency", "@ecency", ""]) {
        expect(feedIndexing(filter, tag).path).not.toBe(`/${filter}`);
      }
    }
  });
});
