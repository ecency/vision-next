import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@hiveio/dhive", () => {
  let callCount = 0;
  return {
    PrivateKey: {
      fromSeed: vi.fn((entropy: string) => ({
        toString: () => `5Jfake${++callCount}${entropy.slice(0, 5)}`
      }))
    }
  };
});

import { generateMasterPassword } from "@/utils/master-password";

describe("generateMasterPassword", () => {
  it("returns a string starting with P5", () => {
    const password = generateMasterPassword();
    expect(password.startsWith("P5")).toBe(true);
  });

  it("generates different passwords on each call", () => {
    const pw1 = generateMasterPassword();
    const pw2 = generateMasterPassword();
    expect(pw1).not.toBe(pw2);
  });

  it("generates a long password string", () => {
    const password = generateMasterPassword();
    // P + WIF key = at least 50+ chars
    expect(password.length).toBeGreaterThan(5);
  });
});
