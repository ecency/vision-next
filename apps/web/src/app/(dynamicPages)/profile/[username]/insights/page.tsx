import { generateProfileMetadata } from "../_helpers";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions, getProMembersQueryOptions } from "@ecency/sdk";
import { isProMember } from "@/features/pro/pro-config";
import { ProfileInsights } from "./_page";
import { InsightsProGate } from "./_insights-pro-gate";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace(/%40/g, ""), "insights");
}

export default async function InsightsPage({ params }: Props) {
  const { username } = await params;
  const { get } = await cookies();

  const account = await prefetchQuery(getAccountFullQueryOptions(username.replace(/%40/g, "")));

  if (!account) {
    return notFound();
  }

  // Own insights stay free; viewing anyone else's is an Ecency Pro perk. Non-Pro viewers get a
  // Go-Pro upsell instead of the data (previously this was a hard owner-only redirect).
  const activeUser = get("active_user")?.value;
  let canView = !!activeUser && account.name === activeUser;
  if (!canView && activeUser) {
    try {
      const proMembers = await prefetchQuery(getProMembersQueryOptions());
      canView = isProMember(proMembers?.members, activeUser);
    } catch {
      canView = false;
    }
  }

  if (!canView) {
    return <InsightsProGate username={account.name} />;
  }

  return <ProfileInsights username={account.name} />;
}
