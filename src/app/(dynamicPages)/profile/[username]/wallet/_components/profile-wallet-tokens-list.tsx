"use client";

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
      <div className="grid text-sm grid-cols-4 p-3 text-gray-600 dark:text-gray-400 border-b border-[--border-color]">
        <div className="col-span-2 sm:col-span-1">{i18next.t("profile-wallet.asset-name")}</div>
        <div className="hidden sm:block">
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
      {data?.map((item: string) => (
        <ProfileWalletTokensListItem
          asset={item}
          key={item}
          username={(username as string).replace("%40", "")}
        />
      ))}
    </div>
  );
}
