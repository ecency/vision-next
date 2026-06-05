import { describe, it, expect } from "vitest";
import type { Spotlight } from "@ecency/sdk";
import { pickSpotlight } from "@/app/_components/feature-spotlight-widget/select";

const base: Spotlight = {
  id: "a",
  feature: "waves",
  title: "t",
  description: "d",
  button_text: "b",
  button_link: "/waves"
};

const make = (over: Partial<Spotlight>): Spotlight => ({ ...base, ...over });
const user = { username: "u" };

describe("pickSpotlight", () => {
  it("returns null when there are no items", () => {
    expect(pickSpotlight([], user, "/", [])).toBeNull();
  });

  it("hides auth-required spotlights from anonymous users", () => {
    expect(pickSpotlight([make({ id: "x", auth: true })], null, "/", [])).toBeNull();
  });

  it("shows auth:false spotlights to anonymous users", () => {
    expect(pickSpotlight([make({ id: "x", auth: false })], null, "/", [])?.id).toBe("x");
  });

  it("filters by platform — a mobile-only spotlight is hidden on web", () => {
    const items = [make({ id: "m", platforms: ["mobile"] })];
    expect(pickSpotlight(items, user, "/", [], "web")).toBeNull();
    expect(pickSpotlight(items, user, "/", [], "mobile")?.id).toBe("m");
  });

  it("treats missing platforms as all platforms", () => {
    const items = [make({ id: "all" })];
    expect(pickSpotlight(items, user, "/", [], "web")?.id).toBe("all");
    expect(pickSpotlight(items, user, "/", [], "mobile")?.id).toBe("all");
  });

  it("respects a path regex", () => {
    const items = [make({ id: "p", path: "^/waves" })];
    expect(pickSpotlight(items, user, "/communities", [])).toBeNull();
    expect(pickSpotlight(items, user, "/waves", [])?.id).toBe("p");
  });

  it("supports path arrays", () => {
    const items = [make({ id: "p", path: ["^/waves", "^/polls"] })];
    expect(pickSpotlight(items, user, "/polls", [])?.id).toBe("p");
  });

  it("excludes dismissed ids", () => {
    expect(pickSpotlight([make({ id: "seen" })], user, "/", ["seen"])).toBeNull();
  });

  it("picks the highest weight", () => {
    const items = [make({ id: "lo", weight: 1 }), make({ id: "hi", weight: 10 })];
    expect(pickSpotlight(items, user, "/", [])?.id).toBe("hi");
  });

  it("breaks weight ties by earliest start", () => {
    const items = [
      make({ id: "late", weight: 5, start: "2026-06-10" }),
      make({ id: "early", weight: 5, start: "2026-06-01" })
    ];
    expect(pickSpotlight(items, user, "/", [])?.id).toBe("early");
  });
});
