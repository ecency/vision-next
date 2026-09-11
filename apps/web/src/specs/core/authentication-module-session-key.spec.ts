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
 * persisted username on every page load goes through `setActiveUser` too.
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

  it("clears on every active-user change, restore included", () => {
    ls.set("active_user", "alice");
    ls.set("user_alice", "x");
    setSessionActiveKey(KEY, "alice");

    // A page load restores the persisted username through here with an empty
    // store. A key held in module memory cannot predate the document, so there
    // is nothing to protect and the clear stays unconditional.
    actionsFor(null).setActiveUser("alice");

    expect(getSessionActiveKey("alice")).toBeNull();
  });

  it("drops the key when switching to another account", () => {
    ls.set("active_user", "alice");
    ls.set("user_alice", "x");
    ls.set("user_bob", "x");
    setSessionActiveKey(KEY, "alice");

    actionsFor("alice").setActiveUser("bob");

    expect(getSessionActiveKey("alice")).toBeNull();
  });

  it("drops the key on logout", () => {
    ls.set("active_user", "alice");
    ls.set("user_alice", "x");
    setSessionActiveKey(KEY, "alice");

    actionsFor("alice").setActiveUser(null);

    expect(getSessionActiveKey("alice")).toBeNull();
  });
});
