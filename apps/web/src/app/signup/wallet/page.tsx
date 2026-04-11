"use client";

import dynamic from "next/dynamic";

// Dynamic import: client-side only libraries (MetaMask, crypto) can't initialize on server
// @ts-ignore
const SignupByWalletPage = dynamic(() => import("./_page"), { ssr: false });

export default function Page() {
  return <SignupByWalletPage />;
}
