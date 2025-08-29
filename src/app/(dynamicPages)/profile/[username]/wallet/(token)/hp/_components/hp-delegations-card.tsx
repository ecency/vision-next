import i18next from "i18next";
import { ProfileWalletTokenHistoryCard } from "../../_components";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";

interface Props {
  username: string;
}

export function HpDelegationsCard({ username }: Props) {
  const { data } = useQuery(getAccountWalletAssetInfoQueryOptions(username, "HP"));

  return (
    <ProfileWalletTokenHistoryCard title={i18next.t("profile-wallet.delegations")}>
      <div className="grid grid-cols-2 gap-2 md:gap-4 px-4 pb-4">
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">{data?.parts?.[0].name}</div>
          <div className="text-xl font-bold">{data?.parts?.[0].balance}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">{data?.parts?.[1].name}</div>
          <div className="text-xl font-bold">{data?.parts?.[1].balance}</div>
        </div>
      </div>
    </ProfileWalletTokenHistoryCard>
  );
}
