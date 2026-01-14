import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCountdown } from "@/utils/use-countdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with the provided initial time", () => {
    const { result } = renderHook(() => useCountdown(10));
    const [time] = result.current;
    expect(time).toBe(10);
  });

  it("should initialize with zero when provided", () => {
    const { result } = renderHook(() => useCountdown(0));
    const [time] = result.current;
    expect(time).toBe(0);
  });

  it("should count down by 1 every second", async () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(4);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(3);
    });
  });

  it("should stop counting at zero", async () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(1);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(0);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(0); // Should stay at 0
    });
  });

  it("should allow manual time updates via setter", async () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      const [, setTime] = result.current;
      setTime(10);
    });

    const [time] = result.current;
    expect(time).toBe(10);
  });

  it("should continue countdown after manual time update", async () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      const [, setTime] = result.current;
      setTime(3);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(2);
    });
  });

  it("should handle countdown from large numbers", async () => {
    const { result } = renderHook(() => useCountdown(100));

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(95);
    });
  });

  it("should handle resetting countdown to zero manually", async () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      vi.advanceTimersByTime(3000); // Count down 3 seconds
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(7);
    });

    act(() => {
      const [, setTime] = result.current;
      setTime(0);
    });

    const [time] = result.current;
    expect(time).toBe(0);
  });

  it("should clear interval when countdown reaches zero", async () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const { result } = renderHook(() => useCountdown(1));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(0);
    });

    // ClearInterval should have been called when reaching 0
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should handle countdown with initial value of 1", async () => {
    const { result } = renderHook(() => useCountdown(1));

    const [initialTime] = result.current;
    expect(initialTime).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(0);
    });
  });

  it("should not go negative", async () => {
    const { result } = renderHook(() => useCountdown(0));

    act(() => {
      vi.advanceTimersByTime(5000); // Advance well past zero
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(0);
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  it("should handle rapid timer advances", async () => {
    const { result } = renderHook(() => useCountdown(50));

    act(() => {
      vi.advanceTimersByTime(10000); // Advance 10 seconds
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(40);
    });

    act(() => {
      vi.advanceTimersByTime(40000); // Advance 40 more seconds
    });

    await waitFor(() => {
      const [time] = result.current;
      expect(time).toBe(0);
    });
  });
});
