import { TrendingTagsCard } from "@/app/_components/trending-tags-card";
import { EntryIndexMenu } from "@/app/_components/entry-index-menu";
import React, { PropsWithChildren } from "react";
import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";
import { useGlobalStore } from "@/core/global-store";
import "./[...sections]/entry-index.scss";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";

export default function FeedLayout({ children }: PropsWithChildren) {
  const isMobile = useGlobalStore((s) => s.isMobile);

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content overflow-hidden entry-index-page">
        <div className="tags-side">{!isMobile && <TrendingTagsCard />}</div>
        <div className="entry-page-content">
          <div className="page-tools">
            <EntryIndexMenu />
          </div>
          {children}
        </div>
        <div className="side-menu">{!isMobile && <TopCommunitiesWidget />}</div>
      </div>
    </>
  );
}
