"use client";

import { PropsWithChildren } from "react";
import dynamic from "next/dynamic";

const ProfileWalletTokenSummary = dynamic(
  () => import("./_components/profile-wallet-token-summary"),
  { ssr: false }
);
const ProfileWalletTokenActions = dynamic(
  () => import("./_components/profile-wallet-token-actions"),
  { ssr: false }
);

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <ProfileWalletTokenSummary />
        <ProfileWalletTokenActions />
      </div>
      {children}
    </>
  );
}
