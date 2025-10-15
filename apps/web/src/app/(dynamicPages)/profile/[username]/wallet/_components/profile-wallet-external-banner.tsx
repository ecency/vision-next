"use client";

import { useClientActiveUser } from "@/api/queries";
import { getAccessToken } from "@/utils/user-token";
import { Button } from "@/features/ui";
import {
  checkUsernameWalletsPendingQueryOptions,
  getAccountFullQueryOptions,
} from "@ecency/sdk";
import { EcencyWalletCurrency } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";
import { useParams } from "next/navigation";

export function ProfileWalletExternalBanner() {
  const { username } = useParams();
  const usernameParam = typeof username === "string" ? username : "";
  const cleanUsername = usernameParam.replace("%40", "");

  const activeUser = useClientActiveUser();
  const isOwnProfile = activeUser?.username === cleanUsername;
  const accessToken = isOwnProfile ? getAccessToken(cleanUsername) : undefined;

  const { data } = useQuery({
    ...getAccountFullQueryOptions(cleanUsername),
    enabled: isOwnProfile && Boolean(cleanUsername)
  });

  const { data: walletCheckData } = useQuery({
    ...checkUsernameWalletsPendingQueryOptions(cleanUsername, accessToken),
    enabled: isOwnProfile && Boolean(cleanUsername) && Boolean(accessToken)
  });

  if (!isOwnProfile) {
    return <></>;
  }

  if (walletCheckData?.exist) {
    return <></>;
  }

  if (
    data?.profile?.tokens?.some(({ symbol }) =>
      Object.values(EcencyWalletCurrency).includes(symbol as any)
    )
  ) {
    return <></>;
  }

  return (
    <div className="bg-white rounded-xl p-3 mb-4 flex flex-col md:flex-row items-center gap-4 lg:gap-6">
      <Image src="/assets/undraw-digital-currency.svg" alt="" width={300} height={300} />
      <div className="flex flex-col items-start gap-2 lg:gap-4">
        <h3 className="text-2xl">{i18next.t("profile-wallet.external-wallets-offer.title")}</h3>
        <div className="opacity-75">
          {i18next.t("profile-wallet.external-wallets-offer.description")}
        </div>
        <Button href="/wallet/setup-external" size="lg" icon={<UilArrowRight />}>
          {i18next.t("intro.c2a")}
        </Button>
      </div>
    </div>
  );
}
