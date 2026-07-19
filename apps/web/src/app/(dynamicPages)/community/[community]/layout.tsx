import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { PropsWithChildren } from "react";
import { CommunityCard, CommunityCover, CommunityMenu } from "./_components";
import { getCommunityCache } from "@/core/caches";
import "./community.scss";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { JsonLd, buildCommunityJsonLd } from "@/features/structured-data";

interface Props {
  params: Promise<{ community: string }>;
}

export default async function CommunityPageLayout({ children, params }: PropsWithChildren<Props>) {
  const { community } = await params;
  // `tag` is a child segment ([community]/[tag]) and is never in this layout's
  // param scope, so it resolved to `undefined` here (JSON-LD url `/undefined/hive-…`).
  // Use the canonical community path used elsewhere (breadcrumbs, next.config redirect).
  const metaUrl = `/created/${community}`;
  const [communityData, account, base] = await Promise.all([
    prefetchQuery(getCommunityCache(community)),
    prefetchQuery(getAccountFullQueryOptions(community)),
    getServerAppBase()
  ]);

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
        {communityData && (
          <JsonLd
            data={buildCommunityJsonLd({
              community: communityData,
              path: metaUrl,
              base: base.replace(/\/+$/, "")
            })}
          />
        )}
        <div className="content-side">
          {communityData && <CommunityMenu community={communityData} />}
          {communityData && account && <CommunityCover account={account} community={communityData} />}
          {children}
        </div>
      </div>
    </>
  );
}
