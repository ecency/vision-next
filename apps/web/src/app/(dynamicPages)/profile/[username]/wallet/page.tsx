import {
  ProfileWalletExternalBanner,
  ProfileWalletSummary,
  ProfileWalletTokenPicker,
  ProfileWalletTokensList
} from "./_components";
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
      <div className="flex justify-end mb-2">
        <ProfileWalletTokenPicker />
      </div>
      <ProfileWalletTokensList />
    </>
  );
}
