import { describe, it, expect } from "vitest";
import { buildRcDelegationOp } from "./ecency";

describe("buildRcDelegationOp", () => {
  it("builds an active-auth custom_json with the ecency_rc_delegation id", () => {
    const op = buildRcDelegationOp("alice", 3);
    expect(op[0]).toBe("custom_json");
    const payload = op[1] as {
      id: string;
      json: string;
      required_auths: string[];
      required_posting_auths: string[];
    };
    expect(payload.id).toBe("ecency_rc_delegation");
    expect(payload.required_auths).toEqual(["alice"]);
    expect(payload.required_posting_auths).toEqual([]);
    expect(JSON.parse(payload.json)).toEqual({ user: "alice", duration: 3 });
  });

  it("throws when user is missing", () => {
    expect(() => buildRcDelegationOp("", 3)).toThrow();
  });

  it("throws when duration is not finite", () => {
    expect(() => buildRcDelegationOp("alice", Number.NaN)).toThrow();
    expect(() => buildRcDelegationOp("alice", Infinity)).toThrow();
  });
});
