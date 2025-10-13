import i18next from "i18next";
import { useMemo } from "react";
import { ProfileWalletTokenHistoryCard } from "../../_components";
import { UilPlusCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@/features/ui";
import { success } from "@/features/shared";
import { useClaimRewards, AssetOperation } from "@ecency/wallets";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_DYNAMIC_PROPS,
  getDynamicPropsQuery,
  useClientActiveUser
} from "@/api/queries";
import { WalletOperationsDialog } from "@/features/wallet";
import { dateToFullRelative, formatNumber } from "@/utils";
import { getPowerDownSchedule } from "@/features/wallet/operations/get-power-down-schedule";

interface Props {
  username: string;
}

export function HpAboutCard({ username }: Props) {
  const activeUser = useClientActiveUser();
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  const hivePerMVests = (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests;

  const powerDownSchedule = useMemo(
    () => getPowerDownSchedule(accountData, hivePerMVests),
    [accountData, hivePerMVests]
  );

  const { mutateAsync: claimedRewards, isPending } = useClaimRewards(username, () =>
    success(i18next.t("wallet.claim-reward-balance-ok"))
  );

  return (
    <ProfileWalletTokenHistoryCard title={i18next.t("static.about.page-title")}> 
      <div className="px-4 pb-4 text-sm">
        {i18next.t("wallet.hive-power-description")}

        {powerDownSchedule && (
          <div className="border border-[--border-color] rounded-lg bg-gray-100 dark:bg-gray-900 p-4 flex flex-col gap-2 text-sm mt-4">
            <div className="font-semibold text-red-600 dark:text-red-400">
              {i18next.t("transfer.powering-down")}
            </div>
            <div>
              {i18next.t("wallet.next-power-down", {
                time: dateToFullRelative(powerDownSchedule.nextWithdrawal),
                amount: `${formatNumber(powerDownSchedule.weeklyHp, 3)} HP`,
                weeks: powerDownSchedule.weeks,
              })}
            </div>
            <div>
              {i18next.t("wallet.power-down-total", {
                amount: `${formatNumber(powerDownSchedule.totalHp, 3)} HP`,
              })}
            </div>

            {activeUser?.username === username && (
              <div>
                <WalletOperationsDialog
                  asset="HP"
                  operation={AssetOperation.PowerDown}
                  to={undefined}
                >
                  <Button
                    type="button"
                    appearance="danger"
                    outline={true}
                    size="sm"
                  >
                    {i18next.t("transfer.stop-power-down")}
                  </Button>
                </WalletOperationsDialog>
              </div>
            )}
          </div>
        )}

        {activeUser?.username === username && (
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="opacity-50">{i18next.t("wallet.unclaimed-rewards")}</div>

            <Button
              isLoading={isPending}
              icon={<UilPlusCircle />}
              disabled={accountData?.reward_vesting_hive === "0.000 HIVE"}
              onClick={claimedRewards}
            >
              {accountData?.reward_vesting_hive ?? "0.000 HIVE"}
            </Button>
          </div>
        )}
      </div>
    </ProfileWalletTokenHistoryCard>
  );
}
