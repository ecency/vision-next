import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Controllable framer-motion mock:
// - `animate()` returns a promise we resolve manually, so a sequence can be left
//   "in flight" across an unmount.
// - `scope` is a real ref object that React attaches to the root <div ref={scope}>;
//   React sets it to the element on mount and back to null on unmount, exactly
//   like framer-motion's useAnimate scope.
const { scopeRef, animateMock, deferreds } = vi.hoisted(() => {
  const deferreds: Array<() => void> = [];
  return {
    deferreds,
    scopeRef: { current: null as Element | null },
    animateMock: vi.fn(() => new Promise<void>((resolve) => deferreds.push(resolve)))
  };
});

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MotionDiv = React.forwardRef(function MotionDiv(props: any, ref: any) {
    // Strip framer-only props so they don't leak onto the DOM node.
    const { initial, animate, exit, transition, variants, layout, whileHover, whileTap, whileInView, ...rest } =
      props;
    return React.createElement("div", { ...rest, ref });
  });
  return {
    useAnimate: () => [scopeRef, animateMock],
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    motion: new Proxy({}, { get: () => MotionDiv })
  };
});

import { OnboardingFrame } from "@/app/publish/_frames/onboarding-frame";

describe("OnboardingFrame", () => {
  beforeEach(() => {
    animateMock.mockClear();
    deferreds.length = 0;
    scopeRef.current = null;
  });

  it("dispatches the entrance animation on mount", () => {
    render(<OnboardingFrame step="single-view" />);
    expect(animateMock).toHaveBeenCalled();
  });

  // Regression: unmounting mid-animation used to call animate() on a detached
  // scope and throw a TypeError (Sentry). The cancelled flag + scope.current
  // guard must stop the sequence cold once the component is gone.
  it("stops dispatching animations after unmount", async () => {
    const { unmount } = render(<OnboardingFrame step="single-view" />);

    const callsBeforeUnmount = animateMock.mock.calls.length;
    expect(callsBeforeUnmount).toBeGreaterThanOrEqual(1);

    // Unmount while the first animation is still pending: React nulls
    // scope.current and the effect cleanup flips the cancelled flag.
    unmount();

    // Resolve the in-flight animation so the awaited sequence would advance.
    await act(async () => {
      deferreds.forEach((resolve) => resolve());
      await Promise.resolve();
    });

    // Guard must prevent any further animate() calls after unmount.
    expect(animateMock.mock.calls.length).toBe(callsBeforeUnmount);
  });
});
