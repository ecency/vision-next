import "@/features/shared/reading-layout/reading-layout.scss";
import { TrendingTagsCard } from "@/app/_components/trending-tags-card";
import { EntryIndexMenu } from "@/app/_components/entry-index-menu";
import React, { PropsWithChildren } from "react";
import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";
import { MyFavoritesWidget } from "@/app/_components/my-favorites-widget";
import { FeatureSpotlightWidget } from "@/app/_components/feature-spotlight-widget/lazy";
import "./[...sections]/entry-index.scss";
import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import "./feed-reading.scss";

export default function FeedLayout({ children }: PropsWithChildren) {
  return (
    <div className="feed-page reading-page">
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content entry-index-page feed-reading-layout reading-list-layout">
        <div className="tags-side">
          <MyFavoritesWidget />
          <TrendingTagsCard />
        </div>
        <div className="entry-page-content">
          <div className="page-tools">
            <EntryIndexMenu />
          </div>
          {children}
        </div>
        <div className="side-menu">
          <FeatureSpotlightWidget />
          <TopCommunitiesWidget />
        </div>
      </div>
    </div>
  );
}
