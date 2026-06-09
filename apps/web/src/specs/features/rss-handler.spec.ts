import { describe, expect, it } from "vitest";
import { isTransientUpstreamError } from "@/features/rss/rss-handler";

describe("isTransientUpstreamError", () => {
  it("treats the Hive bridge `invalid tag` assert as transient (RSS crawler noise)", () => {
    // Crawlers request /:filter/:Tag/rss.xml with mixed-case tags; the bridge
    // rejects them with this phrasing, which the original filter missed.
    expect(
      isTransientUpstreamError(new Error("RPCError: Assert Exception:invalid tag `Pivot`"))
    ).toBe(true);
    expect(isTransientUpstreamError(new Error("Assert Exception:invalid category `Foo`"))).toBe(
      true
    );
  });

  it("still treats the `Tag/Category does not exist` assert as transient", () => {
    expect(isTransientUpstreamError(new Error("Assert Exception:Tag `nope` does not exist"))).toBe(
      true
    );
    expect(isTransientUpstreamError(new Error("Assert Exception:Category does not exist"))).toBe(
      true
    );
  });

  it("treats network/timeout/upstream-5xx errors as transient", () => {
    expect(isTransientUpstreamError(Object.assign(new Error("x"), { code: "ECONNRESET" }))).toBe(
      true
    );
    expect(
      isTransientUpstreamError(Object.assign(new Error("aborted"), { name: "AbortError" }))
    ).toBe(true);
    expect(isTransientUpstreamError(new Error("HTTP 503 Service Unavailable"))).toBe(true);
    expect(isTransientUpstreamError(new Error("fetch failed"))).toBe(true);
  });

  it("does NOT suppress genuine application errors", () => {
    expect(isTransientUpstreamError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isTransientUpstreamError(new Error("Assert Exception:something unrelated"))).toBe(false);
    expect(isTransientUpstreamError(null)).toBe(false);
    expect(isTransientUpstreamError("just a string")).toBe(false);
  });
});
