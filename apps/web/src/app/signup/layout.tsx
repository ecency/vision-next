import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { PropsWithChildren } from "react";
import { SignupLayoutClient } from "./_components/signup-layout-client";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("signup");
}

export default function Layout({ children }: PropsWithChildren) {
  return <SignupLayoutClient>{children}</SignupLayoutClient>;
}
