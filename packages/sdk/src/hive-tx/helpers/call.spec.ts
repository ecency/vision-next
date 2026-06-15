import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callRPCBroadcast, callRPC, callREST, RPCError } from "./call";
import { config, setUserAgent } from "../config";

const ORIGINAL_NODES = [...config.nodes];
const ORIGINAL_TIMEOUT = config.broadcastTimeout;

beforeEach(() => {
  config.nodes = [
    "https://node-a.test",
    "https://node-b.test",
    "https://node-c.test",
  ];
  // Short timeout so the test is fast if something deadlocks.
  config.broadcastTimeout = 500;
});

afterEach(() => {
  config.nodes = ORIGINAL_NODES;
  config.broadcastTimeout = ORIGINAL_TIMEOUT;
  vi.restoreAllMocks();
});

function jsonOk(id: number, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonRpcError(id: number, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function readJsonRpcId(init?: RequestInit | any): number {
  if (!init?.body) return 0;
  try {
    const parsed = JSON.parse(String(init.body));
    return typeof parsed?.id === "number" ? parsed.id : 0;
  } catch {
    return 0;
  }
}

describe("callRPCBroadcast — browser-style failover", () => {
  function spyFetch(
    steps: Array<"network-error" | "html-530" | "html-502" | "rpc-error" | "ok">
  ) {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (_input: any, init: any) => {
      const id = readJsonRpcId(init);
      const step = steps.shift() ?? "ok";
      switch (step) {
        case "network-error":
          // Mimics browser fetch's TypeError when CORS blocks or DNS/TLS fails.
          throw new TypeError("Failed to fetch");
        case "html-530":
          return new Response("<html>cf 530 origin unreachable</html>", {
            status: 530,
            headers: { "Content-Type": "text/html" },
          });
        case "html-502":
          // CF tunnel error 1033 typically surfaces as a 502 or 530 with an
          // HTML interstitial body (no JSON-RPC envelope).
          return new Response("<html>error 1033 cloudflare tunnel</html>", {
            status: 502,
            headers: { "Content-Type": "text/html" },
          });
        case "rpc-error":
          return jsonRpcError(id, -32602, "Missing Posting Authority for alice");
        case "ok":
        default:
          return jsonOk(id, { id: "deadbeef", block_num: 1, trx_num: 0, expired: false });
      }
    });
  }

  it("fails over from a browser TypeError to the next node", async () => {
    const fetchSpy = spyFetch(["network-error", "ok"]);
    const res = await callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [{}]);
    expect((res as any).id).toBe("deadbeef");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("node-a.test");
    expect(String(fetchSpy.mock.calls[1]![0])).toContain("node-b.test");
  });

  it("fails over from a Cloudflare HTML 530 to the next node", async () => {
    const fetchSpy = spyFetch(["html-530", "ok"]);
    const res = await callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [{}]);
    expect((res as any).block_num).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("fails over from a Cloudflare HTML 502 (tunnel 1033) to the next node", async () => {
    const fetchSpy = spyFetch(["html-502", "ok"]);
    const res = await callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [{}]);
    expect((res as any).block_num).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does NOT fail over on a blockchain RPCError (real rejection)", async () => {
    const fetchSpy = spyFetch(["rpc-error", "ok"]);
    await expect(
      callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [{}])
    ).rejects.toBeInstanceOf(RPCError);
    // The second node must never see this tx.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("traverses all nodes once when every node fails with network errors", async () => {
    const fetchSpy = spyFetch(["network-error", "network-error", "network-error"]);
    await expect(
      callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [{}])
    ).rejects.toBeTruthy();
    // Tried each node exactly once — no wrap-around for broadcasts.
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  // Timeouts are the genuinely ambiguous case: the node may have received the
  // tx and started processing it. Failing over a timed-out broadcast risks a
  // second node accepting the dup and surfacing an RPCError that masks the
  // original success. So timeouts must NOT trigger failover — only RPCErrors
  // from the *next* attempt are ever the duplicate-rejection problem; if we
  // never make a next attempt, we can never produce that false negative.
  it("does NOT fail over on an AbortError/TimeoutError (broadcast may have been processed)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const err = new Error("The operation was aborted") as Error & { name: string };
      err.name = "AbortError";
      throw err;
    });
    await expect(
      callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [{}])
    ).rejects.toThrow(/aborted/i);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe("server-side User-Agent identity", () => {
  // Vitest runs the package specs under Node, so isNodeRuntime is true here and
  // the configured User-Agent must be attached to every outgoing request.
  const ORIGINAL_REST = [...config.restNodes];
  const ORIGINAL_UA = config.userAgent;

  afterEach(() => {
    config.restNodes = ORIGINAL_REST;
    config.userAgent = ORIGINAL_UA;
  });

  function headersOf(init: any): Record<string, string> {
    return (init?.headers ?? {}) as Record<string, string>;
  }

  it("attaches the configured User-Agent on JSON-RPC (callRPC) requests", async () => {
    config.userAgent = "ecency-sdk-test/1.2.3";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_input: any, init: any) =>
        jsonOk(readJsonRpcId(init), { ok: true })
      );
    await callRPC("condenser_api.get_dynamic_global_properties", []);
    const headers = headersOf(fetchSpy.mock.calls[0]![1]);
    expect(headers["User-Agent"]).toBe("ecency-sdk-test/1.2.3");
    // The JSON-RPC content type must survive the header merge.
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("attaches the configured User-Agent on REST (callREST) requests", async () => {
    config.restNodes = ["https://rest-a.test"];
    config.userAgent = "ecency-sdk-test/9.9.9";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    await callREST("status", "/status");
    expect(headersOf(fetchSpy.mock.calls[0]![1])["User-Agent"]).toBe("ecency-sdk-test/9.9.9");
  });

  it("setUserAgent trims input and ignores blank values", () => {
    setUserAgent("  custom-ua/1.0  ");
    expect(config.userAgent).toBe("custom-ua/1.0");
    setUserAgent("   ");
    expect(config.userAgent).toBe("custom-ua/1.0"); // unchanged by blank input
  });
});
