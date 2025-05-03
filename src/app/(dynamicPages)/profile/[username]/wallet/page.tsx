"use client";

import { getAccountFullQuery, getTransactionsQuery } from "@/api/queries";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

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
      <div className="flex justify-end mb-2">
        <ProfileWalletTokenPicker />
      </div>
      <ProfileWalletTokensList />
    </>
  );
}
