import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { handleDecodedPathRedirect } from "@/features/next-middleware";

function requestFor(rawPath: string) {
  // NextRequest keeps the percent-encoded form in nextUrl.pathname, exactly as
  // the middleware receives it.
  return new NextRequest(`https://ecency.com${rawPath}`);
}

describe("handleDecodedPathRedirect", () => {
  it("canonicalizes an encoded path to its decoded same-origin form", () => {
    const res = handleDecodedPathRedirect(requestFor("/%40ecency"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(307);
    expect(res!.headers.get("location")).not.toBeNull();
    const location = new URL(res!.headers.get("location")!, "https://ecency.com");
    expect(location.host).toBe("ecency.com");
    expect(location.pathname).toBe("/@ecency");
  });

  it("returns null when the path is already canonical (no redirect)", () => {
    expect(handleDecodedPathRedirect(requestFor("/@ecency"))).toBeNull();
  });

  // CWE-601: `/%5cevil.com/%2f%2e%2e` decodes to `/\evil.com//..`, which the
  // pathname setter normalizes to `//evil.com` — a protocol-relative Location
  // that resolves off-origin. Must be refused, never redirected.
  it("refuses a backslash open-redirect payload with 400, not an off-origin redirect", () => {
    const res = handleDecodedPathRedirect(requestFor("/%5cevil.com/%2f%2e%2e"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(400);
    expect(res!.headers.get("location")).toBeNull();
  });

  it("refuses an encoded-double-slash open-redirect payload with 400", () => {
    const res = handleDecodedPathRedirect(requestFor("/%2f%2fevil.com/%2f%2e%2e"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(400);
    expect(res!.headers.get("location")).toBeNull();
  });

  // Regression for the ERR_TOO_MANY_REDIRECTS loop: a decoded path whose
  // re-encoded form equals the original (e.g. encoded space inside literal
  // brackets) must not redirect to itself forever.
  it("does not loop when the decoded path re-encodes back to the original", () => {
    expect(handleDecodedPathRedirect(requestFor("/@user/[object%20Object]"))).toBeNull();
  });
});
