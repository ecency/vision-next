"use client";

import { useLocalStorage, useMount, useSessionStorage, useUnmount } from "react-use";
import { useCallback, useState } from "react";
import { useLogicalStorage } from "@/core/caches";

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
  // Make behavior as use local storage
  const [logicalValue, setLogicalValue] = useLogicalStorage<T>(key, initialValue);
  const [value, setValue, clearValue] = useLocalStorage<T>(key, initialValue, options);

  const handler = useCallback(
    (e: Event) => {
      const typedEvent = e as unknown as CustomEvent<SynchronizedLocalStorageEvent<T>>;
      if (typedEvent.detail.key === key) {
        if (typeof typedEvent.detail.value !== "undefined") {
          if (persistent) {
            setValue(typedEvent.detail.value);
          } else {
            setLogicalValue(typedEvent.detail.value);
          }
        } else {
          if (persistent) {
            clearValue();
          } else {
            setLogicalValue(undefined);
          }
        }
      }
    },
    [clearValue, key, persistent, setLogicalValue, setValue]
  );

  useMount(() => {
    window.addEventListener(SYNCHRONIZED_LOCAL_STORAGE_EVENT, handler);
  });

  useUnmount(() => {
    window.removeEventListener(SYNCHRONIZED_LOCAL_STORAGE_EVENT, handler);
  });

  const setValueFn = useCallback(
    (v?: T) => {
      if (persistent) {
        setValue(v);
      } else {
        setLogicalValue(v);
      }

      const event = new CustomEvent<SynchronizedLocalStorageEvent<T>>(
        SYNCHRONIZED_LOCAL_STORAGE_EVENT,
        { detail: { key, value: v } }
      );
      window.dispatchEvent(event);
    },
    [key, persistent, setLogicalValue, setValue]
  );

  const clearValueFn = useCallback(() => {
    if (persistent) {
      clearValue();
    } else {
      setLogicalValue(undefined);
    }
    const event = new CustomEvent<SynchronizedLocalStorageEvent<T>>(
      SYNCHRONIZED_LOCAL_STORAGE_EVENT,
      { detail: { key } }
    );
    window.dispatchEvent(event);
  }, [clearValue, key, persistent, setLogicalValue]);

  return [persistent ? value : logicalValue, setValueFn, clearValueFn] as const;
}
