import {
  getAccountWalletAssetInfoQueryOptions,
  getAccountWalletListQueryOptions
} from "@ecency/wallets";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export function ProfileWalletSummary() {
  const { username } = useParams();
  const { data } = useQuery(
    getAccountWalletListQueryOptions((username as string).replace("%40", ""))
  );
  const queriesResult = useQueries({
    queries: (data ?? []).map((item) =>
      getAccountWalletAssetInfoQueryOptions((username as string).replace("%40", ""), item.asset)
    )
  });

  return (
    <div className="bg-white rounded-xl p-3 mb-4">
      <div className="text-gray-600 dark:text-gray-400 text-sm">Summary</div>
      <div>{}</div>
    </div>
  );
}
