import { TrendingTagsCard } from "@/app/_components/trending-tags-card";
import { EntryIndexMenu } from "@/app/_components/entry-index-menu";
import React, { PropsWithChildren } from "react";
import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";
import { MyFavouritesWidget } from "@/app/_components/my-favourites-widget";
import "./[...sections]/entry-index.scss";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";

export default function FeedLayout({ children }: PropsWithChildren) {
  return (
    <>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <div className="app-content overflow-hidden entry-index-page">
        <div className="tags-side">
          <TrendingTagsCard />
        </div>
        <div className="entry-page-content">
          <div className="page-tools">
            <EntryIndexMenu />
          </div>
          {children}
        </div>
        <div className="side-menu">
          <MyFavouritesWidget />
          <TopCommunitiesWidget />
        </div>
      </div>
    </>
  );
}
