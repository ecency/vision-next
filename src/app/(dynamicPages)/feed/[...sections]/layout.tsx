import { TrendingTagsCard } from "@/app/_components/trending-tags-card";
import { EntryIndexMenu } from "@/app/_components/entry-index-menu";
import React, { PropsWithChildren } from "react";
import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";
import { useGlobalStore } from "@/core/global-store";
import "./entry-index.scss";

interface Props {
  params: { sections: string[] };
}

export default function FeedLayout({
  params: {
    sections: [filter = "hot", tag = ""]
  },
  children
}: PropsWithChildren<Props>) {
  const isMobile = useGlobalStore((s) => s.isMobile);

  return (
    <div className="app-content overflow-hidden entry-index-page">
      <div className="tags-side">{!isMobile && <TrendingTagsCard filter={filter} tag={tag} />}</div>
      <div className="entry-page-content">
        <div className="page-tools">
          <EntryIndexMenu filter={filter} tag={tag} />
        </div>
      </div>
      {children}
      <div className="side-menu">{!isMobile && <TopCommunitiesWidget />}</div>
    </div>
  );
}
