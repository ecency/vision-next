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
// Direct module import, not the `_components` barrel: the barrel star-exports
// client modules, and a server component reaching a "use client" boundary
// through one gets `undefined` back at render time.
import { FeedCachedRepaint } from "./_components/feed-cached-repaint";
import "./feed-reading.scss";

export default function FeedLayout({ children }: PropsWithChildren) {
  return (
    <div className="feed-page reading-page reading-background">
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content entry-index-page feed-reading-layout reading-list-layout">
        <div className="tags-side">
          <div className="reading-surface border border-[--border-color] rounded-xl p-4">
            <MyFavoritesWidget />
            <TrendingTagsCard />
          </div>
        </div>
        <div className="entry-page-content">
          <div className="page-tools">
            <EntryIndexMenu />
          </div>
          {/* Pass-through in the server render — it emits `{children}` and
              nothing else, adding no element and no Suspense boundary above
              the cards (#1786). On a client navigation it paints the reader's
              cached rows for the feed they are heading to, for as long as that
              navigation is in flight (#1789). */}
          <FeedCachedRepaint>{children}</FeedCachedRepaint>
        </div>
        <div className="side-menu">
          <FeatureSpotlightWidget />
          <div className="reading-surface border border-[--border-color] rounded-xl p-4">
            <TopCommunitiesWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
