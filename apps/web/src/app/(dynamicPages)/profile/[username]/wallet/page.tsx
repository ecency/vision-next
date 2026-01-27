import {
  ProfileWalletExternalBanner,
  ProfileWalletTokenPicker,
  ProfileWalletTokensList
} from "./_components";
import { ProfileWalletSummaryWrapper } from "./_components/profile-wallet-summary-wrapper";
import { Button } from "@/features/ui";
import { UilExchange } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "../_helpers";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "wallet");
}

export default async function WalletPage(props: Props) {
  const { username } = await props.params;

  // Prefetch account data to avoid waterfall
  await prefetchQuery(getAccountFullQueryOptions(username.replace("%40", "")));
  return (
    <>
      <ProfileWalletExternalBanner />
      <ProfileWalletSummaryWrapper />
      <div className="flex justify-end mb-2 gap-2">
        <Button
          size="sm"
          appearance="gray-link"
          href="/market/limit"
          icon={<UilExchange />}
        >
          {i18next.t("profile-wallet.trade-tokens", {
            defaultValue: i18next.t("market-data.trade"),
          })}
        </Button>
        <ProfileWalletTokenPicker />
      </div>
      <ProfileWalletTokensList />
    </>
  );
}
