"use client";

import { FormattedCurrency } from "@/features/shared";
import { StyledTooltip } from "@/features/ui";
import { getAccountWalletListQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { ProfileWalletTokensListItem } from "./profile-wallet-tokens-list-item";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";

export default function ProfileWalletTokensList() {
  const { username } = useParams();
  const { data } = useQuery(
    getAccountWalletListQueryOptions((username as string).replace("%40", ""))
  );

  return (
    <div className="bg-white rounded-xl">
      <div className="grid text-sm grid-cols-4 p-2 md:p-3 text-gray-600 dark:text-gray-400 border-b border-[--border-color]">
        <div>{i18next.t("profile-wallet.asset-name")}</div>
        <div>
          <StyledTooltip size="md" content={i18next.t("profile-wallet.apr-hint")}>
            <div className="flex items-center gap-1">
              {i18next.t("profile-wallet.apr")}
              <UilInfoCircle className="w-4 h-4" />
            </div>
          </StyledTooltip>
        </div>
        <div>{i18next.t("profile-wallet.price")}</div>
        <div>{i18next.t("profile-wallet.balance")}</div>
      </div>
      {data?.map((item) => <ProfileWalletTokensListItem item={item} />)}
    </div>
  );
}
