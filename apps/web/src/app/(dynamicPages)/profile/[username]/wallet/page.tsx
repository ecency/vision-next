import {
  ProfileWalletExternalBanner,
  ProfileWalletSummary,
  ProfileWalletTokenPicker,
  ProfileWalletTokensList
} from "./_components";
import { Button } from "@/features/ui";
import { UilExchange } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "../_helpers";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "wallet");
}

export default function WalletPage() {
  return (
    <>
      <ProfileWalletExternalBanner />
      <ProfileWalletSummary />
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
