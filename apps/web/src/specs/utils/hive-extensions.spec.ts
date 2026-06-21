import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  broadcastWithExtension,
  getDetectedExtensions,
  signBufferWithExtension
} from "../../utils/hive-extensions";

/**
 * Regression coverage for the Keychain liveness ping added to signBufferViaKeychain.
 * A Manifest V3 service worker that has gone idle/crashed never calls the sign
 * callback back; the ping must surface a fast, actionable error instead of the
 * old 60s opaque spinner, and must wake the worker (handshake) before signing.
 */
describe("signBufferWithExtension (Keychain liveness ping)", () => {
  beforeEach(() => {
    const w = window as any;
    delete w.hive_keychain;
    delete w.hive;
    delete w.hive_extension;
    delete w.peakvault;
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    const w = window as any;
    delete w.hive_keychain;
  });

  it("handshakes to wake the worker before requesting a signature", async () => {
    const order: string[] = [];
    (window as any).hive_keychain = {
      requestHandshake: (cb: () => void) => {
        order.push("handshake");
        cb();
      },
      requestSignBuffer: (_a: string, _m: string, _t: string, cb: (r: any) => void) => {
        order.push("sign");
        cb({ success: true, result: "signature" });
      }
    };

    const resp = await signBufferWithExtension("alice", "message", "Posting");

    expect(order).toEqual(["handshake", "sign"]);
    expect(resp).toMatchObject({ success: true, result: "signature" });
  });

  it("rejects fast with an actionable message when the worker never responds", async () => {
    vi.useFakeTimers();
    const requestSignBuffer = vi.fn();
    (window as any).hive_keychain = {
      // Dead/asleep worker: the handshake callback is never invoked.
      requestHandshake: vi.fn(),
      requestSignBuffer
    };

    const promise = signBufferWithExtension("alice", "message", "Posting");
    const assertion = expect(promise).rejects.toThrow(/not responding/i);

    await vi.advanceTimersByTimeAsync(6000);
    await assertion;

    // Crucially, we never reach the 60s sign request on a dead worker.
    expect(requestSignBuffer).not.toHaveBeenCalled();
  });

  it("surfaces a user cancellation from the sign request", async () => {
    (window as any).hive_keychain = {
      requestHandshake: (cb: () => void) => cb(),
      requestSignBuffer: (_a: string, _m: string, _t: string, cb: (r: any) => void) =>
        cb({ success: false, error: "user_cancel" })
    };

    await expect(signBufferWithExtension("alice", "message", "Posting")).rejects.toThrow();
  });
});

/**
 * The same liveness ping guards broadcastViaKeychain, so votes/posts/transfers do
 * not hang for 60s on an idle/crashed worker either.
 */
describe("broadcastWithExtension (Keychain liveness ping)", () => {
  beforeEach(() => {
    const w = window as any;
    delete w.hive_keychain;
    delete w.hive;
    delete w.hive_extension;
    delete w.peakvault;
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).hive_keychain;
  });

  it("handshakes before broadcasting", async () => {
    const order: string[] = [];
    (window as any).hive_keychain = {
      requestHandshake: (cb: () => void) => {
        order.push("handshake");
        cb();
      },
      requestBroadcast: (_a: string, _o: any[], _t: string, cb: (r: any) => void) => {
        order.push("broadcast");
        cb({ success: true, result: { id: "tx" } });
      }
    };

    await broadcastWithExtension("alice", [["vote", {}]], "posting");
    expect(order).toEqual(["handshake", "broadcast"]);
  });

  it("rejects fast when the worker never responds, without reaching broadcast", async () => {
    vi.useFakeTimers();
    const requestBroadcast = vi.fn();
    (window as any).hive_keychain = {
      requestHandshake: vi.fn(),
      requestBroadcast
    };

    const promise = broadcastWithExtension("alice", [["vote", {}]], "posting");
    const assertion = expect(promise).rejects.toThrow(/not responding/i);

    await vi.advanceTimersByTimeAsync(6000);
    await assertion;

    expect(requestBroadcast).not.toHaveBeenCalled();
  });
});

/**
 * Keeper owns window.hive and is the only extension that has adopted the unified
 * protocol. We must sign through that live window.hive object (flagged
 * isKeeper) rather than the providers registry entry: routing Keeper signing
 * through the registry handed back a non-live instance whose callback never
 * fired, so login spun for 60s and never opened the extension. window.hive_extension
 * is a content-script-world marker that never reaches the page, so it cannot be
 * used to detect or resolve Keeper.
 */
describe("Hive Keeper resolution (window.hive primary)", () => {
  beforeEach(() => {
    const w = window as any;
    delete w.hive_keychain;
    delete w.hive;
    delete w.hive_extension;
    delete w.peakvault;
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    const w = window as any;
    delete w.hive_keychain;
    delete w.hive;
    delete w.peakvault;
  });

  it("signs through the live window.hive, not a stale providers-registry entry", async () => {
    const order: string[] = [];
    const requestSignBuffer = vi.fn(
      (_a: string, _m: string, _t: string, cb: (r: any) => void) => {
        order.push("sign");
        cb({ success: true, result: "signature" });
      }
    );
    const liveKeeper: any = {
      isKeeper: true,
      requestHandshake: (cb: () => void) => {
        order.push("handshake");
        cb();
      },
      requestSignBuffer
    };
    // A stale/non-live provider object that never calls its callback back -
    // resolving Keeper through this is exactly what caused the 60s hang.
    const staleProvider = { requestHandshake: (cb: () => void) => cb(), requestSignBuffer: vi.fn() };
    liveKeeper.providers = [
      { name: "Hive Keeper", rdns: "com.ecency.keeper", provider: staleProvider }
    ];
    (window as any).hive = liveKeeper;

    const resp = await signBufferWithExtension("alice", "message", "Posting", null, "hive-keeper");

    expect(order).toEqual(["handshake", "sign"]);
    expect(resp).toMatchObject({ success: true, result: "signature" });
    expect(requestSignBuffer).toHaveBeenCalledTimes(1);
    expect(staleProvider.requestSignBuffer).not.toHaveBeenCalled();
  });

  it("detects Keeper via window.hive.isKeeper (not window.hive_extension)", () => {
    (window as any).hive = { isKeeper: true, requestHandshake: vi.fn(), requestSignBuffer: vi.fn() };

    const ids = getDetectedExtensions().map((e) => e.id);
    expect(ids).toContain("hive-keeper");
  });

  it("does not surface Keeper's window.hive_keychain self-alias as a phantom Keychain", () => {
    // Keeper-only browser: it aliases itself onto window.hive_keychain for
    // backward compat, but that is the same isKeeper object - not a real Keychain.
    const keeper: any = { isKeeper: true, requestHandshake: vi.fn(), requestSignBuffer: vi.fn() };
    (window as any).hive = keeper;
    (window as any).hive_keychain = keeper;

    const ids = getDetectedExtensions().map((e) => e.id);
    expect(ids).toContain("hive-keeper");
    expect(ids).not.toContain("keychain");
  });

  it("still detects a genuine Keychain (no isKeeper flag) alongside Keeper", () => {
    (window as any).hive = { isKeeper: true, requestHandshake: vi.fn(), requestSignBuffer: vi.fn() };
    (window as any).hive_keychain = { requestHandshake: vi.fn(), requestSignBuffer: vi.fn() };

    const ids = getDetectedExtensions().map((e) => e.id);
    expect(ids).toContain("hive-keeper");
    expect(ids).toContain("keychain");
  });

  it("clears a stale 'keychain' preference in a Keeper-only browser and signs via window.hive", async () => {
    const order: string[] = [];
    const keeper: any = {
      isKeeper: true,
      requestHandshake: (cb: () => void) => {
        order.push("handshake");
        cb();
      },
      requestSignBuffer: (_a: string, _m: string, _t: string, cb: (r: any) => void) => {
        order.push("sign");
        cb({ success: true, result: "signature" });
      }
    };
    (window as any).hive = keeper;
    // Keeper's backward-compat self-alias - NOT a real Keychain.
    (window as any).hive_keychain = keeper;
    // Stale preference from before the user switched to a Keeper-only setup.
    localStorage.setItem("ecency_preferred_hive_extension", "keychain");

    const resp = await signBufferWithExtension("alice", "message", "Posting");

    // Signed through the live window.hive path (handshake then sign)...
    expect(order).toEqual(["handshake", "sign"]);
    expect(resp).toMatchObject({ success: true, result: "signature" });
    // ...and the stale "keychain" preference self-healed because the alias no
    // longer resolves to a usable Keychain instance.
    expect(localStorage.getItem("ecency_preferred_hive_extension")).toBeNull();
  });
});
