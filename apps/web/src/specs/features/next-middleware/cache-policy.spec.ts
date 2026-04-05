import { describe, expect, it } from "vitest";
import { buildCacheControlHeader, getCachePolicyForPath } from "@/features/next-middleware";

describe("getCachePolicyForPath", () => {
  describe("no-cache paths", () => {
    it.each([
      "/publish",
      "/publish/entry/@alice/hello",
      "/chats",
      "/chats/general",
      "/auth",
      "/auth/keychain-sign",
      "/signup",
      "/submit",
      "/draft",
      "/wallet",
      "/wallet/hive",
      "/market",
      "/search",
      "/decks",
      "/waves",
      "/perks",
      "/purchase",
      "/onboard-friend"
    ])("returns no-cache tier for %s", (path) => {
      const policy = getCachePolicyForPath(path);
      expect(policy).toEqual({ tier: "no-cache", sMaxAge: 0, staleWhileRevalidate: 0 });
    });

    it.each(["/@alice/wallet", "/@alice/settings", "/@alice/permissions", "/@alice/referrals"])(
      "returns no-cache for sensitive profile section %s",
      (path) => {
        const policy = getCachePolicyForPath(path);
        expect(policy?.tier).toBe("no-cache");
      }
    );
  });

  describe("static pages", () => {
    it.each([
      "/faq",
      "/about",
      "/child-safety",
      "/contributors",
      "/privacy-policy",
      "/terms-of-service",
      "/whitepaper",
      "/guest-post",
      "/mobile"
    ])("returns static tier for %s", (path) => {
      const policy = getCachePolicyForPath(path);
      expect(policy).toEqual({ tier: "static", sMaxAge: 86400, staleWhileRevalidate: 604800 });
    });
  });

  describe("homepage", () => {
    it("returns home tier for /", () => {
      const policy = getCachePolicyForPath("/");
      expect(policy).toEqual({ tier: "home", sMaxAge: 300, staleWhileRevalidate: 3600 });
    });
  });

  describe("list pages", () => {
    it.each([
      ["/discover", "list"],
      ["/communities", "list"],
      ["/witnesses", "list"],
      ["/tags", "list"]
    ])("returns list tier for %s", (path, tier) => {
      const policy = getCachePolicyForPath(path);
      expect(policy?.tier).toBe(tier);
      expect(policy?.sMaxAge).toBe(300);
      expect(policy?.staleWhileRevalidate).toBe(3600);
    });

    it("returns list-proposals tier with longer s-maxage", () => {
      const policy = getCachePolicyForPath("/proposals");
      expect(policy).toEqual({ tier: "list-proposals", sMaxAge: 600, staleWhileRevalidate: 3600 });
    });
  });

  describe("feed pages", () => {
    it.each(["/hot", "/trending", "/payout", "/muted", "/promoted"])(
      "returns feed tier for %s",
      (path) => {
        const policy = getCachePolicyForPath(path);
        expect(policy).toEqual({ tier: "feed", sMaxAge: 60, staleWhileRevalidate: 300 });
      }
    );

    it("returns feed-created tier for /created (shorter TTL)", () => {
      const policy = getCachePolicyForPath("/created");
      expect(policy).toEqual({ tier: "feed-created", sMaxAge: 30, staleWhileRevalidate: 120 });
    });

    it("returns feed-created tier for /tags/:tag (rewrites to created)", () => {
      const policy = getCachePolicyForPath("/tags/photography");
      expect(policy).toEqual({ tier: "feed-created", sMaxAge: 30, staleWhileRevalidate: 120 });
    });

    it("handles tag filter: /hot/photography", () => {
      const policy = getCachePolicyForPath("/hot/photography");
      expect(policy?.tier).toBe("feed");
    });

    it("handles nested filter: /hot/photography/hive-123456", () => {
      const policy = getCachePolicyForPath("/hot/photography/hive-123456");
      expect(policy?.tier).toBe("feed");
    });
  });

  describe("community pages", () => {
    it("returns community tier for /:tag/hive-xxxxx", () => {
      const policy = getCachePolicyForPath("/photography/hive-123456");
      expect(policy).toEqual({ tier: "community", sMaxAge: 60, staleWhileRevalidate: 300 });
    });

    it("returns community tier for community with sub", () => {
      const policy = getCachePolicyForPath("/photography/hive-123456/hot");
      expect(policy?.tier).toBe("community");
    });
  });

  describe("profile pages", () => {
    it("returns profile tier for /@alice", () => {
      const policy = getCachePolicyForPath("/@alice");
      expect(policy).toEqual({ tier: "profile", sMaxAge: 300, staleWhileRevalidate: 3600 });
    });

    it.each(["posts", "blog", "comments", "replies", "communities", "trail", "insights", "feed"])(
      "returns profile tier for /@alice/%s",
      (section) => {
        const policy = getCachePolicyForPath(`/@alice/${section}`);
        expect(policy?.tier).toBe("profile");
      }
    );
  });

  describe("entry pages", () => {
    it("returns entry tier for /:category/@author/:permlink", () => {
      const policy = getCachePolicyForPath("/photography/@alice/my-post");
      expect(policy).toEqual({ tier: "entry", sMaxAge: 3600, staleWhileRevalidate: 86400 });
    });

    it("returns entry tier for short /@author/:permlink", () => {
      const policy = getCachePolicyForPath("/@alice/my-post-slug");
      expect(policy).toEqual({ tier: "entry", sMaxAge: 3600, staleWhileRevalidate: 86400 });
    });

    it("returns entry tier for /:category/@author/:permlink/:sub", () => {
      const policy = getCachePolicyForPath("/photography/@alice/my-post/comments");
      expect(policy?.tier).toBe("entry");
    });
  });

  describe("unmatched paths", () => {
    it("returns null for API routes", () => {
      expect(getCachePolicyForPath("/api/healthcheck")).toBeNull();
    });

    it("returns null for _next internals", () => {
      expect(getCachePolicyForPath("/_next/static/abc.js")).toBeNull();
    });

    it("returns null for /assets/* (handled by next.config.js)", () => {
      expect(getCachePolicyForPath("/assets/logo.svg")).toBeNull();
    });
  });

  describe("trailing slash normalization", () => {
    it("treats /discover/ the same as /discover", () => {
      expect(getCachePolicyForPath("/discover/")).toEqual(getCachePolicyForPath("/discover"));
    });

    it("does not collapse root /", () => {
      expect(getCachePolicyForPath("/")?.tier).toBe("home");
    });
  });
});

describe("buildCacheControlHeader", () => {
  it("emits public s-maxage + swr for anonymous users", () => {
    const header = buildCacheControlHeader(
      { tier: "list", sMaxAge: 300, staleWhileRevalidate: 3600 },
      false
    );
    expect(header).toBe("public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
  });

  it("emits private no-store for logged-in users", () => {
    const header = buildCacheControlHeader(
      { tier: "list", sMaxAge: 300, staleWhileRevalidate: 3600 },
      true
    );
    expect(header).toBe("private, no-store");
  });

  it("emits private no-store for no-cache tier even anonymous", () => {
    const header = buildCacheControlHeader(
      { tier: "no-cache", sMaxAge: 0, staleWhileRevalidate: 0 },
      false
    );
    expect(header).toBe("private, no-store");
  });
});
