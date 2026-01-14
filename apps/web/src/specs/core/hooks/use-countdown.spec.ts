import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "@/utils/use-countdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
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

  it("should count down over time", async () => {
    const { result } = renderHook(() => useCountdown(5));

    // Initial value
    expect(result.current[0]).toBe(5);

    // Advance 3 seconds and check the value
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current[0]).toBe(2);
  });

  it("should stop counting at zero", async () => {
    const { result } = renderHook(() => useCountdown(2));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000); // More than needed
    });

    expect(result.current[0]).toBe(0);
  });

  it("should allow manual time updates via setter", () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      const [, setTime] = result.current;
      setTime(10);
    });

    expect(result.current[0]).toBe(10);
  });

  it("should continue countdown after manual time update", async () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      const [, setTime] = result.current;
      setTime(3);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current[0]).toBe(2);
  });

  it("should handle resetting countdown to zero manually", async () => {
    const { result } = renderHook(() => useCountdown(10));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current[0]).toBe(7);

    act(() => {
      const [, setTime] = result.current;
      setTime(0);
    });

    expect(result.current[0]).toBe(0);
  });

  it("should not go negative", () => {
    const { result } = renderHook(() => useCountdown(0));
    const [time] = result.current;
    expect(time).toBe(0);
    expect(time).toBeGreaterThanOrEqual(0);
  });

  it("should handle multiple instances independently", () => {
    const { result: result1 } = renderHook(() => useCountdown(5));
    const { result: result2 } = renderHook(() => useCountdown(10));

    expect(result1.current[0]).toBe(5);
    expect(result2.current[0]).toBe(10);
  });

  it("should update value when time advances", async () => {
    const { result } = renderHook(() => useCountdown(100));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current[0]).toBe(95);
  });
});
