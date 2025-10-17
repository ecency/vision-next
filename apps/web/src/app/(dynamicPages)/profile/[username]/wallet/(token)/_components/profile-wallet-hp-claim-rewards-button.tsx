"use client";

import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery, useClientActiveUser } from "@/api/queries";
import { success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useClaimRewards } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { formatNumber, parseAsset, vestsToHp } from "@/utils";
import { UilPlus } from "@tooni/iconscout-unicons-react";

type Props = {
  username: string;
  className?: string;
  showIcon?: boolean;
};

type ClaimState = {
  isOwnProfile: boolean;
  rewardBalance: string;
  rewardAmount: number;
  hasRewards: boolean;
};

export function useProfileWalletHpClaimState(
  username: string,
  enabled = true
): ClaimState {
  const activeUser = useClientActiveUser();
  const isOwnProfile = activeUser?.username === username;

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: enabled && Boolean(username),
  });
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  const rewardAmount = useMemo(() => {
    const hivePerMVests = (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests;
    const rewardVests = parseAsset(accountData?.reward_vesting_balance ?? "0.000000 VESTS").amount;
    const hp = vestsToHp(rewardVests, hivePerMVests);
    return Number.isFinite(hp) ? hp : 0;
  }, [accountData?.reward_vesting_balance, dynamicProps]);

  const rewardBalance = useMemo(
    () => `${formatNumber(rewardAmount, 3)} HP`,
    [rewardAmount]
  );

  const hasRewards = rewardAmount > 0;

  return {
    isOwnProfile,
    rewardBalance,
    rewardAmount,
    hasRewards,
  };
}

export function ProfileWalletHpClaimRewardsButton({
  username,
  className,
  showIcon = false,
}: Props) {
  const { isOwnProfile, rewardBalance, hasRewards } =
    useProfileWalletHpClaimState(username);

  const { mutateAsync: claimRewards, isPending } = useClaimRewards(
    username,
    () => success(i18next.t("wallet.claim-reward-balance-ok"))
  );

  if (!hasRewards) {
    return null;
  }

  const icon = showIcon ? (
    <UilPlus className="w-3 h-3 text-current" />
  ) : undefined;
  const iconClassName = showIcon
    ? "!w-6 !h-6 rounded-full bg-white text-blue-dark-sky shrink-0"
    : undefined;

  return (
    <Button
      size="sm"
      appearance="primary"
      className={clsx("sm:w-auto", className)}
      disabled={!isOwnProfile || isPending}
      isLoading={isPending}
      onClick={() => isOwnProfile && claimRewards()}
      icon={icon}
      iconClassName={iconClassName}
    >
      {rewardBalance}
    </Button>
  );
}
