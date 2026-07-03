import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OnboardingFrame } from "@/app/publish/_frames/onboarding-frame";

describe("OnboardingFrame", () => {
  it("mounts with a CSS entrance animation", () => {
    const { container } = render(<OnboardingFrame step="single-view" />);
    expect(container.firstElementChild?.classList.contains("animate-fade-in-up")).toBe(true);
  });

  it("renders step-specific content and swaps it on step change", () => {
    const { getByText, queryByText, rerender } = render(<OnboardingFrame step="settings" />);
    expect(getByText("Publish")).toBeTruthy();
    expect(document.getElementById("onboarding-frame-posting")).toBeNull();

    rerender(<OnboardingFrame step="posting" />);
    expect(queryByText("Publish")).toBeNull();
    expect(document.getElementById("onboarding-frame-posting")).toBeTruthy();
  });

  // The old scripted useAnimate sequence could throw when unmounted
  // mid-animation; the CSS version must always unmount cleanly.
  it("unmounts cleanly right after mount", () => {
    const { unmount } = render(<OnboardingFrame step="single-view" />);
    expect(() => unmount()).not.toThrow();
  });
});
