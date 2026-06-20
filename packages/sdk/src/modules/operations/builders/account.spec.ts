import { describe, it, expect } from "vitest";
import {
  buildGrantPostingPermissionOp,
  buildRevokePostingPermissionOp,
} from "./account";
import type { Authority } from "../../../hive-tx";

const posting: Authority = {
  weight_threshold: 1,
  account_auths: [["alice", 1]],
  key_auths: [["STM8posting", 1]],
};

const MEMO = "STM8memo";

describe("grant/revoke posting permission builders", () => {
  describe("buildGrantPostingPermissionOp", () => {
    it("emits account_update2 with empty metadata (never touches profile data)", () => {
      const [name, op] = buildGrantPostingPermissionOp(
        "bob",
        posting,
        "ecency.app",
        1,
        MEMO,
        // a value passed here MUST be ignored, not written into the op
        JSON.stringify({ profile: { name: "bob" } })
      ) as [string, any];

      expect(name).toBe("account_update2");
      expect(op.account).toBe("bob");
      expect(op.json_metadata).toBe("");
      expect(op.posting_json_metadata).toBe("");
      // posting authority updated to include the granted account
      expect(op.posting.account_auths).toEqual(
        expect.arrayContaining([["ecency.app", 1]])
      );
    });

    it("updates the weight of an already-granted account without duplicating", () => {
      const current: Authority = {
        ...posting,
        account_auths: [["ecency.app", 1]],
      };
      const [, op] = buildGrantPostingPermissionOp(
        "bob",
        current,
        "ecency.app",
        3,
        MEMO
      ) as [string, any];

      expect(op.posting.account_auths).toEqual([["ecency.app", 3]]);
    });

    it("throws on missing required parameters", () => {
      expect(() =>
        buildGrantPostingPermissionOp("", posting, "ecency.app", 1, MEMO)
      ).toThrow();
    });
  });

  describe("buildRevokePostingPermissionOp", () => {
    it("emits account_update2 with empty metadata and removes the account", () => {
      const current: Authority = {
        ...posting,
        account_auths: [
          ["alice", 1],
          ["ecency.app", 1],
        ],
      };
      const [name, op] = buildRevokePostingPermissionOp(
        "bob",
        current,
        "ecency.app",
        MEMO,
        JSON.stringify({ profile: { name: "bob" } })
      ) as [string, any];

      expect(name).toBe("account_update2");
      expect(op.json_metadata).toBe("");
      expect(op.posting_json_metadata).toBe("");
      expect(op.posting.account_auths).toEqual([["alice", 1]]);
    });

    it("throws on missing required parameters", () => {
      expect(() =>
        buildRevokePostingPermissionOp("bob", posting, "", MEMO)
      ).toThrow();
    });
  });
});
