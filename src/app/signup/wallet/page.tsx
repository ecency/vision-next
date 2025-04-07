"use client";

import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import dynamic from "next/dynamic";

// export async function generateMetadata(
//   props: unknown,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   return PagesMetadataGenerator.getForPage("signup");
// }

// Why its dynamic? We have some client-side only libraries in this page
//     on server side they couldn't be initialised
//     Dynamic import drops this page from server side totally
// @ts-ignore
const SignupByWalletPage = dynamic(() => import("./_page"), { ssr: false });

export default function Page() {
  return <SignupByWalletPage />;
}
