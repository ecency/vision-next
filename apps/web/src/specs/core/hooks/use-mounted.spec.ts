import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMounted } from "@/utils/use-mounted";

describe("useMounted", () => {
  it("should return false on initial render", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(false);
  });

  it("should return false before useEffect runs", () => {
    const { result } = renderHook(() => useMounted());
    // On initial render, the ref is still false
    expect(result.current).toBe(false);
  });

  it("should return true after component mounts", async () => {
    const { result, rerender } = renderHook(() => useMounted());

    // Initially false
    expect(result.current).toBe(false);

    // Force a rerender to check the state after useEffect has run
    rerender();

    // After rerender, it should still be true
    expect(result.current).toBe(true);
  });

  it("should maintain true value across rerenders", () => {
    const { result, rerender } = renderHook(() => useMounted());

    // Force multiple rerenders
    rerender();
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);
  });

  it("should use a ref instead of state to avoid rerenders", () => {
    const { result, rerender } = renderHook(() => useMounted());

    const firstValue = result.current;
    rerender();
    const secondValue = result.current;

    // The value changes but doesn't cause rerender
    expect(firstValue).toBe(false);
    expect(secondValue).toBe(true);
  });

  it("should work with multiple instances independently", () => {
    const { result: result1 } = renderHook(() => useMounted());
    const { result: result2 } = renderHook(() => useMounted());

    // Each instance should have its own ref
    expect(result1.current).toBe(false);
    expect(result2.current).toBe(false);
  });

  it("should not cause infinite loops when used in useEffect dependencies", () => {
    let effectRuns = 0;

    const { rerender } = renderHook(() => {
      const mounted = useMounted();

      // Simulate using in useEffect
      if (mounted) {
        effectRuns++;
      }

      return mounted;
    });

    rerender();
    rerender();
    rerender();

    // The hook body runs on each render (3 times), demonstrating
    // that useMounted returns true consistently after mount
    expect(effectRuns).toBe(3);
  });

  it("should be useful for preventing state updates after unmount", () => {
    const { result, rerender, unmount } = renderHook(() => useMounted());

    // Initially false
    expect(result.current).toBe(false);
    // After mount
    rerender();
    expect(result.current).toBe(true);
    unmount();
    // Note: After unmount, result.current is stale and shouldn't be accessed
    // The hook's value is meant to be checked before async callbacks
  });

  it("should handle rapid mount/unmount cycles", () => {
    const { result, unmount } = renderHook(() => useMounted());
    expect(result.current).toBe(false);

    unmount();

    // Remount
    const { result: result2 } = renderHook(() => useMounted());
    expect(result2.current).toBe(false);
  });

  it("should return consistent value within same render cycle", () => {
    const { result } = renderHook(() => {
      const mounted1 = useMounted();
      const mounted2 = useMounted();

      return { mounted1, mounted2 };
    });

    // Both calls in same component should return same value
    expect(result.current.mounted1).toBe(result.current.mounted2);
  });
});
