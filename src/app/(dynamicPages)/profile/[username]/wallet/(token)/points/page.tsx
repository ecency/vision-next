"use client";

import { useClientActiveUser } from "@/api/queries";
import { Button } from "@/features/ui";
import { getPointsAssetTransactionsQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { ProfileWalletPointsInfo } from "../../_components";
import { ProfileWalletTokenHistory } from "../_components";

export default function TokenPage() {
  const activeUser = useClientActiveUser();
  const { username } = useParams();

  const { data } = useQuery(
    getPointsAssetTransactionsQueryOptions((username as string).replace("%40", ""))
  );
  return (
    <>
      <div className=" bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl mb-4">
        <div className="p-4 flex justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("points.earn-points")}
          </div>
          {activeUser?.username === (username as string).replace("%40", "") && (
            <Button
              target="_blank"
              appearance="gray"
              size="sm"
              icon={<UilArrowUpRight />}
              href="/perks/points"
            >
              {i18next.t("points.get")}
            </Button>
          )}
        </div>
        <div className="p-4">
          <ProfileWalletPointsInfo />
        </div>
      </div>
      <ProfileWalletTokenHistory data={data ?? []} />
    </>
  );
}
