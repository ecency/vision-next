import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionActiveKey,
  getSessionActiveKey,
  setSessionActiveKey
} from "@/utils/session-active-key";
import * as ls from "@/utils/local-storage";

// Shaped like a WIF (base58, 51 chars) so the store's format guard accepts it.
const KEY = "5J" + "activekey".repeat(5) + "abcd";

describe("session active key", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSessionActiveKey();
    ls.set("active_user", "alice");
  });

  it("returns the key to the account that entered it", () => {
    setSessionActiveKey(KEY, "alice");
    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("keeps the key across reads, no expiry inside the tab session", () => {
    vi.useFakeTimers();
    try {
      setSessionActiveKey(KEY, "alice");
      // The old behaviour dropped the key 60s after it was entered, which is what
      // made every tip re-prompt.
      vi.advanceTimersByTime(60_000 * 60);
      expect(getSessionActiveKey("alice")).toBe(KEY);
    } finally {
      vi.useRealTimers();
    }
  });

  it("survives a page reload in the same tab", () => {
    setSessionActiveKey(KEY, "alice");
    // A reload drops module state but keeps sessionStorage.
    clearMemoryOnly();
    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("is gone once sessionStorage is gone (tab closed)", () => {
    setSessionActiveKey(KEY, "alice");
    window.sessionStorage.clear();
    clearMemoryOnly();
    expect(getSessionActiveKey("alice")).toBeNull();
  });

  it("never hands the key to a broadcast for another account", () => {
    setSessionActiveKey(KEY, "alice");
    // A read for someone else gets nothing, but alice is still logged in here,
    // so her own record survives the question.
    expect(getSessionActiveKey("bob")).toBeNull();
    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("drops the record once that account is no longer logged in", () => {
    setSessionActiveKey(KEY, "alice");
    // A logout in any tab removes the shared active_user entry, which is what
    // invalidates a copy a duplicated tab inherited.
    ls.remove("active_user");
    expect(getSessionActiveKey("alice")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("drops the record when another tab switched accounts", () => {
    setSessionActiveKey(KEY, "alice");
    ls.set("active_user", "bob");
    expect(getSessionActiveKey("alice")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("defaults to the active user when no username is passed", () => {
    setSessionActiveKey(KEY);
    expect(getSessionActiveKey()).toBe(KEY);

    ls.set("active_user", "bob");
    expect(getSessionActiveKey()).toBeNull();
  });

  it("refuses a record whose key is not key-shaped (tampered storage)", () => {
    // Left as-is, an unparseable key fails the broadcast with an error the SDK
    // does not read as an auth problem, so no dialog would open to replace it.
    window.sessionStorage.setItem(
      "ecency_active-key-session",
      btoa(JSON.stringify({ username: "alice", key: "not-a-key" }))
    );
    expect(getSessionActiveKey("alice")).toBeNull();
  });

  it("clears both the memory copy and storage", () => {
    setSessionActiveKey(KEY, "alice");
    clearSessionActiveKey();
    expect(getSessionActiveKey("alice")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("still signs this page when sessionStorage is unavailable", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    try {
      setSessionActiveKey(KEY, "alice");
      expect(getSessionActiveKey("alice")).toBe(KEY);
    } finally {
      setItem.mockRestore();
    }
  });
});

/**
 * Simulates a reload: the module's in-memory mirror goes away, sessionStorage
 * does not. `clearSessionActiveKey` would wipe both, so drop the mirror by
 * reading through a storage round trip instead.
 */
function clearMemoryOnly() {
  const raw = window.sessionStorage.getItem("ecency_active-key-session");
  clearSessionActiveKey();
  if (raw !== null) {
    window.sessionStorage.setItem("ecency_active-key-session", raw);
  }
}
