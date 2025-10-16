"use client";

import { useCallback, useState } from "react";
import { useMount, useUnmount } from "react-use";

const SYNCHRONIZED_STATE_EVENT = "useSynchronizedStateUpdate";

interface SynchronizedStateEvent<T> {
  value?: T;
  key: string;
}

/**
 * Allow to one state record and keep live-time update wherever this hook will be called in app
 *
 * It uses window event bus for sharing updates between instances
 *
 * Keep in mind that this live-time update is synchronous process
 *
 * @param initialValue Initial valueate
 */
export function useSynchronizedState<T>(key: string, initialValue?: T) {
  // Make behavior as use local storage
  const [logicalValue, setLogicalValue] = useState<T | undefined>(initialValue);

  const handler = useCallback(
    (e: Event) => {
      const typedEvent = e as unknown as CustomEvent<SynchronizedStateEvent<T>>;
      if (typedEvent.detail.key === key) {
        if (typeof typedEvent.detail.value !== "undefined") {
          setLogicalValue(typedEvent.detail.value);
        } else {
          setLogicalValue(undefined);
        }
      }
    },
    [setLogicalValue]
  );

  useMount(() => {
    window.addEventListener(SYNCHRONIZED_STATE_EVENT, handler);
  });

  useUnmount(() => {
    window.removeEventListener(SYNCHRONIZED_STATE_EVENT, handler);
  });

  const setValueFn = useCallback(
    (v?: T) => {
      setLogicalValue(v);

      const event = new CustomEvent<SynchronizedStateEvent<T>>(SYNCHRONIZED_STATE_EVENT, {
        detail: { key, value: v }
      });
      window.dispatchEvent(event);
    },
    [setLogicalValue]
  );

  return [logicalValue, setValueFn] as const;
}
