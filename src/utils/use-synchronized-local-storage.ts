"use client";

import { useLocalStorage, useMount, useUnmount } from "react-use";
import { useCallback, useState } from "react";

type useLocalStorageType<T> = typeof useLocalStorage<T>;

interface SynchronizedLocalStorageEvent<T> {
  value?: T;
  key: string;
}

const SYNCHRONIZED_LOCAL_STORAGE_EVENT = "useSynchronizedLocalStorageUpdate";

/**
 * Allow to one local storage record and keep live-time update wherever this hook will be called in app
 *
 * It uses window event bus for sharing updates between instances
 *
 * Keep in mind that this live-time update is synchronous process
 *
 * @param key Local storage record key
 * @param initialValue Initial value
 * @param options Options of serialization and deserialization
 * @param persistent Make it persistent to LS or use simple useState
 */
export function useSynchronizedLocalStorage<T>(
  key: string,
  initialValue?: T,
  options?: Parameters<useLocalStorageType<T>>[2],
  persistent = true
) {
  // As TS 4.8+ only supports passing generic to function type
  // Replace it with: type useLocalStorageType<T> = typeof useLocalStorage<T>;

  const [logicalValue, setLogicalValue] = useState<T | undefined>(initialValue);
  const [value, setValue, clearValue] = useLocalStorage<T>(key, initialValue, options);

  const handler = useCallback(
    (e: Event) => {
      const typedEvent = e as unknown as CustomEvent<SynchronizedLocalStorageEvent<T>>;
      if (typedEvent.detail.key === key) {
        if (typeof typedEvent.detail.value !== "undefined") {
          setValue(typedEvent.detail.value);
        } else {
          clearValue();
        }
      }
    },
    [clearValue, key, setValue]
  );

  useMount(() => {
    window.addEventListener(SYNCHRONIZED_LOCAL_STORAGE_EVENT, handler);
  });

  useUnmount(() => {
    window.removeEventListener(SYNCHRONIZED_LOCAL_STORAGE_EVENT, handler);
  });

  const setValueFn = useCallback(
    (v?: T) => {
      console.log(persistent, v);
      if (persistent) {
        setValue(v);

        const event = new CustomEvent<SynchronizedLocalStorageEvent<T>>(
          SYNCHRONIZED_LOCAL_STORAGE_EVENT,
          { detail: { key, value: v } }
        );
        window.dispatchEvent(event);
      } else {
        setLogicalValue(v);
      }
    },
    [key, persistent, setValue]
  );

  const clearValueFn = useCallback(() => {
    if (persistent) {
      const event = new CustomEvent<SynchronizedLocalStorageEvent<T>>(
        SYNCHRONIZED_LOCAL_STORAGE_EVENT,
        { detail: { key } }
      );
      window.dispatchEvent(event);

      clearValue();
    } else {
      setLogicalValue(undefined);
    }
  }, [clearValue, key, persistent]);

  return [persistent ? value : logicalValue, setValueFn, clearValueFn] as const;
}
