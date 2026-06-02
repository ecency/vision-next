import { getBalance } from "@/features/market/market-swap-form/api/get-balance";
import { HiveMarketAsset } from "@/features/market/market-swap-form/market-pair";

describe("GetBalance", function () {
  it("should get hive", function () {
    expect(getBalance(HiveMarketAsset.HIVE, { balance: 1 } as any)).toBe(1);
  });

  it("should get hbd", function () {
    expect(getBalance(HiveMarketAsset.HBD, { hbd_balance: 2 } as any)).toBe(2);
  });
});
