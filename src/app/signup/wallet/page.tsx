"use client";

import dynamic from "next/dynamic";

import { Suspense } from "react";

// Why its dynamic? We have some client-side only libraries in this page
//     on server side they couldn't be initialised
//     Dynamic import drops this page from server side totally
// @ts-ignore
const SignupByWalletPage = dynamic(() => import("./_page"), { ssr: false });

export default function Page() {
  return <SignupByWalletPage />;
}
