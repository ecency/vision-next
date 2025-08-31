import i18next from "i18next";
import { ProfileWalletTokenHistoryCard } from "../../_components";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { ReceivedVesting } from "./received-vesting-dialog";
import { useState } from "react";
import { DelegatedVesting } from "./delegated-vesting-dialog";

interface Props {
  username: string;
}

const format = new Intl.NumberFormat();

export function HpDelegationsCard({ username }: Props) {
  const { data } = useQuery(getAccountWalletAssetInfoQueryOptions(username, "HP"));

  const [showDelegated, setShowDelegated] = useState(false);
  const [showReceived, setShowReceived] = useState(false);

  return (
    <>
      <ProfileWalletTokenHistoryCard title={i18next.t("profile-wallet.delegations")}>
        <div className="grid grid-cols-2 gap-2 md:gap-4 px-4 pb-4">
          <div
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 duration-300"
            onClick={() => setShowDelegated(true)}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">{data?.parts?.[0].name}</div>
            <div className="text-xl font-bold">{format.format(data?.parts?.[0].balance ?? 0)}</div>
          </div>
          <div
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 duration-300"
            onClick={() => setShowReceived(true)}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">{data?.parts?.[1].name}</div>
            <div className="text-xl font-bold">{format.format(data?.parts?.[1].balance ?? 0)}</div>
          </div>
        </div>
      </ProfileWalletTokenHistoryCard>
      <ReceivedVesting username={username} show={showReceived} setShow={setShowReceived} />
      <DelegatedVesting
        username={username}
        show={showDelegated}
        setShow={setShowDelegated}
        totalDelegated={`${data?.parts?.[0].balance}`}
      />
    </>
  );
}
