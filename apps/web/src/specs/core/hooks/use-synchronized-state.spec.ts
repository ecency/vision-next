import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSynchronizedState } from "@/utils/use-synchronized-state";

describe("useSynchronizedState", () => {
  beforeEach(() => {
    // Clear all event listeners before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining event listeners
    const events = (window as any)._events || {};
    Object.keys(events).forEach((key) => {
      delete events[key];
    });
  });

  it("should initialize with undefined when no initial value provided", () => {
    const { result } = renderHook(() => useSynchronizedState<string>("test-key"));
    const [value] = result.current;
    expect(value).toBeUndefined();
  });

  it("should initialize with provided initial value", () => {
    const { result } = renderHook(() =>
      useSynchronizedState<string>("test-key", "initial-value")
    );
    const [value] = result.current;
    expect(value).toBe("initial-value");
  });

  it("should update value when setter is called", () => {
    const { result } = renderHook(() =>
      useSynchronizedState<string>("test-key", "initial")
    );

    act(() => {
      const [, setValue] = result.current;
      setValue("updated");
    });

    const [value] = result.current;
    expect(value).toBe("updated");
  });

  it("should synchronize state across multiple hook instances with same key", async () => {
    const { result: result1 } = renderHook(() =>
      useSynchronizedState<string>("shared-key", "initial")
    );
    const { result: result2 } = renderHook(() =>
      useSynchronizedState<string>("shared-key", "initial")
    );

    act(() => {
      const [, setValue1] = result1.current;
      setValue1("synchronized-value");
    });

    await waitFor(() => {
      const [value2] = result2.current;
      expect(value2).toBe("synchronized-value");
    });
  });

  it("should not synchronize state across different keys", async () => {
    const { result: result1 } = renderHook(() =>
      useSynchronizedState<string>("key-1", "initial-1")
    );
    const { result: result2 } = renderHook(() =>
      useSynchronizedState<string>("key-2", "initial-2")
    );

    act(() => {
      const [, setValue1] = result1.current;
      setValue1("updated-1");
    });

    // Wait a bit to ensure any events would have been processed
    await new Promise((resolve) => setTimeout(resolve, 50));

    const [value2] = result2.current;
    expect(value2).toBe("initial-2"); // Should not change
  });

  it("should handle setting value to undefined", () => {
    const { result } = renderHook(() =>
      useSynchronizedState<string>("test-key", "initial")
    );

    act(() => {
      const [, setValue] = result.current;
      setValue(undefined);
    });

    const [value] = result.current;
    expect(value).toBeUndefined();
  });

  it("should work with different data types", async () => {
    interface TestObject {
      name: string;
      count: number;
    }

    const { result } = renderHook(() =>
      useSynchronizedState<TestObject>("object-key", { name: "test", count: 0 })
    );

    act(() => {
      const [, setValue] = result.current;
      setValue({ name: "updated", count: 42 });
    });

    const [value] = result.current;
    expect(value).toEqual({ name: "updated", count: 42 });
  });

  it("should dispatch custom event when value changes", () => {
    const eventSpy = vi.fn();
    window.addEventListener("useSynchronizedStateUpdate", eventSpy);

    const { result } = renderHook(() => useSynchronizedState<string>("test-key"));

    act(() => {
      const [, setValue] = result.current;
      setValue("new-value");
    });

    expect(eventSpy).toHaveBeenCalled();

    window.removeEventListener("useSynchronizedStateUpdate", eventSpy);
  });

  it("should include correct key and value in custom event", () => {
    let eventDetail: any = null;
    const eventHandler = (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    };
    window.addEventListener("useSynchronizedStateUpdate", eventHandler);

    const { result } = renderHook(() =>
      useSynchronizedState<string>("specific-key", "initial")
    );

    act(() => {
      const [, setValue] = result.current;
      setValue("specific-value");
    });

    expect(eventDetail).toEqual({
      key: "specific-key",
      value: "specific-value"
    });

    window.removeEventListener("useSynchronizedStateUpdate", eventHandler);
  });

  it("should clean up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useSynchronizedState<string>("test-key"));

    unmount();

    // Verify cleanup happened (implementation detail check)
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
         "useSynchronizedStateUpdate",
         expect.any(Function)
       );
    removeEventListenerSpy.mockRestore();
  });

  it("should handle rapid successive updates", async () => {
    const { result } = renderHook(() =>
      useSynchronizedState<number>("counter-key", 0)
    );

    act(() => {
      const [, setValue] = result.current;
      setValue(1);
      setValue(2);
      setValue(3);
      setValue(4);
      setValue(5);
    });

    const [value] = result.current;
    expect(value).toBe(5);
  });

  it("should maintain referential integrity for unchanged values", () => {
    const { result, rerender } = renderHook(() =>
      useSynchronizedState<string>("test-key", "value")
    );

    const [, setValueFunc1] = result.current;
    rerender();
    const [, setValueFunc2] = result.current;

    // The setter function should be stable due to useCallback
    expect(setValueFunc1).toBe(setValueFunc2);
  });

  it("should synchronize between three or more instances", async () => {
    const { result: result1 } = renderHook(() =>
      useSynchronizedState<string>("multi-key", "initial")
    );
    const { result: result2 } = renderHook(() =>
      useSynchronizedState<string>("multi-key", "initial")
    );
    const { result: result3 } = renderHook(() =>
      useSynchronizedState<string>("multi-key", "initial")
    );

    act(() => {
      const [, setValue1] = result1.current;
      setValue1("broadcast-value");
    });

    await waitFor(() => {
      const [value2] = result2.current;
      const [value3] = result3.current;
      expect(value2).toBe("broadcast-value");
      expect(value3).toBe("broadcast-value");
    });
  });
});
