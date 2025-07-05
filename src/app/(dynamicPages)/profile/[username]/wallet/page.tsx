"use client";

import dynamic from "next/dynamic";
import { ProfileWalletSummary } from "./_components";

const ProfileWalletTokenPicker = dynamic(
  () => import("./_components/profile-wallet-token-picker"),
  { ssr: false }
);
const ProfileWalletTokensList = dynamic(() => import("./_components/profile-wallet-tokens-list"), {
  ssr: false
});

interface Props {
  params: Promise<{ username: string }>;
}

// export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
//   const { username } = await props.params;
//   return generateProfileMetadata(username.replace("%40", ""), "wallet");
// }

export default function WalletPage({ params }: Props) {
  return (
    <>
      <ProfileWalletSummary />
      <div className="flex justify-end mb-2">
        <ProfileWalletTokenPicker />
      </div>
      <ProfileWalletTokensList />
    </>
  );
}
