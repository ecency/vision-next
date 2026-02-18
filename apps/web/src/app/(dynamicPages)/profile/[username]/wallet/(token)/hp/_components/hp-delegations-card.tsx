import i18next from "i18next";
import {
  ProfileWalletHpDelegationPromo,
  ProfileWalletTokenHistoryCard,
} from "../../_components";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { ReceivedVesting } from "./received-vesting-dialog";
import { useEffect, useMemo, useState } from "react";
import { DelegatedVesting } from "./delegated-vesting-dialog";
import { Transfer } from "@/features/shared";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import useLocalStorage from "react-use/lib/useLocalStorage";

const HP_PROMO_STORAGE_KEY_PREFIX = "hpDelegationPromoDismissed";
const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

interface Props {
  username: string;
}

const format = new Intl.NumberFormat();

export function HpDelegationsCard({ username }: Props) {
  const { data } = useQuery(getAccountWalletAssetInfoQueryOptions(username, "HP"));

  const [showDelegated, setShowDelegated] = useState(false);
  const [showReceived, setShowReceived] = useState(false);
  const [showDelegateDialog, setShowDelegateDialog] = useState(false);

  const { activeUser } = useActiveAccount();
  const isOwnProfile = activeUser?.username === username;

  const storageKey = `${HP_PROMO_STORAGE_KEY_PREFIX}:${username || "unknown"}`;
  const [promoDismissedAt, setPromoDismissedAt, removePromoDismissedAt] =
    useLocalStorage<number | null>(storageKey, null);

  const isPromoDismissed = useMemo(() => {
    if (!promoDismissedAt) {
      return false;
    }

    return Date.now() - promoDismissedAt < THIRTY_DAYS_IN_MS;
  }, [promoDismissedAt]);

  useEffect(() => {
    if (!promoDismissedAt) {
      return;
    }

    if (Date.now() - promoDismissedAt >= THIRTY_DAYS_IN_MS) {
      removePromoDismissedAt();
    }
  }, [promoDismissedAt, removePromoDismissedAt]);

  const shouldShowPromo = isOwnProfile && !isPromoDismissed;

  const outgoingDelegations =
    data?.parts?.find((part) =>
      ["outgoing_delegations", "delegating"].includes(part.name)
    )?.balance ?? 0;
  const incomingDelegations =
    data?.parts?.find((part) =>
      ["incoming_delegations", "received"].includes(part.name)
    )?.balance ?? 0;

  return (
    <>
      <ProfileWalletTokenHistoryCard title={i18next.t("profile-wallet.delegations")}>
        <div className="grid grid-cols-2 gap-2 md:gap-4 px-4 pb-4">
          <div
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 duration-300"
            onClick={() => setShowDelegated(true)}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("profile-wallet.delegations-outgoing")}
            </div>
            <div className="text-xl font-bold">{format.format(outgoingDelegations)}</div>
          </div>
          <div
            className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 duration-300"
            onClick={() => setShowReceived(true)}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("profile-wallet.delegations-incoming")}
            </div>
            <div className="text-xl font-bold">{format.format(incomingDelegations)}</div>
          </div>
        </div>
        {shouldShowPromo && (
          <div className="px-4 pb-4">
            <ProfileWalletHpDelegationPromo
              onDelegate={() => setShowDelegateDialog(true)}
              onDismiss={() => setPromoDismissedAt(Date.now())}
            />
          </div>
        )}
      </ProfileWalletTokenHistoryCard>
      <ReceivedVesting username={username} show={showReceived} setShow={setShowReceived} />
      <DelegatedVesting
        username={username}
        show={showDelegated}
        setShow={setShowDelegated}
        totalDelegated={`${outgoingDelegations}`}
      />
      {showDelegateDialog && (
        <Transfer
          mode="delegate"
          asset="HP"
          to="ecency"
          onHide={() => setShowDelegateDialog(false)}
        />
      )}
    </>
  );
}
