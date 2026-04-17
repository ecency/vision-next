import { describe, it, expect, vi } from "vitest";

vi.mock("@ecency/sdk", () => {
  let callCount = 0;
  return {
    PrivateKey: {
      fromSeed: vi.fn(() => {
        callCount++;
        return { toString: () => `5JfakeKey${callCount}` };
      })
    }
  };
});

import { generateMasterPassword } from "@/utils/master-password";

describe("generateMasterPassword", () => {
  it("should return a string starting with P5", () => {
    const password = generateMasterPassword();
    expect(password.startsWith("P5")).toBe(true);
  });

  it("should generate different passwords on each call", () => {
    const pw1 = generateMasterPassword();
    const pw2 = generateMasterPassword();
    expect(pw1).not.toBe(pw2);
  });

  it("should have reasonable length", () => {
    const password = generateMasterPassword();
    // P + WIF key is typically 52 chars total
    expect(password.length).toBeGreaterThan(10);
  });
});
