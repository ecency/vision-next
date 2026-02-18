import { buildHiveSwapPayload, getMarketSwappingMethods, SwappingMethod } from "./swapping";
import { HiveMarketAsset } from "../market-pair";

describe("Swapping", function () {
  describe("buildHiveSwapPayload", function () {
    it("should build payload for selling HIVE (HIVE -> HBD)", function () {
      const payload = buildHiveSwapPayload({
        fromAmount: "1,111",
        toAmount: "2,111",
        fromAsset: HiveMarketAsset.HIVE,
        toAsset: HiveMarketAsset.HBD
      });

      expect(payload).not.toBeNull();
      expect(payload!.amountToSell).toBe("1111.000 HIVE");
      expect(payload!.minToReceive).toBe("2111.000 HBD");
      expect(payload!.fillOrKill).toBe(false);
      expect(payload!.expiration).toBeDefined();
      expect(payload!.orderId).toBeDefined();
      // Order ID should start with "9" (SWAP prefix)
      expect(payload!.orderId.toString()).toMatch(/^9/);
    });

    it("should build payload for selling HBD (HBD -> HIVE)", function () {
      const payload = buildHiveSwapPayload({
        fromAmount: "1,111",
        toAmount: "2,111",
        fromAsset: HiveMarketAsset.HBD,
        toAsset: HiveMarketAsset.HIVE
      });

      expect(payload).not.toBeNull();
      expect(payload!.amountToSell).toBe("1111.000 HBD");
      expect(payload!.minToReceive).toBe("2111.000 HIVE");
      expect(payload!.fillOrKill).toBe(false);
      expect(payload!.expiration).toBeDefined();
      expect(payload!.orderId).toBeDefined();
      expect(payload!.orderId.toString()).toMatch(/^9/);
    });

    it("should set expiration 27 days from now", function () {
      const before = new Date();
      before.setDate(before.getDate() + 27);

      const payload = buildHiveSwapPayload({
        fromAmount: "100",
        toAmount: "50",
        fromAsset: HiveMarketAsset.HIVE,
        toAsset: HiveMarketAsset.HBD
      });

      const after = new Date();
      after.setDate(after.getDate() + 27);

      const expirationDate = new Date(payload!.expiration);
      expect(expirationDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(expirationDate.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it("should return null for unsupported asset", function () {
      const payload = buildHiveSwapPayload({
        fromAmount: "100",
        toAmount: "50",
        fromAsset: "UNKNOWN" as any,
        toAsset: HiveMarketAsset.HBD
      });

      expect(payload).toBeNull();
    });
  });

  describe("getMarketSwappingMethods", function () {
    it("should return HIVE method for HIVE/HBD pairs", function () {
      const methods = getMarketSwappingMethods(HiveMarketAsset.HIVE, HiveMarketAsset.HBD);
      expect(methods).toEqual([SwappingMethod.HIVE]);
    });

    it("should return HIVE method for HBD/HIVE pairs", function () {
      const methods = getMarketSwappingMethods(HiveMarketAsset.HBD, HiveMarketAsset.HIVE);
      expect(methods).toEqual([SwappingMethod.HIVE]);
    });
  });
});
