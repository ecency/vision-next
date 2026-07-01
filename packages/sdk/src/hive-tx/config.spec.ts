import { describe, it, expect, afterEach } from "vitest";
import { config, setRestNodes, setRestNodesByApi } from "./config";

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

// The runtime setters make restNodes / restNodesByApi app-configurable (previously
// baked into the SDK). This is what lets an app drop an own REST node it is
// decommissioning, or pin an API to capable hosts, without a fork + republish.
describe("setRestNodes / setRestNodesByApi", () => {
  const ORIGINAL_REST = [...config.restNodes];
  const ORIGINAL_BY_API = { ...config.restNodesByApi };

  afterEach(() => {
    config.restNodes = [...ORIGINAL_REST];
    config.restNodesByApi = { ...ORIGINAL_BY_API };
  });

  it("replaces restNodes with a trimmed, de-duped, http(s)-only list", () => {
    setRestNodes([
      "  https://a.test  ",
      "https://a.test", // dup
      "not-a-url",
      "ftp://b.test", // wrong scheme
      "https://b.test",
    ]);
    expect(config.restNodes).toEqual(["https://a.test", "https://b.test"]);
  });

  it("is a no-op when nothing valid remains (never empties the list)", () => {
    setRestNodes(["", "   ", "garbage"]);
    expect(config.restNodes).toEqual([...ORIGINAL_REST]);
  });

  it("strips trailing slashes so callREST does not build host//path (404 on some nodes)", () => {
    setRestNodes(["https://a.test/", "https://b.test//"]);
    expect(config.restNodes).toEqual(["https://a.test", "https://b.test"]);
  });

  it("collapses trailing-slash and bare forms of the same host to one entry", () => {
    setRestNodes(["https://a.test/", "https://a.test"]);
    expect(config.restNodes).toEqual(["https://a.test"]);
  });

  it("normalizes trailing slashes in per-API pins too", () => {
    setRestNodesByApi({ balance: ["https://api.hive.blog/"] });
    expect(config.restNodesByApi.balance).toEqual(["https://api.hive.blog"]);
  });

  it("pins an API to capable hosts while preserving other pins (e.g. hivesense)", () => {
    setRestNodesByApi({ balance: ["https://api.hive.blog", "https://api.hive.blog", "x"] });
    expect(config.restNodesByApi.balance).toEqual(["https://api.hive.blog"]);
    // The built-in hivesense pin is untouched by a partial update.
    expect(config.restNodesByApi.hivesense).toEqual([
      "https://api.hive.blog",
      "https://api.syncad.com",
    ]);
  });

  it("removes a pin when given an empty/all-invalid list (falls back to restNodes)", () => {
    setRestNodesByApi({ hivesense: [] });
    expect(config.restNodesByApi.hivesense).toBeUndefined();
  });
});
