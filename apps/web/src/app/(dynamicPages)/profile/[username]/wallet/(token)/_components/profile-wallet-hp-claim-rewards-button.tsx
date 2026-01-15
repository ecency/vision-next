"use client";

import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useClaimRewards } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { formatNumber, parseAsset, vestsToHp, getSdkAuthContext, getUser } from "@/utils";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { formatError } from "@/api/operations";

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
  const { activeUser } = useActiveAccount();
  const isOwnProfile = activeUser?.username === username;

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: enabled && Boolean(username),
  });
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

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
  const { activeUser } = useActiveAccount();
  const { isOwnProfile, rewardBalance, hasRewards } =
    useProfileWalletHpClaimState(username);

  const { mutateAsync: claimRewards, isPending } = useClaimRewards(
    username,
    getSdkAuthContext(getUser(activeUser?.username ?? username)),
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

  const handleClaim = async () => {
    if (!isOwnProfile) {
      return;
    }

    try {
      await claimRewards();
    } catch (e) {
      error(...formatError(e));
    }
  };

  return (
    <Button
      size="sm"
      appearance="primary"
      className={clsx("sm:w-auto", className)}
      disabled={!isOwnProfile || isPending}
      isLoading={isPending}
      onClick={handleClaim}
      icon={icon}
      iconClassName={iconClassName}
    >
      {rewardBalance}
    </Button>
  );
}
