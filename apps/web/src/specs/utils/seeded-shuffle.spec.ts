import { describe, expect, it } from "vitest";
import { seededShuffle } from "@/utils/seeded-shuffle";

const items = ["hive", "photography", "life", "art", "gaming", "music", "travel"];

describe("seededShuffle", () => {
  it("returns the same order for the same seed, so a re-render never reshuffles", () => {
    expect(seededShuffle(items, 0.42)).toEqual(seededShuffle(items, 0.42));
  });

  it("is a permutation that leaves the input untouched", () => {
    const input = [...items];
    const out = seededShuffle(input, 0.42);
    expect(input).toEqual(items);
    expect([...out].sort()).toEqual([...items].sort());
    expect(out).not.toBe(input);
  });

  it("changes the order between seeds, so a new page load rotates the picks", () => {
    const orders = new Set(
      [0.1, 0.2, 0.3, 0.4, 0.5].map((seed) => seededShuffle(items, seed).join())
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("handles an empty and a one-item list", () => {
    expect(seededShuffle([], 0.5)).toEqual([]);
    expect(seededShuffle(["only"], 0.5)).toEqual(["only"]);
  });
});
