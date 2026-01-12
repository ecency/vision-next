"use client";

import { HiveWallet } from "@/utils";
import React, { ReactNode, useEffect, useState } from "react";
import { Tooltip } from "@ui/tooltip";
import Link from "next/link";
import { creditCardSvg } from "@ui/svg";
import i18next from "i18next";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { useActiveAccount } from "@/core/hooks";
import { useQuery } from "@tanstack/react-query";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";

export const WalletBadge = ({ icon }: { icon: ReactNode }) => {
  const { username, account } = useActiveAccount();

  const [hasUnclaimedRewards, setHasUnclaimedRewards] = useState(false);

  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  useEffect(() => {
    if (account) {
      setHasUnclaimedRewards(
        new HiveWallet(account, dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hasUnclaimedRewards
      );
    }
  }, [account, dynamicProps]);
  return (
    <>
      <Tooltip
        content={
          hasUnclaimedRewards
            ? i18next.t("user-nav.unclaimed-reward-notice")
            : i18next.t("user-nav.wallet")
        }
      >
        <Link href={`/@${username}/wallet`} className="user-wallet">
          {hasUnclaimedRewards && <span className="reward-badge" />}
          {icon ?? creditCardSvg}
        </Link>
      </Tooltip>
    </>
  );
};
