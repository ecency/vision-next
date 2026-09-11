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

  it("keeps the key through a long run of tips", () => {
    vi.useFakeTimers();
    try {
      setSessionActiveKey(KEY, "alice");

      // The old behaviour armed a 60s timer when the key was typed and never
      // refreshed it on use, so the second tip of a session asked again. Using
      // the key now pushes the window out: tipping for hours never re-prompts.
      for (let hour = 0; hour < 6; hour++) {
        vi.advanceTimersByTime(90 * 60 * 1000);
        expect(getSessionActiveKey("alice")).toBe(KEY);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops the key after two idle hours", () => {
    vi.useFakeTimers();
    try {
      setSessionActiveKey(KEY, "alice");
      vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000);

      expect(getSessionActiveKey("alice")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("gates the idle window on the clock, not only on a timer that may not run", () => {
    vi.useFakeTimers();
    try {
      setSessionActiveKey(KEY, "alice");
      // A background tab's timers are throttled and a suspended machine runs
      // none, so the read must not depend on the timer having fired.
      vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000);

      expect(getSessionActiveKey("alice")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("never writes the key to browser storage", () => {
    setSessionActiveKey(KEY, "alice");

    // The whole point of holding it in a module variable: nothing to restore
    // with a reopened tab, nothing on disk, nothing another tab can read.
    expect(window.sessionStorage.length).toBe(0);
    expect(JSON.stringify(window.localStorage)).not.toContain(KEY);
  });

  it("never hands the key to a broadcast for another account", () => {
    setSessionActiveKey(KEY, "alice");
    // A read for someone else gets nothing, but alice is still logged in here,
    // so her own key survives the question.
    expect(getSessionActiveKey("bob")).toBeNull();
    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("withholds the key when no active user can be read, without dropping it", () => {
    setSessionActiveKey(KEY, "alice");
    // ls.get returns null for a blocked or failing read as well as for a real
    // logout. A real logout already clears the store through setActiveUser, so
    // this case withholds rather than destroys.
    ls.remove("active_user");
    expect(getSessionActiveKey("alice")).toBeNull();

    ls.set("active_user", "alice");
    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("drops the key when another tab switched accounts", () => {
    setSessionActiveKey(KEY, "alice");
    ls.set("active_user", "bob");
    expect(getSessionActiveKey("alice")).toBeNull();

    // Gone for good, not merely withheld while bob is active.
    ls.set("active_user", "alice");
    expect(getSessionActiveKey("alice")).toBeNull();
  });

  it("defaults to the active user when no username is passed", () => {
    setSessionActiveKey(KEY);
    expect(getSessionActiveKey()).toBe(KEY);

    ls.set("active_user", "bob");
    expect(getSessionActiveKey()).toBeNull();
  });

  it("refuses to hold a value that is not key-shaped", () => {
    setSessionActiveKey("not-a-key", "alice");
    expect(getSessionActiveKey("alice")).toBeNull();
  });

  it("treats an empty caller username as a mismatch, not as no scoping", () => {
    setSessionActiveKey(KEY, "alice");
    expect(getSessionActiveKey("")).toBeNull();
  });

  it("clears on demand", () => {
    setSessionActiveKey(KEY, "alice");
    clearSessionActiveKey();
    expect(getSessionActiveKey("alice")).toBeNull();
  });
});

describe("session active key across documents", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSessionActiveKey();
    ls.set("active_user", "alice");
  });

  it("does not survive a reload, a reopened tab or a duplicated tab", async () => {
    setSessionActiveKey(KEY, "alice");

    // A fresh document is what a reload, a restored tab and a duplicated tab all
    // start with. The key lives in module state, so none of them inherit it.
    vi.resetModules();
    const nextDocument = await import("@/utils/session-active-key");

    expect(nextDocument.getSessionActiveKey("alice")).toBeNull();
  });
});
