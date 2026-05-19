// Test-only: guarantee a global WebCrypto with getRandomValues.
//
// The @noble crypto libs (PrivateKey/PublicKey) throw
// "crypto.getRandomValues must be defined" when no global `crypto` is
// present. CI (Node 20) exposes it natively under vitest's `node`
// environment; Node 18 + vitest does not, so the crypto specs fail there.
// Defensive: only act when it's actually missing/incomplete, and use
// defineProperty so a getter-only `globalThis.crypto` can still be set.
// Not part of the published package (config/setup are excluded from dist).
import { webcrypto } from "node:crypto";

const g = globalThis as unknown as { crypto?: Crypto };
if (typeof g.crypto?.getRandomValues !== "function") {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
    writable: true
  });
}
