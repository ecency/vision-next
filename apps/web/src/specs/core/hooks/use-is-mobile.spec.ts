import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useIsMobile } from "@/features/ui/util/use-is-mobile";

describe("useIsMobile", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Set a default window size
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  afterEach(() => {
    // Restore original window size
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
  });

  it("should return false for desktop width (above 570px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true for mobile width (below 570px)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should return false for exactly 570px (boundary)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 570
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true for 569px (just below boundary)", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 569
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should update when window is resized from desktop to mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400
      });
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should update when window is resized from mobile to desktop", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800
      });
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should handle very small mobile widths", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 320
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should handle very large desktop widths", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 2560
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should handle multiple rapid resize events", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { result } = renderHook(() => useIsMobile());

    // Rapidly change window size
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400
      });
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800
      });
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 300
      });
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("should initialize with 0 on server-side (when window is undefined)", () => {
    // This test simulates SSR scenario
    const originalWindow = global.window;

    // @ts-ignore
    delete global.window;

    const { result } = renderHook(() => useIsMobile());

    // When window is undefined, it initializes with 0, which is < 570
    expect(result.current).toBe(true);

    // Restore window
    global.window = originalWindow;
  });

  it("should handle tablet widths correctly", () => {
    // Typical tablet width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false); // Tablet is not considered mobile in this hook
  });

  it("should handle edge case of 1px width", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
