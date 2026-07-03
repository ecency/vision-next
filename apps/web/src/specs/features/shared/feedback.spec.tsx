import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { Feedback } from "@/features/shared/feedback/feedback";
import { FeedbackObject } from "@/features/shared/feedback/feedback-events";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock("@/core/global-store", () => ({
  useGlobalStore: vi.fn((selector: (state: any) => any) => selector({ activeUser: null }))
}));

// Toasts enter with a pure CSS keyframe and exit with a 150ms
// useMountTransition-driven fade + slide-down. These tests pin that both the
// close button and the 5s auto-expiry play the exit before unmounting, and
// that hover still pauses auto-expiry.
describe("Feedback", () => {
  const emit = (detail: Partial<FeedbackObject>) =>
    act(() => {
      window.dispatchEvent(
        new CustomEvent("ecency-feedback", {
          detail: { id: "toast-1", type: "success", message: "saved!", ...detail }
        })
      );
    });

  const toastWrapper = () => document.querySelector(".feedback-item-enter");

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders an incoming toast with the CSS entrance class", () => {
    render(<Feedback />);
    emit({ message: "saved!" });

    expect(screen.getByText("saved!")).toBeInTheDocument();
    expect(toastWrapper()).not.toBeNull();
  });

  it("animates out on manual close, then unmounts", () => {
    render(<Feedback />);
    emit({ message: "saved!" });

    // Let the entrance settle (open flips true a couple of rAFs after mount)
    // so the opacity-0 below is genuinely the exit state.
    act(() => vi.advanceTimersByTime(100));
    expect(toastWrapper()!.className).toContain("opacity-100");

    fireEvent.click(screen.getByRole("button", { name: "g.close" }));

    // Exit state applies while the toast is still mounted...
    expect(screen.getByText("saved!")).toBeInTheDocument();
    expect(toastWrapper()!.className).toContain("opacity-0");
    expect(toastWrapper()!.className).toContain("translate-y-3");

    // ...and the 150ms exit timer removes it from the store.
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText("saved!")).not.toBeInTheDocument();
  });

  it("animates out on auto-expiry, then unmounts", () => {
    render(<Feedback />);
    emit({ message: "saved!" });

    act(() => vi.advanceTimersByTime(100));
    expect(toastWrapper()!.className).toContain("opacity-100");

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByText("saved!")).toBeInTheDocument();
    expect(toastWrapper()!.className).toContain("opacity-0");

    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText("saved!")).not.toBeInTheDocument();
  });

  it("hover pauses auto-expiry; leaving re-arms it", () => {
    render(<Feedback />);
    emit({ message: "saved!" });

    fireEvent.mouseEnter(screen.getByRole("alert"));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText("saved!")).toBeInTheDocument();
    expect(toastWrapper()!.className).not.toContain("opacity-0");

    fireEvent.mouseLeave(screen.getByRole("alert"));
    // Auto-expiry fires at 5s; the exit timer is only scheduled once React
    // flushes that update, so the 150ms exit needs its own advance.
    act(() => vi.advanceTimersByTime(5000));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText("saved!")).not.toBeInTheDocument();
  });

  it("dismisses toasts independently", () => {
    render(<Feedback />);
    emit({ id: "toast-1", message: "first" });
    emit({ id: "toast-2", message: "second" });

    const closeButtons = screen.getAllByRole("button", { name: "g.close" });
    fireEvent.click(closeButtons[0]);
    act(() => vi.advanceTimersByTime(200));

    expect(screen.queryByText("first")).not.toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });
});
