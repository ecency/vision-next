import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { PropsWithChildren } from "react";
import { CommunityCard, CommunityCover, CommunityMenu } from "./_components";
import { getCommunityCache } from "@/core/caches";
import "./community.scss";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Props {
  params: Promise<{ tag: string; community: string }>;
}

export default async function CommunityPageLayout({ children, params }: PropsWithChildren<Props>) {
  const { community, tag } = await params;
  const communityData = await prefetchQuery(getCommunityCache(community));
  const account = await prefetchQuery(getAccountFullQueryOptions(community));
  const metaUrl = `/${tag}/${community}`;
  const base = await getServerAppBase();

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content community-page">
        <div className="profile-side">
          {account && communityData && (
            <CommunityCard account={account} community={communityData} />
          )}
        </div>
        <span itemScope={true} itemType="http://schema.org/Organization">
          {communityData && (
            <meta itemProp="name" content={communityData.title.trim() || communityData.name} />
          )}
          <span itemProp="logo" itemScope={true} itemType="http://schema.org/ImageObject">
            <meta itemProp="url" content={metaUrl} />
          </span>
          <meta itemProp="url" content={`${base}${metaUrl}`} />
        </span>
        <div className="content-side">
          {communityData && <CommunityMenu community={communityData} />}
          {communityData && <CommunityCover account={account!} community={communityData} />}
          {children}
        </div>
      </div>
    </>
  );
}
