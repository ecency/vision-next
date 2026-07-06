import { beforeEach, describe, expect, it, vi } from "vitest";

describe("polyfills — SVGAnimatedString fallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("defines a stub when the browser lacks SVGAnimatedString", async () => {
    const original = (window as any).SVGAnimatedString;
    delete (window as any).SVGAnimatedString;
    try {
      await import("@/polyfills");
      expect((window as any).SVGAnimatedString).toBeDefined();
      // instanceof must be safe to call and reject non-SVG values,
      // matching how @bprogress/core probes anchor properties
      expect("https://example.com" instanceof (window as any).SVGAnimatedString).toBe(false);
      expect(document.createElement("a") instanceof (window as any).SVGAnimatedString).toBe(false);
    } finally {
      (window as any).SVGAnimatedString = original;
    }
  });

  it("keeps the native implementation when present", async () => {
    const sentinel = class {};
    const original = (window as any).SVGAnimatedString;
    (window as any).SVGAnimatedString = sentinel;
    try {
      await import("@/polyfills");
      expect((window as any).SVGAnimatedString).toBe(sentinel);
    } finally {
      (window as any).SVGAnimatedString = original;
    }
  });
});
