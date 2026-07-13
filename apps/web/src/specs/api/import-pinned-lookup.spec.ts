// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createPinnedLookup } from "@/app/api/import/pinned-lookup";

describe("createPinnedLookup", () => {
  it("returns a scalar address when Node requests one result", () => {
    const callback = vi.fn();

    createPinnedLookup("203.0.113.10", 4)("example.com", {}, callback);

    expect(callback).toHaveBeenCalledWith(null, "203.0.113.10", 4);
  });

  it("returns a scalar address when lookup options are missing", () => {
    const callback = vi.fn();

    createPinnedLookup("203.0.113.10", 4)(
      "example.com",
      undefined as never,
      callback
    );

    expect(callback).toHaveBeenCalledWith(null, "203.0.113.10", 4);
  });

  it("returns an address array when Node requests all results", () => {
    const callback = vi.fn();

    createPinnedLookup("2001:db8::10", 6)(
      "example.com",
      { all: true },
      callback
    );

    expect(callback).toHaveBeenCalledWith(null, [
      { address: "2001:db8::10", family: 6 }
    ]);
  });
});
