import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthenticationActions } from "@/core/global-store/modules/authentication-module";
import { getSessionActiveKey, setSessionActiveKey } from "@/utils/session-active-key";
import * as ls from "@/utils/local-storage";

vi.mock("@/core/sentry/lazy-sentry", () => ({
  sentry: { setUser: vi.fn() }
}));

// Shaped like a WIF (base58, 51 chars) so the store's format guard accepts it.
const KEY = "5J" + "activekey".repeat(5) + "abcd";

/**
 * The store always starts with `activeUser: null`, so ClientInit restoring the
 * persisted username on every page load goes through `setActiveUser` too. Only a
 * genuine switch may drop the tab's active key.
 */
function actionsFor(currentUsername: string | null) {
  const state = { activeUser: currentUsername ? ({ username: currentUsername } as any) : null };
  return createAuthenticationActions(
    (patch) => Object.assign(state, patch),
    () => state as any
  );
}

describe("active user changes and the session active key", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("keeps the key when a page load restores the same account", () => {
    ls.set("active_user", "alice");
    ls.set("user_alice", "x");
    setSessionActiveKey(KEY, "alice");

    actionsFor(null).setActiveUser("alice");

    expect(getSessionActiveKey("alice")).toBe(KEY);
  });

  it("drops the key when switching to another account", () => {
    ls.set("active_user", "alice");
    ls.set("user_alice", "x");
    ls.set("user_bob", "x");
    setSessionActiveKey(KEY, "alice");

    actionsFor("alice").setActiveUser("bob");

    expect(window.sessionStorage.length).toBe(0);
  });

  it("drops the key on logout", () => {
    ls.set("active_user", "alice");
    ls.set("user_alice", "x");
    setSessionActiveKey(KEY, "alice");

    actionsFor("alice").setActiveUser(null);

    expect(window.sessionStorage.length).toBe(0);
  });
});
