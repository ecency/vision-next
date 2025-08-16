"use client";

import { PropsWithChildren } from "react";
import { ProfileWalletTokenActions, ProfileWalletTokenSummary } from "./_components";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <ProfileWalletTokenSummary />
        <ProfileWalletTokenActions />
      </div>
      {children}
    </>
  );
}
