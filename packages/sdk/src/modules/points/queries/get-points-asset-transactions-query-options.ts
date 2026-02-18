import { CONFIG } from "@/modules/core/config";
import { queryOptions } from "@tanstack/react-query";
import type { PointTransaction } from "../types";
import { PointTransactionType } from "../types";
import type { GeneralAssetTransaction } from "@/modules/wallet/types";

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            type: type ?? 0,
          }),
        }
      );
      const data = (await response.json()) as PointTransaction[];
      return data.map(({ created, type, amount, id, sender, receiver, memo }) => ({
        created: new Date(created),
        type,
        results: [
          {
            amount: parseFloat(amount),
            asset: "POINTS",
          },
        ],
        id,
        from: sender ?? undefined,
        to: receiver ?? undefined,
        memo: memo ?? undefined,
      })) satisfies GeneralAssetTransaction[];
    },
  });
}
