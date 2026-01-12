import { getHiveMarketRate } from "./get-market-rate";
import { HiveMarketAsset } from "../../market-pair";
import { getQueryClient } from "@ecency/sdk";

jest.mock("@ecency/sdk", () => ({
  ...jest.requireActual("@ecency/sdk"),
  getQueryClient: jest.fn()
}));

describe("GetMarketRate", function () {
  it("should return hive lowest ask", async function () {
    (getQueryClient as jest.Mock).mockReturnValue({
      fetchQuery: () => Promise.resolve({ lowest_ask: 0.5 })
    });
    const rate = await getHiveMarketRate(HiveMarketAsset.HIVE);
    expect(rate).toBe(0.5);
  });

  it("should return hbd lowest ask", async function () {
    (getQueryClient as jest.Mock).mockReturnValue({
      fetchQuery: () => Promise.resolve({ lowest_ask: 0.5 })
    });
    const rate = await getHiveMarketRate(HiveMarketAsset.HBD);
    expect(rate).toBe(2);
  });
});
