"use client";

import dynamic from "next/dynamic";

const ProfileWalletTokenHistory = dynamic(
  () => import("../_components/profile-wallet-token-history"),
  { ssr: false }
);

export default function TokenPage() {
  return <ProfileWalletTokenHistory />;
}
