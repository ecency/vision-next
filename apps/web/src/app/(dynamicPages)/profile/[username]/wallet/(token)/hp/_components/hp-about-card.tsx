import i18next from "i18next";
import { ProfileWalletTokenHistoryCard } from "../../_components";
import { UilPlusCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@/features/ui";
import { success } from "@/features/shared";
import { useClaimRewards } from "@/features/wallet/sdk";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useClientActiveUser } from "@/api/queries";

interface Props {
  username: string;
}

export function HpAboutCard({ username }: Props) {
  const activeUser = useClientActiveUser();
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  const { mutateAsync: claimedRewards, isPending } = useClaimRewards(username, () =>
    success(i18next.t("wallet.claim-reward-balance-ok"))
  );

  return (
    <ProfileWalletTokenHistoryCard title={i18next.t("static.about.page-title")}>
      <div className="px-4 pb-4 text-sm">
        {i18next.t("wallet.hive-power-description")}

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
