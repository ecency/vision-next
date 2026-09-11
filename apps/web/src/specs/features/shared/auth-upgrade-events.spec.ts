import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTempActiveKey,
  getTempActiveKey,
  requestAuthUpgrade,
  resolveAuthUpgrade
} from "@/features/shared/auth-upgrade/auth-upgrade-events";
import * as ls from "@/utils/local-storage";

const ACTIVE_KEY = "5JActiveKeyForAlice";
const POSTING_KEY = "5JPostingKeyForAlice";

describe("auth upgrade key retention", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearTempActiveKey();
    ls.set("active_user", "alice");
  });

  it("keeps an active key past the flow that collected it", async () => {
    const pending = requestAuthUpgrade("active", "custom_json");
    resolveAuthUpgrade("key", ACTIVE_KEY);
    await expect(pending).resolves.toBe("key");

    // The next tip reads the key straight out of the store, so no second dialog.
    expect(getTempActiveKey("alice")).toBe(ACTIVE_KEY);
    expect(getTempActiveKey("alice")).toBe(ACTIVE_KEY);
  });

  it("does not store a posting key as the active key", async () => {
    const pending = requestAuthUpgrade("posting", "comment");
    resolveAuthUpgrade("key", POSTING_KEY);
    await pending;

    expect(getTempActiveKey("alice")).toBeNull();
  });

  it("leaves the active key alone when a posting upgrade comes along", async () => {
    resolveAuthUpgrade("key", ACTIVE_KEY);
    const seeded = requestAuthUpgrade("active", "transfer");
    resolveAuthUpgrade("key", ACTIVE_KEY);
    await seeded;

    const posting = requestAuthUpgrade("posting", "comment");
    expect(getTempActiveKey("alice")).toBe(ACTIVE_KEY);
    resolveAuthUpgrade(false);
    await posting;
  });

  it("drops the stored key when an active dialog opens, it just failed to sign", async () => {
    const seeded = requestAuthUpgrade("active", "transfer");
    resolveAuthUpgrade("key", ACTIVE_KEY);
    await seeded;

    const retry = requestAuthUpgrade("active", "transfer");
    expect(getTempActiveKey("alice")).toBeNull();
    resolveAuthUpgrade(false);
    await retry;
  });

  it("does not store anything when the user picks an extension", async () => {
    const pending = requestAuthUpgrade("active", "transfer");
    resolveAuthUpgrade("keychain");
    await pending;

    expect(getTempActiveKey("alice")).toBeNull();
  });
});
