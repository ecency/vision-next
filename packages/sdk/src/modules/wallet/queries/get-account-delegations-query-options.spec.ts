import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccountDelegationsQueryOptions } from "./get-account-delegations-query-options";

const mockCallREST = vi.hoisted(() => vi.fn());

vi.mock("@/modules/core/hive-tx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/core/hive-tx")>();
  return {
    ...actual,
    callREST: mockCallREST,
  };
});

describe("getAccountDelegationsQueryOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a balance-api-scoped query key", () => {
    const options = getAccountDelegationsQueryOptions("alice");
    expect(options.queryKey).toEqual(["assets", "account-delegations", "alice"]);
  });

  it("is disabled when no username is provided", () => {
    expect(getAccountDelegationsQueryOptions(undefined).enabled).toBe(false);
    expect(getAccountDelegationsQueryOptions("alice").enabled).toBe(true);
  });

  it("calls the balance-api delegations endpoint with the account path param", async () => {
    const payload = {
      outgoing_delegations: [
        { delegatee: "ecency", amount: "350000000000", operation_id: "1", block_num: 2 },
      ],
      incoming_delegations: [],
    };
    mockCallREST.mockResolvedValueOnce(payload);

    const options = getAccountDelegationsQueryOptions("alice");
    const queryFn = options.queryFn as (ctx: {
      signal?: AbortSignal;
    }) => Promise<unknown>;
    const result = await queryFn({ signal: undefined });

    expect(mockCallREST).toHaveBeenCalledWith(
      "balance",
      "/accounts/{account-name}/delegations",
      { "account-name": "alice" },
      undefined,
      undefined,
      undefined
    );
    expect(result).toBe(payload);
  });
});
