import type { ReactNode } from "react";

import { useGlobalStore } from "@/core/global-store";
import { FormattedCurrency } from "@/features/shared";
import { Badge } from "@/features/ui";
import { useGetTokenLogoImage } from "@/features/wallet";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { HiveEngineClaimRewardsButton } from "../[token]/_components/hive-engine-claim-rewards-button";
import {
  ProfileWalletClaimPointsButton,
  useProfileWalletPointsClaimState,
} from "./profile-wallet-claim-points-button";
import {
  ProfileWalletHpClaimRewardsButton,
  useProfileWalletHpClaimState,
} from "./profile-wallet-hp-claim-rewards-button";
import {
  ProfileWalletHbdClaimRewardsButton,
  useProfileWalletHbdClaimState,
} from "./profile-wallet-hbd-claim-rewards-button";
import {
  ProfileWalletHiveClaimRewardsButton,
  useProfileWalletHiveClaimState,
} from "./profile-wallet-hive-claim-rewards-button";
import { ProfileWalletHbdInterest } from "./profile-wallet-hbd-interest";
import i18next from "i18next";

function format(value: number) {
  const formatter = new Intl.NumberFormat();
  return formatter.format(value);
}

export function ProfileWalletTokenSummary() {
  const { token, username } = useParams();

  const pathname = usePathname();
  const tokenWithFallback =
    (token as string)?.toUpperCase() ?? pathname.split("/")[3]?.toUpperCase();

  const cleanUsername = (username as string).replace("%40", "");
  const currency = useGlobalStore((state) => state.currency);

  const { hasPendingPoints } =
    useProfileWalletPointsClaimState(
      cleanUsername,
      tokenWithFallback === "POINTS"
    );

  const { hasRewards: hasHpRewards } =
    useProfileWalletHpClaimState(
      cleanUsername,
      tokenWithFallback === "HP"
    );

  const { hasRewards: hasHbdRewards } =
    useProfileWalletHbdClaimState(
      cleanUsername,
      tokenWithFallback === "HBD"
    );

  const { hasRewards: hasHiveRewards } =
    useProfileWalletHiveClaimState(
      cleanUsername,
      tokenWithFallback === "HIVE"
    );

  const { data, isFetching } = useQuery(
    getAccountWalletAssetInfoQueryOptions(cleanUsername, tokenWithFallback)
  );

  const logo = useGetTokenLogoImage((username as string).replace("%40", ""), tokenWithFallback);

  const parts = data?.parts ?? [];
  const liquidBalance =
    parts.find((part) => part.name === "liquid")?.balance ??
    parts.find((part) => part.name === "current")?.balance ??
    parts.find((part) => part.name === "account")?.balance ??
    data?.accountBalance ??
    0;
  const stakedBalance = parts.find((part) => part.name === "staked")?.balance ?? 0;
  const savingsBalance = parts.find((part) => part.name === "savings")?.balance ?? 0;
  const hasStakedBalance = parts.some((part) => part.name === "staked");
  const hasSavingsBalance = parts.some((part) => part.name === "savings");

  const normalizedCurrency = currency?.toUpperCase();
  const fiatBalanceLabel =
    normalizedCurrency === "USD" || normalizedCurrency === "HBD"
      ? "USD Balance"
      : `${normalizedCurrency ?? "USD"} Balance`;

  const fiatBalance = liquidBalance * (data?.price ?? 0);

  const cards: { label: string; value: ReactNode }[] = [
    {
      label: hasSavingsBalance
        ? "Current Balance"
        : hasStakedBalance
        ? "Liquid Balance"
        : "Balance",
      value: format(liquidBalance),
    },
    ...(hasStakedBalance
      ? [
          {
            label: "Staked Balance",
            value: format(stakedBalance),
          },
        ]
      : []),
    ...(hasSavingsBalance
      ? [
          {
            label: "Savings Balance",
            value: format(savingsBalance),
          },
        ]
      : []),
    {
      label: fiatBalanceLabel,
      value: <FormattedCurrency value={fiatBalance} />,
    },
    ...(data?.apr
      ? [
          {
            label: "APR",
            value: `${+data.apr}%`,
          },
        ]
      : []),
  ];

  const gridClassName =
    cards.length >= 4
      ? "grid-cols-2 md:grid-cols-4"
      : cards.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  if (isFetching) {
    <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col justify-between gap-4">
      <div className="flex justify-between">
        <div className="w-[90px] rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-[56px] rounded-lg animate-pulse h-[24px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="w-[56px] rounded-lg animate-pulse h-[64px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-full rounded-lg animate-pulse h-[64px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-full rounded-lg animate-pulse h-[64px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div className="flex items-start gap-2 md:gap-3 col-span-2 sm:col-span-1">
            <div className="mt-1">{logo}</div>
            <div>
              <div className="text-xl font-bold">{data?.title}</div>
            <div className="flex items-center gap-1">
              <div className="text-xs text-gray-500 uppercase font-semibold">{data?.name}</div>
              {data?.layer && (
                <Badge className="!rounded-lg !p-0 !px-1" appearance="secondary">
                  {data.layer}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end sm:text-right">
          <div className="text-blue-dark-sky">
            <FormattedCurrency value={data?.price ?? 0} fixAt={3} />
          </div>
          <HiveEngineClaimRewardsButton className="w-full sm:w-auto" />
          {tokenWithFallback === "POINTS" && hasPendingPoints && (
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:items-end">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {i18next.t("wallet.unclaimed-rewards")}
              </div>
              <ProfileWalletClaimPointsButton
                username={cleanUsername}
                className="w-full sm:w-auto"
              />
            </div>
          )}
          {tokenWithFallback === "HP" && hasHpRewards && (
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:items-end">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {i18next.t("wallet.unclaimed-rewards")}
              </div>
              <ProfileWalletHpClaimRewardsButton
                username={cleanUsername}
                className="w-full sm:w-auto"
              />
            </div>
          )}
          {tokenWithFallback === "HBD" && hasHbdRewards && (
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:items-end">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {i18next.t("wallet.unclaimed-rewards")}
              </div>
              <ProfileWalletHbdClaimRewardsButton
                username={cleanUsername}
                className="w-full sm:w-auto"
              />
            </div>
          )}
          {tokenWithFallback === "HIVE" && hasHiveRewards && (
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:items-end">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {i18next.t("wallet.unclaimed-rewards")}
              </div>
              <ProfileWalletHiveClaimRewardsButton
                username={cleanUsername}
                className="w-full sm:w-auto"
              />
            </div>
          )}
        </div>
      </div>
        <div className={`grid ${gridClassName} gap-2 md:gap-4`}>
          {cards.map((card) => (
            <div key={card.label} className="bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400">{card.label}</div>
              <div className="text-xl font-bold">{card.value}</div>
            </div>
          ))}
        </div>
      </div>
      {tokenWithFallback === "HBD" && (
        <ProfileWalletHbdInterest username={cleanUsername} />
      )}
    </div>
  );
}
