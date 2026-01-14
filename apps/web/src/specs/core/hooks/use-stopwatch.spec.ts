import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStopwatch } from "@/utils/use-stopwatch";

describe("useStopwatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with zero time", () => {
    const { result } = renderHook(() => useStopwatch());

    expect(result.current.seconds).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("should start counting when start is called", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(1);
      expect(result.current.minutes).toBe(0);
      expect(result.current.hours).toBe(0);
    });
  });

  it("should increment seconds correctly", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(5);
      expect(result.current.minutes).toBe(0);
      expect(result.current.hours).toBe(0);
    });
  });

  it("should roll over to minutes after 60 seconds", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(60000); // 60 seconds
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(0);
      expect(result.current.minutes).toBe(1);
      expect(result.current.hours).toBe(0);
    });
  });

  it("should roll over to hours after 60 minutes", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3600000); // 3600 seconds = 1 hour
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(0);
      expect(result.current.minutes).toBe(0);
      expect(result.current.hours).toBe(1);
    });
  });

  it("should clear time and stop when clear is called", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(5);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.hours).toBe(0);
  });

  it("should handle complex time like 1:23:45", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    // 1 hour + 23 minutes + 45 seconds = 5025 seconds
    act(() => {
      vi.advanceTimersByTime(5025000);
    });

    await waitFor(() => {
      expect(result.current.hours).toBe(1);
      expect(result.current.minutes).toBe(23);
      expect(result.current.seconds).toBe(25);
    });
  });

  it("should stop counting after clear is called", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(3);
    });

    act(() => {
      result.current.clear();
    });

    act(() => {
      vi.advanceTimersByTime(3000); // Advance more time
    });

    // Time should still be 0 because timer was cleared
    expect(result.current.seconds).toBe(0);
  });

  it("should allow manual control of isActive state", () => {
    const { result } = renderHook(() => useStopwatch());

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.setIsActive(true);
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.setIsActive(false);
    });

    expect(result.current.isActive).toBe(false);
  });

  it("should clean up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const { result, unmount } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should handle multiple start calls without breaking", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
      result.current.start(); // Call start twice
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      // Should still work correctly
      expect(result.current.seconds).toBeGreaterThan(0);
    });
  });

  it("should provide all time values in return object", () => {
    const { result } = renderHook(() => useStopwatch());

    expect(result.current).toHaveProperty("seconds");
    expect(result.current).toHaveProperty("minutes");
    expect(result.current).toHaveProperty("hours");
    expect(result.current).toHaveProperty("isActive");
    expect(result.current).toHaveProperty("clear");
    expect(result.current).toHaveProperty("start");
    expect(result.current).toHaveProperty("setIsActive");
  });

  it("should handle edge case of exactly 60 seconds transition", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(59000); // 59 seconds
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(59);
      expect(result.current.minutes).toBe(0);
    });

    act(() => {
      vi.advanceTimersByTime(1000); // 1 more second = 60 total
    });

    await waitFor(() => {
      expect(result.current.seconds).toBe(0);
      expect(result.current.minutes).toBe(1);
    });
  });
});
