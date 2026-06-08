import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NodeHealthTracker, callRPC, callREST, callWithQuorum } from "./call";
import { config } from "../config";

// Implementation constants mirrored for readable assertions (kept in sync with call.ts).
const MIN_SAMPLES = 3;
const REPROBE_MS = 60_000;
const MAX_AGE_MS = 5 * 60_000;
const SLOW_FAILURE_MS = 2_000;

const HAPI = "https://hapi.ecency.com"; // our node (biased, no public rate limit)
const A = "https://api.hive.blog";
const B = "https://api.deathwing.me";
const C = "https://api.openhive.network";

// Deterministic clock: every Date.now() in the tracker + call sites reads this var.
let now: number;
const advance = (ms: number) => {
  now += ms;
};

beforeEach(() => {
  now = 1_700_000_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Profile a node with `n` successful samples of `ms`. n>=MIN_SAMPLES ⇒ proven.
 *  Any n>=1 also makes the node recently-sampled, so the orthogonal re-probe
 *  exploration won't perturb a steady-state ordering assertion. */
function warm(t: NodeHealthTracker, node: string, ms: number, n = MIN_SAMPLES) {
  for (let i = 0; i < n; i++) t.recordSuccess(node, undefined, ms);
}

describe("NodeHealthTracker — adaptive latency ordering", () => {
  it("cold start: no latency data ⇒ config order preserved (today's behavior)", () => {
    const t = new NodeHealthTracker();
    expect(t.getOrderedNodes([HAPI, A, B])).toEqual([HAPI, A, B]);
  });

  it("profiled nodes sort fastest-first", () => {
    const t = new NodeHealthTracker();
    warm(t, A, 850);
    warm(t, B, 300);
    warm(t, C, 1200);
    expect(t.getOrderedNodes([A, B, C])).toEqual([B, A, C]);
  });

  it("our-node bias: hapi a little slower than a peer keeps its slot", () => {
    const t = new NodeHealthTracker();
    warm(t, HAPI, 300);
    warm(t, A, 250); // faster, but within the bias envelope
    warm(t, B, 800);
    expect(t.getOrderedNodes([HAPI, A, B])[0]).toBe(HAPI);
  });

  it("our-node demote ceiling: hapi far slower than the fastest peer IS demoted", () => {
    const t = new NodeHealthTracker();
    warm(t, HAPI, 8000); // the US case
    warm(t, A, 850);
    warm(t, B, 900);
    const order = t.getOrderedNodes([HAPI, A, B]);
    expect(order[0]).toBe(A);
    expect(order[order.length - 1]).toBe(HAPI);
  });

  it("hapi slow is ranked behind even warming peers (absolute score)", () => {
    const t = new NodeHealthTracker();
    warm(t, HAPI, 8000); // only proven node, and it's slow
    warm(t, A, 100, 1); // warming (1 sample) ⇒ unproven prior, but recently sampled
    warm(t, B, 100, 1);
    const order = t.getOrderedNodes([HAPI, A, B]);
    expect(order[order.length - 1]).toBe(HAPI);
  });

  it("warming node does NOT jump a proven-fast our-node (no churn)", () => {
    const t = new NodeHealthTracker();
    warm(t, HAPI, 300); // proven fast
    warm(t, A, 100, 2); // 2 samples (< MIN_SAMPLES) ⇒ still warming
    warm(t, B, 100, 1);
    expect(t.getOrderedNodes([HAPI, A, B])[0]).toBe(HAPI);
  });

  it("an INSTANT failure is not mis-read as 'slow' (down node ≠ slow node)", () => {
    const t = new NodeHealthTracker();
    t.recordSlowFailure(A, 50); // below the slow floor ⇒ no latency sample
    expect((t as any).health.get(A)?.ewmaLatencyMs).toBeUndefined();
  });

  it("slow failures (timeouts/slow-5xx) demote a 200-but-too-slow node", () => {
    const t = new NodeHealthTracker();
    warm(t, A, 850);
    warm(t, B, 900);
    for (let i = 0; i < MIN_SAMPLES; i++) t.recordSlowFailure(HAPI, 5000);
    expect(t.getOrderedNodes([HAPI, A, B]).pop()).toBe(HAPI);
  });

  describe("recovery / re-probe (the starvation-trap fix)", () => {
    /** Set up: A,B fast+proven, HAPI demoted by timeouts, and HAPI made strictly the
     *  stalest (overdue for a re-probe) while A,B stay fresh. */
    function demotedHapiOverdue(t: NodeHealthTracker) {
      for (let i = 0; i < MIN_SAMPLES; i++) t.recordSlowFailure(HAPI, 5000); // HAPI @ t0
      advance(1);
      warm(t, A, 850); // A,B sampled @ t0+1 (fresher than HAPI)
      warm(t, B, 900);
      advance(REPROBE_MS); // HAPI now REPROBE+1 stale (strictly stalest)
    }

    it("a demoted node overdue for sampling is promoted to front for ONE pass", () => {
      const t = new NodeHealthTracker();
      demotedHapiOverdue(t);
      expect(t.getOrderedNodes([HAPI, A, B])[0]).toBe(HAPI);
    });

    it("single-flight: the immediate next pass does NOT re-promote the same node", () => {
      const t = new NodeHealthTracker();
      demotedHapiOverdue(t);
      expect(t.getOrderedNodes([HAPI, A, B])[0]).toBe(HAPI); // promotes hapi, stamps lastProbeAt
      const second = t.getOrderedNodes([HAPI, A, B]);
      expect(second[0]).toBe(A); // not re-promoted
      expect(second.pop()).toBe(HAPI); // still demoted by latency
    });

    it("a demoted node that recovers climbs back to the front", () => {
      const t = new NodeHealthTracker();
      demotedHapiOverdue(t);
      // re-probes over time now return fast (CF path recovered) ⇒ EWMA decays toward fast
      for (let i = 0; i < 8; i++) {
        advance(REPROBE_MS + 1);
        warm(t, A, 850, 1); // keep peers fresh + proven
        warm(t, B, 900, 1);
        t.recordSuccess(HAPI, undefined, 250); // the probe call comes back fast now
      }
      expect(t.getOrderedNodes([HAPI, A, B])[0]).toBe(HAPI);
    });
  });

  it("stale latency (> MAX_AGE) reverts a node to warming on next sample", () => {
    const t = new NodeHealthTracker();
    warm(t, A, 100);
    expect((t as any).health.get(A)?.latencySampleCount).toBe(MIN_SAMPLES);
    advance(MAX_AGE_MS + 1);
    t.recordSuccess(A, undefined, 100); // stale ⇒ profile reset, this is sample #1
    expect((t as any).health.get(A)?.latencySampleCount).toBe(1);
  });

  it("rate-limit: node drops to the tail, EWMA preserved, recovers after cooldown", () => {
    const t = new NodeHealthTracker();
    warm(t, HAPI, 300);
    warm(t, A, 800);
    t.recordRateLimit(HAPI, 10_000);
    const ordered = t.getOrderedNodes([HAPI, A]);
    expect(ordered[ordered.length - 1]).toBe(HAPI); // rate-limited ⇒ unhealthy tail
    expect((t as any).health.get(HAPI)?.ewmaLatencyMs).toBe(300); // EWMA untouched
    advance(10_001);
    expect(t.getOrderedNodes([HAPI, A])[0]).toBe(HAPI); // back on preserved fast EWMA
  });

  it("staleness (head-block lag) still wins over low latency", () => {
    const t = new NodeHealthTracker();
    warm(t, HAPI, 100); // fastest
    warm(t, A, 800);
    warm(t, B, 800, 1);
    t.recordHeadBlock(A, 1000);
    t.recordHeadBlock(B, 1000);
    t.recordHeadBlock(HAPI, 900); // 100 behind > STALE_BLOCK_THRESHOLD(30)
    expect(t.getOrderedNodes([HAPI, A, B]).pop()).toBe(HAPI);
  });

  it("capability: ranks only within the per-API node set handed to it", () => {
    const t = new NodeHealthTracker();
    warm(t, A, 900);
    warm(t, C, 300);
    const order = t.getOrderedNodes([A, C], "hivesense");
    expect(order).toEqual([C, A]);
    expect(order).not.toContain(B);
  });

  it("per-API failures deprioritize a node for THAT api only, not globally", () => {
    const t = new NodeHealthTracker();
    warm(t, A, 300); // fast for everything
    warm(t, B, 800);
    // A repeatedly fails the 'hivesense' plugin ⇒ per-API cooldown (not a global fail)
    t.recordFailure(A, "hivesense");
    t.recordFailure(A, "hivesense");
    // for hivesense: A is in cooldown ⇒ unhealthy tail, B serves despite being slower
    const hs = t.getOrderedNodes([A, B], "hivesense");
    expect(hs[0]).toBe(B);
    expect(hs[hs.length - 1]).toBe(A);
    // for a different api: A is still healthy and ranks first on its fast latency
    expect(t.getOrderedNodes([A, B], "condenser_api")[0]).toBe(A);
  });
});

// ── Real-path integration: prove the CALL SITES feed latency (end-to-end) ────
describe("call sites feed the tracker — adaptive behavior end to end", () => {
  const ORIG_NODES = [...config.nodes];
  const ORIG_REST = [...config.restNodes];
  const ORIG_RETRY = config.retry;

  afterEach(() => {
    config.nodes = [...ORIG_NODES];
    config.restNodes = [...ORIG_REST];
    config.retry = ORIG_RETRY;
  });

  function jsonOk(init: any, result: unknown): Response {
    const id = init?.body ? JSON.parse(String(init.body)).id : 0;
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("callRPC: a slow node gets demoted so later calls prefer the fast node", async () => {
    const SLOW = "https://rpc-slow.test"; // config-first, but slow
    const FAST = "https://rpc-fast.test";
    config.nodes = [SLOW, FAST];
    config.retry = 3;
    const hits: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (u: any, init: any) => {
      const url = String(u);
      hits.push(url.includes("slow") ? "slow" : "fast");
      advance(url.includes("slow") ? 4000 : 80); // slow node: 4s round-trip
      return jsonOk(init, { ok: true });
    });
    // drive enough calls for the ranker to profile both and flip preference
    for (let i = 0; i < 10; i++) {
      await callRPC("condenser_api.get_dynamic_global_properties", []);
    }
    const firstHalf = hits.slice(0, 5).filter((h) => h === "fast").length;
    const lastHalf = hits.slice(-5).filter((h) => h === "fast").length;
    // both nodes were exercised (fast got sampled via exploration/failover)…
    expect(hits).toContain("fast");
    // …and by the end the fast node is preferred over the slow config-first node.
    expect(lastHalf).toBeGreaterThan(firstHalf);
  });

  it("callREST: a slow-failing node is demoted (the M1b REST penalty path runs)", async () => {
    const SLOWFAIL = "https://rest-slowfail.test"; // config-first, slow 5xx
    const OK = "https://rest-ok.test";
    config.restNodes = [SLOWFAIL, OK];
    config.retry = 3;
    const hits: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (u: any) => {
      const url = String(u);
      hits.push(url.includes("slowfail") ? "slowfail" : "ok");
      if (url.includes("slowfail")) {
        advance(SLOW_FAILURE_MS + 500); // slow before the 5xx (CF interstitial style)
        return new Response("<html>530</html>", { status: 530 });
      }
      advance(120);
      return new Response(JSON.stringify({ balance: "1.000 HIVE" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    let res: any;
    for (let i = 0; i < 8; i++) {
      res = await callREST("balance", "/accounts/{a}/balances", { a: "alice" });
    }
    expect(res).toEqual({ balance: "1.000 HIVE" }); // always served (failover)
    const firstHalf = hits.slice(0, 6).filter((h) => h === "ok").length;
    const lastHalf = hits.slice(-6).filter((h) => h === "ok").length;
    expect(lastHalf).toBeGreaterThan(firstHalf); // ok node preferred once slowfail demoted
  });

  it("callWithQuorum still reaches consensus (jsonRPCCall return shape intact)", async () => {
    config.nodes = ["https://q-a.test", "https://q-b.test", "https://q-c.test"];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_u: any, init: any) =>
      jsonOk(init, { head_block_number: 42 })
    );
    const result = await callWithQuorum<{ head_block_number: number }>(
      "condenser_api.get_dynamic_global_properties",
      [],
      2
    );
    // would be {result,durationMs} (and quorum could never match) if we'd changed
    // jsonRPCCall's return shape; consensus proves it's still the raw result.
    expect(result).toEqual({ head_block_number: 42 });
  });
});
