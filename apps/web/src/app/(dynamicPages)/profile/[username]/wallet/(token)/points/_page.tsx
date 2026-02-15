"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button, FormControl } from "@/features/ui";
import { getPointsAssetTransactionsQueryOptions, PointTransactionType } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { ProfileWalletPointsInfo } from "../../_components";
import { ProfileWalletTokenHistory } from "../_components";
import { useState } from "react";

const OPTIONS = [
  "all",
  PointTransactionType.CHECKIN,
  PointTransactionType.LOGIN,
  PointTransactionType.CHECKIN_EXTRA,
  PointTransactionType.POST,
  PointTransactionType.COMMENT,
  PointTransactionType.VOTE,
  PointTransactionType.REBLOG,
  PointTransactionType.DELEGATION,
  PointTransactionType.REFERRAL,
  PointTransactionType.COMMUNITY,
  PointTransactionType.TRANSFER_SENT,
  PointTransactionType.TRANSFER_INCOMING
].map((value) => ({
  value,
  label: i18next.t(`points.filter-${value}`)
}));

export function PointsTokenPage() {
  const { activeUser } = useActiveAccount();
  const { username } = useParams();

  const [type, setType] = useState<"all" | PointTransactionType>("all");

  const { data } = useQuery(
    getPointsAssetTransactionsQueryOptions(
      (username as string).replace("%40", ""),
      type === "all" ? undefined : +type
    )
  );
  return (
    <>
      <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl mb-4">
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
      <ProfileWalletTokenHistory
        data={data ?? []}
        action={
          <FormControl
            value={type}
            onChange={(e) => setType((e.target as any).value)}
            type="select"
          >
            {OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormControl>
        }
      />
    </>
  );
}
