"use client";

import dynamic from "next/dynamic";

const ProfileWalletTokenSummary = dynamic(
  () => import("./_components/profile-wallet-token-summary"),
  { ssr: false }
);
const ProfileWalletTokenActions = dynamic(
  () => import("./_components/profile-wallet-token-actions"),
  { ssr: false }
);
const ProfileWalletTokenHistory = dynamic(
  () => import("./_components/profile-wallet-token-history"),
  { ssr: false }
);

export default function TokenPage() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <ProfileWalletTokenSummary />
        <ProfileWalletTokenActions />
      </div>
      <ProfileWalletTokenHistory />
    </>
  );
}
