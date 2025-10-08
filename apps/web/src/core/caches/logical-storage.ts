"use client";

import { useCallback, useState } from "react";

export class LogicalStorage implements Storage {
  static global = new LogicalStorage();

  [name: string]: unknown;
  length: number = 0;

  clear() {
    Object.getOwnPropertyNames(this).forEach((key) => this.removeItem(key));
  }

  getItem<T>(key: string): T {
    return this[key] as T;
  }

  key(index: number): string | null {
    throw new Error("Method not implemented.");
  }

  removeItem(key: string): void {
    delete this[key];
  }

  setItem<T>(key: string, value: T): void {
    this[key] = value;
  }
}

export function useLogicalStorage<T>(key: string, initialValue: T | undefined) {
  const [state, setState] = useState(LogicalStorage.global.getItem<T>(key) ?? initialValue);

  const set = useCallback(
    (val: T | undefined) => {
      setState(val);
      LogicalStorage.global.setItem(key, val);
    },
    [key]
  );

  return [state, set] as const;
}
