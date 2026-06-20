import { describe, it, expect, vi } from "vitest";
import { estimateRcPrecheck } from "./estimate-rc-precheck";

// calculateRCMana folds in time-based mana regen; stub it so the pure
// pre-check math is tested deterministically.
vi.mock("@/modules/core/hive-tx", () => ({
  calculateRCMana: (acc: any) => ({
    current_mana: Number(acc.rc_manabar.current_mana),
    max_mana: Number(acc.max_rc),
    percentage: 0,
  }),
}));

const stats = (commentCost: number) =>
  ({ ops: { comment_operation: { avg_cost: commentCost, count: 1 } } }) as any;
const account = (mana: number) =>
  ({ rc_manabar: { current_mana: mana, last_update_time: 0 }, max_rc: mana * 2 }) as any;

describe("estimateRcPrecheck", () => {
  it("is not ready when inputs are missing", () => {
    const r = estimateRcPrecheck({
      rcAccount: undefined,
      rcStats: undefined,
      operation: "comment_operation",
    });
    expect(r.ready).toBe(false);
    expect(r.willLikelyFail).toBe(false);
  });

  it("flags willLikelyFail when mana is below the buffered cost", () => {
    const r = estimateRcPrecheck({
      rcAccount: account(100),
      rcStats: stats(100),
      operation: "comment_operation",
      buffer: 1.2,
    });
    expect(r.ready).toBe(true);
    expect(r.willLikelyFail).toBe(true); // 100 < 100 * 1.2
    expect(r.deficit).toBe(20);
    expect(r.remaining).toBe(1);
  });

  it("passes when mana exceeds the buffered cost", () => {
    const r = estimateRcPrecheck({
      rcAccount: account(1000),
      rcStats: stats(100),
      operation: "comment_operation",
    });
    expect(r.willLikelyFail).toBe(false);
    expect(r.deficit).toBe(0);
    expect(r.remaining).toBe(10);
  });

  it("does not flag failure when the average cost is unknown", () => {
    const r = estimateRcPrecheck({
      rcAccount: account(0),
      rcStats: stats(0),
      operation: "comment_operation",
    });
    expect(r.ready).toBe(true);
    expect(r.willLikelyFail).toBe(false);
  });
});
