import { describe, expect, it } from "vitest";
import { EntryBodyManagement } from "@/features/entry-management/entry-body-manager";

const withLocation = (
  body: string,
  location?: { coordinates: { lat: number | string; lng: number | string }; address?: string }
) =>
  EntryBodyManagement.EntryBodyManager.shared
    .builder()
    .withLocation(body, location as { coordinates: { lat: number; lng: number }; address?: string });

describe("EntryBodyBuilder.withLocation", () => {
  it("appends a well-formed worldmappin marker", () => {
    const out = withLocation("hello", {
      coordinates: { lat: 54.9027, lng: 23.9096 },
      address: "Kaunas, Lithuania"
    });
    expect(out).toContain("[//]:# (!worldmappin 54.902700 lat 23.909600 long Kaunas, Lithuania d3scr)");
  });

  it("strips parentheses from the address so the markdown comment isn't truncated", () => {
    const out = withLocation("body", {
      coordinates: { lat: 52.3412, lng: 14.5506 },
      address: "Frankfurt (Oder), Brandenburg, Germany"
    });
    // exactly one ")" — the directive terminator — must remain
    expect((out.match(/\)/g) ?? []).length).toBe(1);
    expect(out).not.toContain("(Oder)");
    expect(out).toContain("Frankfurt Oder, Brandenburg, Germany d3scr)");
  });

  it("collapses newlines in the address", () => {
    const out = withLocation("body", {
      coordinates: { lat: 1, lng: 2 },
      address: "Line one\nLine two"
    });
    expect(out).toContain("long Line one Line two d3scr)");
    expect(out).not.toContain("\nLine two");
  });

  it("coerces string coordinates (as produced by the body parser) instead of crashing", () => {
    const out = withLocation("body", {
      coordinates: { lat: "54.9027", lng: "23.9096" },
      address: "Kaunas"
    });
    expect(out).toContain("54.902700 lat 23.909600 long");
  });

  it("skips the marker when coordinates are not finite numbers", () => {
    const out = withLocation("body", {
      coordinates: { lat: "abc", lng: "def" },
      address: "Nowhere"
    });
    expect(out).toBe("body");
  });

  it("returns the body unchanged when no location is given", () => {
    expect(withLocation("body")).toBe("body");
  });
});
