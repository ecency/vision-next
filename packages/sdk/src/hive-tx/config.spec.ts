import { describe, it, expect } from "vitest";
import { config } from "./config";

// Regression guard for the per-API REST node override. `callREST` resolves
// `config.restNodesByApi?.[api]?.length ? config.restNodesByApi[api]! :
// config.restNodes`, so these invariants are what keep hivesense pinned to
// the only hosts that actually serve /hivesense-api and every other API on
// the generic list.
describe("config.restNodesByApi", () => {
  it("pins hivesense to the capable public nodes", () => {
    expect(config.restNodesByApi.hivesense).toEqual([
      "https://api.hive.blog",
      "https://api.syncad.com",
    ]);
  });

  it("does not override generic REST APIs (they fall back to restNodes)", () => {
    expect(config.restNodesByApi.hafah).toBeUndefined();
    expect(config.restNodesByApi.hivemind).toBeUndefined();
    expect(Array.isArray(config.restNodes)).toBe(true);
    expect(config.restNodes.length).toBeGreaterThan(0);
  });

  it("the hivesense pin is non-empty so the override actually engages", () => {
    // call.ts uses `?.length` as the engage condition — an empty array would
    // silently fall back to the generic (incapable-for-hivesense) list.
    expect(config.restNodesByApi.hivesense!.length).toBeGreaterThan(0);
  });
});
