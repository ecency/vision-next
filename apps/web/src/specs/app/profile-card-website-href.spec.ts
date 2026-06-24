import { describe, it, expect } from "vitest";
import { profileWebsiteHref } from "@/app/(dynamicPages)/profile/[username]/_components/profile-card/website-href";

describe("profileWebsiteHref", () => {
  it("builds an https href from a bare domain", () => {
    expect(profileWebsiteHref("example.com")).toBe("https://example.com");
  });

  it("normalizes any explicit scheme to https", () => {
    expect(profileWebsiteHref("https://example.com")).toBe("https://example.com");
    expect(profileWebsiteHref("http://example.com/path")).toBe("https://example.com/path");
    expect(profileWebsiteHref("ftp://files.example.com")).toBe("https://files.example.com");
  });

  it("returns null for free-text that is not a URL (ECENCY-NEXT-1GE5 crash input)", () => {
    expect(profileWebsiteHref("no website for noq")).toBeNull();
  });

  it("returns null for empty or missing input", () => {
    expect(profileWebsiteHref("")).toBeNull();
    expect(profileWebsiteHref(undefined)).toBeNull();
    expect(profileWebsiteHref(null)).toBeNull();
  });
});
