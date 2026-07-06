import { isProMember, PRO_PRICE_USD, PRO_SKU, proMembersSet } from "@/features/pro/pro-config";
import { describe, expect, it } from "vitest";

describe("pro-config", () => {
  it("uses the $19.99/yr Pro SKU (leading number = price in cents)", () => {
    expect(PRO_SKU).toBe("1999pro");
    expect(PRO_PRICE_USD).toBe(19.99);
  });

  describe("proMembersSet", () => {
    it("lowercases usernames for case-insensitive membership", () => {
      const set = proMembersSet(["Alice", "BOB"]);
      expect(set.has("alice")).toBe(true);
      expect(set.has("bob")).toBe(true);
    });

    it("returns an empty set for undefined input", () => {
      expect(proMembersSet().size).toBe(0);
    });
  });

  describe("isProMember", () => {
    it("matches a member case-insensitively", () => {
      expect(isProMember(["alice", "bob"], "Alice")).toBe(true);
      expect(isProMember(["alice"], "alice")).toBe(true);
    });

    it("is false for a non-member", () => {
      expect(isProMember(["alice"], "bob")).toBe(false);
    });

    it("is false when username or roster is missing", () => {
      expect(isProMember(["alice"], null)).toBe(false);
      expect(isProMember(["alice"], undefined)).toBe(false);
      expect(isProMember(undefined, "alice")).toBe(false);
    });
  });
});
