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

  it("never hands the key to a broadcast for another account", () => {
    setSessionActiveKey(KEY, "alice");
    // A read for someone else gets nothing, but alice is still logged in here,
    // so her own record survives the question.
    expect(getSessionActiveKey("bob")).toBeNull();
    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("withholds the key when no active user can be read, without destroying it", () => {
    setSessionActiveKey(KEY, "alice");
    // ls.get returns null for a blocked or failing read as well as for a real
    // logout. A real logout already clears the store through setActiveUser, so
    // this case withholds rather than destroys.
    ls.remove("active_user");
    expect(getSessionActiveKey("alice")).toBeNull();

    ls.set("active_user", "alice");
    expect(getSessionActiveKey("alice")).toBe(KEY);
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

  it("refuses to store a value that is not key-shaped", () => {
    setSessionActiveKey("not-a-key", "alice");
    expect(getSessionActiveKey("alice")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("treats an empty caller username as a mismatch, not as no scoping", () => {
    setSessionActiveKey(KEY, "alice");
    expect(getSessionActiveKey("")).toBeNull();
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
 * A fresh document in the same tab: module state goes, sessionStorage stays.
 * That is the difference between a reload and a page that never went away. It
 * is where the handoff stamp decides whether the key may be picked up.
 */
async function nextDocument() {
  vi.resetModules();
  return import("@/utils/session-active-key");
}

function closeDocument() {
  window.dispatchEvent(new Event("pagehide"));
}

describe("session active key across documents", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSessionActiveKey();
    ls.set("active_user", "alice");
  });

  it("survives a reload of the same tab", async () => {
    setSessionActiveKey(KEY, "alice");
    closeDocument();

    const reloaded = await nextDocument();
    expect(reloaded.getSessionActiveKey("alice")).toBe(KEY);
  });

  it("is refused by a tab reopened later, which browsers restore storage into", async () => {
    vi.useFakeTimers();
    try {
      setSessionActiveKey(KEY, "alice");
      closeDocument();
      // Chrome keeps session storage on disk for "reopen closed tab", so the
      // record is still here. Only the stale stamp says the tab went away.
      vi.advanceTimersByTime(60_000 * 5);

      const reopened = await nextDocument();
      expect(reopened.getSessionActiveKey("alice")).toBeNull();
      expect(window.sessionStorage.length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("is refused by a duplicated tab, which copies the record while it is held", async () => {
    setSessionActiveKey(KEY, "alice");
    // No pagehide: the source tab is still open, so its record carries no stamp.

    const duplicate = await nextDocument();
    expect(duplicate.getSessionActiveKey("alice")).toBeNull();
  });

  it("does not let a reopened tab extend the window by reopening again", async () => {
    setSessionActiveKey(KEY, "alice");
    closeDocument();

    const reloaded = await nextDocument();
    expect(reloaded.getSessionActiveKey("alice")).toBe(KEY);

    // The stamp is stripped on pickup, so a document that never says goodbye
    // hands nothing to the next one.
    const third = await nextDocument();
    expect(third.getSessionActiveKey("alice")).toBeNull();
  });

  it("is gone once sessionStorage is gone", async () => {
    setSessionActiveKey(KEY, "alice");
    closeDocument();
    window.sessionStorage.clear();

    const reloaded = await nextDocument();
    expect(reloaded.getSessionActiveKey("alice")).toBeNull();
  });
});
