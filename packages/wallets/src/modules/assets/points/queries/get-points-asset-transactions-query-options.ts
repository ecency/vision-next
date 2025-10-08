import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { PointTransaction, PointTransactionType } from "../types";
import { GeneralAssetTransaction } from "../../types";

export function getPointsAssetTransactionsQueryOptions(
  username: string | undefined,
  type?: PointTransactionType
) {
  return queryOptions({
    queryKey: ["assets", "points", "transactions", username, type],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/point-list`,
        {
          method: "POST",
          body: JSON.stringify({
            username,
            type: type ?? 0,
          }),
        }
      );
      const data = (await response.json()) as PointTransaction[];
      return data.map(({ created, type, amount, id }) => ({
        created: new Date(created),
        type,
        results: [
          {
            amount: parseInt(amount),
            asset: "POINTS",
          },
        ],
        id,
      })) satisfies GeneralAssetTransaction[];
    },
  });
}
