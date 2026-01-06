import i18next from "i18next";
import { useMemo } from "react";
import { ProfileWalletTokenHistoryCard } from "../../_components";
import { AssetOperation } from "@ecency/wallets";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { WalletOperationsDialog } from "@/features/wallet";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button } from "@/features/ui";
import { dateToFullRelative, formatNumber } from "@/utils";
import { getPowerDownSchedule } from "@/features/wallet/operations/get-power-down-schedule";

interface Props {
  username: string;
}

export function HpAboutCard({ username }: Props) {
  const { activeUser } = useActiveAccount();
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  const hivePerMVests = (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests;

  const powerDownSchedule = useMemo(
    () => getPowerDownSchedule(accountData, hivePerMVests),
    [accountData, hivePerMVests]
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
      </div>
    </ProfileWalletTokenHistoryCard>
  );
}
