import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTempActiveKey,
  getTempActiveKey,
  requestAuthUpgrade,
  resolveAuthUpgrade
} from "@/features/shared/auth-upgrade/auth-upgrade-events";
import * as ls from "@/utils/local-storage";

// Shaped like WIFs (base58, 51 chars) so the store's format guard accepts them.
const ACTIVE_KEY = "5J" + "activekey".repeat(5) + "abcd";
const POSTING_KEY = "5J" + "postingke".repeat(5) + "abcd";

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

describe("auth upgrade key ownership", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearTempActiveKey();
    ls.set("active_user", "alice");
  });

  it("stores the key under the account the dialog opened for", async () => {
    const pending = requestAuthUpgrade("active", "transfer");

    // The dialog outlives an account switch made elsewhere in the app.
    ls.set("active_user", "bob");
    resolveAuthUpgrade("key", ACTIVE_KEY);
    await pending;

    // The record names alice, who the dialog was raised for, not bob, who was
    // active when the key was submitted.
    const raw = window.sessionStorage.getItem("ecency_active-key-session");
    expect(JSON.parse(atob(raw!)).username).toBe("alice");

    // bob still cannot sign with it: a read while he is the active user finds
    // the mismatch and drops the record.
    expect(getTempActiveKey("bob")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });
});
