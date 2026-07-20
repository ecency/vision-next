import { describe, expect, it } from "vitest";
import { parseClaimTarget } from "./parse-claim-target";

// The claim landing derives the target name and instance type from the hostname alone: a
// hive-<digits> label is a community, anything else an author blog. Drives the title copy and the
// ?claim= deep link to the hosting page.
describe("parseClaimTarget", () => {
  it("treats hive-<digits> subdomains as communities", () => {
    expect(parseClaimTarget("hive-125126.blogs.ecency.com")).toEqual({
      name: "hive-125126",
      isCommunity: true,
    });
  });

  it("treats a bare username subdomain as an author blog", () => {
    expect(parseClaimTarget("alice.blogs.ecency.com")).toEqual({
      name: "alice",
      isCommunity: false,
    });
  });

  it("does not mistake a hive-prefixed username for a community", () => {
    // Only hive-<digits> is a community; a name like 'hive-fan' is an ordinary author.
    expect(parseClaimTarget("hive-fan.blogs.ecency.com")).toEqual({
      name: "hive-fan",
      isCommunity: false,
    });
  });

  it("keeps a dotted Hive account name whole", () => {
    // Hive account names may contain dots, so the tenant spans two labels under the base domain.
    // Splitting on the first dot would deep-link the claim CTA to 'alice' instead.
    expect(parseClaimTarget("alice.dev.blogs.ecency.com")).toEqual({
      name: "alice.dev",
      isCommunity: false,
    });
  });

  it("ignores a port and host casing", () => {
    expect(parseClaimTarget("Alice.Blogs.Ecency.Com:8080")).toEqual({
      name: "alice",
      isCommunity: false,
    });
  });

  it("falls back to the whole host when there is no subdomain", () => {
    expect(parseClaimTarget("localhost")).toEqual({ name: "localhost", isCommunity: false });
  });

  it("handles an empty host without throwing", () => {
    expect(parseClaimTarget("")).toEqual({ name: "", isCommunity: false });
  });
});
