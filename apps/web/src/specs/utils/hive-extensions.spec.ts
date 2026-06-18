import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { broadcastWithExtension, signBufferWithExtension } from "../../utils/hive-extensions";

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
