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
import { useEffect, useMemo } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";

const EXTERNAL_BANNER_STORAGE_KEY_PREFIX = "externalWalletSetupBannerDismissed";
const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export function ProfileWalletExternalBanner() {
  const { username } = useParams();
  const usernameParam = typeof username === "string" ? username : "";
  const cleanUsername = usernameParam.replace("%40", "");
  const storageKey = `${EXTERNAL_BANNER_STORAGE_KEY_PREFIX}:${cleanUsername || "unknown"}`;

  const [dismissedAt, setDismissedAt, removeDismissedAt] = useLocalStorage<number | null>(
    storageKey,
    null
  );

  const isDismissed = useMemo(() => {
    if (!dismissedAt) {
      return false;
    }

    const diff = Date.now() - dismissedAt;
    return diff < THIRTY_DAYS_IN_MS;
  }, [dismissedAt]);

  useEffect(() => {
    if (!dismissedAt) {
      return;
    }

    const diff = Date.now() - dismissedAt;
    if (diff >= THIRTY_DAYS_IN_MS) {
      removeDismissedAt();
    }
  }, [dismissedAt, removeDismissedAt]);

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

  if (!isOwnProfile || isDismissed) {
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
      <div className="flex flex-col items-start gap-2 lg:gap-4 flex-1">
        <h3 className="text-2xl">{i18next.t("profile-wallet.external-wallets-offer.title")}</h3>
        <div className="opacity-75">
          {i18next.t("profile-wallet.external-wallets-offer.description")}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button href="/wallet/setup-external" size="lg" icon={<UilArrowRight />}>
            {i18next.t("intro.c2a")}
          </Button>
          <Button
            appearance="secondary"
            outline
            size="lg"
            onClick={() => setDismissedAt(Date.now())}
          >
            {i18next.t("profile-wallet.external-wallets-offer.dismiss")}
          </Button>
        </div>
      </div>
    </div>
  );
}
