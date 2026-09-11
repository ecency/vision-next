import { beforeEach, describe, expect, it } from "vitest";
import { createWebBroadcastAdapter } from "@/providers/sdk/web-broadcast-adapter";
import { clearSessionActiveKey, setSessionActiveKey } from "@/utils/session-active-key";
import * as ls from "@/utils/local-storage";
import { encodeObj } from "@/utils/encoder";

const KEY = "5J" + "activekey".repeat(5) + "abcd";

/**
 * A user record written before `loginType` existed. `getLoginType` returning
 * null for it sends the SDK straight to the auth upgrade dialog for active ops:
 * `broadcastWithFallback` skips `getActiveKey` entirely on that path, so a held
 * key would be cleared by the dialog without ever being tried, on every tip.
 */
function legacyUserRecord(username: string) {
  ls.set(`user_${username}`, encodeObj({ username }));
}

describe("web adapter login type with a held active key", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSessionActiveKey();
    ls.set("active_user", "alice");
  });

  it("stays null for a legacy record while nothing is held", async () => {
    legacyUserRecord("alice");
    const adapter = createWebBroadcastAdapter();

    expect(await adapter.getLoginType!("alice", "active")).toBeNull();
  });

  it("reports 'key' for an active op once a key is held", async () => {
    legacyUserRecord("alice");
    setSessionActiveKey(KEY, "alice");
    const adapter = createWebBroadcastAdapter();

    expect(await adapter.getLoginType!("alice", "active")).toBe("key");
    expect(await adapter.getActiveKey!("alice")).toBe(KEY);
  });

  it("leaves posting ops alone, which have their own fallbacks", async () => {
    legacyUserRecord("alice");
    setSessionActiveKey(KEY, "alice");
    const adapter = createWebBroadcastAdapter();

    expect(await adapter.getLoginType!("alice", "posting")).toBeNull();
  });

  it("does not speak for another account's operation", async () => {
    legacyUserRecord("bob");
    setSessionActiveKey(KEY, "alice");
    const adapter = createWebBroadcastAdapter();

    expect(await adapter.getLoginType!("bob", "active")).toBeNull();
  });
});
