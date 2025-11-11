import { getBalance } from "./get-balance";
import { HiveMarketAsset } from "../market-pair";

describe("GetBalance", function () {
  it("should get hive", function () {
    expect(getBalance(HiveMarketAsset.HIVE, { data: { balance: 1 } } as any)).toBe(1);
  });

  it("should get hbd", function () {
    expect(getBalance(HiveMarketAsset.HBD, { data: { hbd_balance: 2 } } as any)).toBe(2);
  });
});
