import { useCallback, useEffect } from "react";
import { useLocalStorage } from "react-use";

const SYNCHRONIZED_LOCAL_STORAGE_EVENT = "useSynchronizedLocalStorageUpdate";

interface SynchronizedLocalStorageEvent<T> {
  value?: T;
  key: string;
}

/**
 * Single localStorage key shared across all hook instances with live sync.
 * When one instance updates the value, others receive the update via a custom
 * window event and re-render with the new value.
 */
export function useSynchronizedLocalStorage<T>(
  key: string,
  initialValue: T,
): readonly [T, (value: T) => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue);

  useEffect(() => {
    const handler = (e: Event) => {
      const typedEvent = e as CustomEvent<SynchronizedLocalStorageEvent<T>>;
      if (typedEvent.detail.key !== key) return;
      if (typeof typedEvent.detail.value !== "undefined") {
        setValue(typedEvent.detail.value);
      } else {
        removeValue();
      }
    };
    window.addEventListener(SYNCHRONIZED_LOCAL_STORAGE_EVENT, handler);
    return () => window.removeEventListener(SYNCHRONIZED_LOCAL_STORAGE_EVENT, handler);
  }, [key, setValue, removeValue]);

  const setValueSync = useCallback(
    (v: T) => {
      setValue(v);
      window.dispatchEvent(
        new CustomEvent<SynchronizedLocalStorageEvent<T>>(
          SYNCHRONIZED_LOCAL_STORAGE_EVENT,
          { detail: { key, value: v } },
        ),
      );
    },
    [key, setValue],
  );

  const clearValueSync = useCallback(() => {
    removeValue();
    window.dispatchEvent(
      new CustomEvent<SynchronizedLocalStorageEvent<T>>(
        SYNCHRONIZED_LOCAL_STORAGE_EVENT,
        { detail: { key } },
      ),
    );
  }, [key, removeValue]);

  return [
    (value ?? initialValue) as T,
    setValueSync,
    clearValueSync,
  ] as const;
}
