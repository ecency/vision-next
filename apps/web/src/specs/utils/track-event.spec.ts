import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "@/utils/track-event";

const w = window as any;

afterEach(() => {
  delete w.plausible;
});

describe("trackEvent", () => {
  it("calls window.plausible with the event and props", () => {
    w.plausible = vi.fn();
    trackEvent("Spotlight: Click", { id: "x", feature: "waves" });
    expect(w.plausible).toHaveBeenCalledWith("Spotlight: Click", {
      props: { id: "x", feature: "waves" }
    });
  });

  it("queues the event when the script has not loaded yet", () => {
    trackEvent("Spotlight: Impression", { id: "x", feature: "waves" });
    expect(w.plausible.q[0]).toEqual([
      "Spotlight: Impression",
      { props: { id: "x", feature: "waves" } }
    ]);
  });

  it("omits props when none are given", () => {
    w.plausible = vi.fn();
    trackEvent("Ping");
    expect(w.plausible).toHaveBeenCalledWith("Ping", undefined);
  });
});
