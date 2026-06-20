import { describe, it, expect } from "vitest";
import { Transaction } from "./Transaction";

// Minimal serializable transaction, as produced externally (e.g. by hive-uri's
// resolveTransaction) WITHOUT a `signatures` field.
const baseTx = {
  ref_block_num: 1234,
  ref_block_prefix: 5678901,
  expiration: "2026-06-20T17:00:00",
  operations: [
    ["vote", { voter: "alice", author: "bob", permlink: "a-post", weight: 10000 }],
  ],
  extensions: [],
} as any;

describe("Transaction constructor – signatures normalization", () => {
  it("adds an empty signatures array when the source tx omits it (hive-uri sign regression)", () => {
    const tx = { ...baseTx }; // no `signatures`
    const t = new Transaction({ transaction: tx });
    expect(Array.isArray(t.transaction?.signatures)).toBe(true);
    expect(t.transaction?.signatures).toEqual([]);
  });

  it("preserves an existing signatures array", () => {
    const tx = { ...baseTx, signatures: ["deadbeef"] };
    const t = new Transaction({ transaction: tx });
    expect(t.transaction?.signatures).toEqual(["deadbeef"]);
  });

  it("replaces a non-array signatures value", () => {
    const tx = { ...baseTx, signatures: null };
    const t = new Transaction({ transaction: tx });
    expect(t.transaction?.signatures).toEqual([]);
  });
});
