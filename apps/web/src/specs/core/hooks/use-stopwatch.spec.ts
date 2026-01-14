import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStopwatch } from "@/utils/use-stopwatch";

describe("useStopwatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
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

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.seconds).toBe(3);
  });

  it("should increment seconds correctly", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.seconds).toBe(5);
    expect(result.current.minutes).toBe(0);
    expect(result.current.hours).toBe(0);
  });

  it("should roll over to minutes after 60 seconds", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.minutes).toBe(1);
    expect(result.current.hours).toBe(0);
  });

  it("should clear time and stop when clear is called", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.seconds).toBe(5);

    act(() => {
      result.current.clear();
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.hours).toBe(0);
  });

  it("should stop counting after clear is called", async () => {
    const { result } = renderHook(() => useStopwatch());

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.seconds).toBe(3);

    act(() => {
      result.current.clear();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // Should still be 0 since timer was cleared
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

    await act(async () => {
      await vi.advanceTimersByTimeAsync(59000);
    });

    expect(result.current.seconds).toBe(59);
    expect(result.current.minutes).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.minutes).toBe(1);
  });

  it("should handle multiple instances independently", () => {
    const { result: result1 } = renderHook(() => useStopwatch());
    const { result: result2 } = renderHook(() => useStopwatch());

    act(() => {
      result1.current.start();
    });

    expect(result1.current.isActive).toBe(true);
    expect(result2.current.isActive).toBe(false);
  });
});
