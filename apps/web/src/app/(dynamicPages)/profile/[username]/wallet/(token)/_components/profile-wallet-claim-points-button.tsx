"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getPointsQueryOptions, useClaimPoints } from "@ecency/wallets";
import { formatNumber } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { UilPlus } from "@tooni/iconscout-unicons-react";

type Props = {
  username: string;
  className?: string;
  showIcon?: boolean;
};

type ClaimState = {
  isOwnProfile: boolean;
  pendingPoints: number;
  formattedPendingPoints: string;
  hasPendingPoints: boolean;
  canClaim: boolean;
};

export function useProfileWalletPointsClaimState(
  username: string,
  enabled = true
): ClaimState {
  const { activeUser } = useActiveAccount();
  const isOwnProfile = activeUser?.username === username;

  const { data: pointsData } = useQuery({
    ...getPointsQueryOptions(username),
    enabled: enabled && Boolean(username),
  });

  const pendingPoints = useMemo(() => {
    if (!pointsData?.uPoints) {
      return 0;
    }

    const parsed = Number.parseFloat(pointsData.uPoints);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [pointsData?.uPoints]);

  const formattedPendingPoints = useMemo(
    () => formatNumber(pendingPoints, 3),
    [pendingPoints]
  );

  const hasPendingPoints = pendingPoints > 0;
  const canClaim = isOwnProfile && hasPendingPoints;

  return {
    isOwnProfile,
    pendingPoints,
    formattedPendingPoints,
    hasPendingPoints,
    canClaim,
  };
}

export function ProfileWalletClaimPointsButton({
  username,
  className,
  showIcon = false,
}: Props) {
  const { activeUser } = useActiveAccount();
  const { formattedPendingPoints, hasPendingPoints, canClaim } =
    useProfileWalletPointsClaimState(username);

  const { mutateAsync: claim, isPending: isClaiming } = useClaimPoints(
    activeUser?.username,
    activeUser?.accessToken,
    () => success(i18next.t("points.claim-ok")),
    (err) => error(...formatError(err))
  );

  if (!hasPendingPoints) {
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
      disabled={!canClaim || isClaiming}
      isLoading={isClaiming}
      onClick={() => canClaim && claim({})}
      icon={icon}
      iconClassName={iconClassName}
    >
      {`${formattedPendingPoints} POINTS`}
    </Button>
  );
}
