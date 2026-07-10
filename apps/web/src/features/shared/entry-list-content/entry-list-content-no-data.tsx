"use client";

import { MessageNoData } from "@/features/shared";
import i18next from "i18next";
import { isCommunity } from "@/utils";
import React from "react";
import Link from "next/link";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  section: string;
  loading: boolean;
  username: string;
}

export function EntryListContentNoData({ username, section, loading }: Props) {
  const { activeUser } = useActiveAccount();
  const isMyProfile =
    !!activeUser && username.includes("@") && activeUser.username === username.replace("@", "");

  const t = (key: string, fallback: string) => i18next.t(key) || fallback;

  if (loading) {
    return null;
  }

  let title = "";
  let description = "";
  let buttonText = "";
  let buttonTo = "";
  let secondaryButtonText = "";
  let secondaryButtonTo = "";
  let footer: React.ReactNode = null;

  // Check if this is a personalized feed (feed, trending/my, hot/my, created/my)
  const isPersonalizedFeed = section === "feed" || (["trending","hot","created"].includes(section) && !username && activeUser);

  if (isMyProfile && section !== "trail") {
    if (isPersonalizedFeed) {
      title = `${t("g.nothing-found-in", "Nothing found in")} ${t("g.feed", "feed")}`;
      description = t(
        "g.fill-feed",
        "You can follow accounts and join communities to fill this feed."
      );
      buttonText = t("navbar.discover", "Discover");
      buttonTo = "/discover";
    } else {
      title = t("profile-info.no-posts", "No posts yet");
      description = `${t("g.nothing-found-in", "Nothing found in")} ${t(
        `g.${section}`,
        section
      )}.`;
      buttonText = t("profile-info.create-posts", "Create post");
      buttonTo = "/publish";
    }
  } else if (isCommunity(username)) {
    title = t("profile-info.no-posts-community", "No posts yet");
    description = `${t("g.no", "No")} ${t(`g.${section}`, section)} ${t("g.found", "found")}.`;
    buttonText = t("profile-info.create-posts", "Create post");
    buttonTo = `/submit?cat=${username}`;
  } else if (isPersonalizedFeed) {
    title = `${t("g.nothing-found-in", "Nothing found in")} ${t("g.feed", "feed")}`;
    description = t(
      "g.fill-feed",
      "You can follow accounts and join communities to fill this feed."
    );
    buttonText = t("navbar.discover", "Discover");
    buttonTo = "/discover";
  } else {
    title = t("profile-info.no-posts-user", "No posts yet");
    description = `${t("g.nothing-found-in", "Nothing found in")} ${
      section === "trail"
        ? `${t("g.trail", "trail")} ${t("g.past-few-days", "past few days")}`
        : t(`g.${section}`, section)
    }.`;
    buttonText = t("navbar.discover", "Discover");
    buttonTo = "/discover";
    if (isMyProfile) {
      buttonText = t("profile-info.create-posts", "Create post");
      buttonTo = "/publish";
    }
  }

  // An empty personal feed almost always means the user follows no one yet.
  // Discover (the primary CTA above) points at people to follow, but the fastest
  // way to actually meet people is Waves — so add it as a secondary path and link
  // the getting-started guide for anyone who just landed here.
  if (isPersonalizedFeed) {
    secondaryButtonText = t("g.jump-into-waves", "Jump into Waves");
    secondaryButtonTo = "/waves";
    footer = (
      <>
        {t("g.feed-guide-prompt", "New here?")}{" "}
        <Link
          href="/@ecency/your-first-week-on-ecency"
          className="text-blue-dark-sky hover:underline"
        >
          {t("g.feed-guide-link", "Read your first week on Ecency")}
        </Link>
      </>
    );
  }

  return (
    <MessageNoData
      title={title}
      description={description}
      buttonText={buttonText}
      buttonTo={buttonTo}
      secondaryButtonText={secondaryButtonText}
      secondaryButtonTo={secondaryButtonTo}
      footer={footer}
    />
  );
}
