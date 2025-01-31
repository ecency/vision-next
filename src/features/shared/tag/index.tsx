"use client";

import React, { createElement, useMemo } from "react";
import { isCommunity } from "@/utils";
import { EntryFilter } from "@/enums";
import { useGlobalStore } from "@/core/global-store";
import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { Badge } from "@ui/badge";
import Link from "next/link";

export const makePath = (filter: string, tag: string): string => {
  // created is default filter for community pages
  if (isCommunity(tag)) {
    return `/${EntryFilter.created}/${tag}`;
  }

  // @ts-ignore
  if (EntryFilter[filter] === undefined) {
    return `/${EntryFilter.created}/${tag}`;
  }

  return `/${filter}/${tag}`;
};

interface CommunityTag {
  name: string;
  title: string;
}

interface Props {
  tag: string | CommunityTag;
  type?: "link" | "span";
  children: any;
}

export function TagLink({ tag, type, children }: Props) {
  const router = useRouter();

  const filter = useGlobalStore((state) => state.filter);

  const isTagCommunity = useMemo(() => (typeof tag === "string" ? isCommunity(tag) : false), [tag]);
  const href = useMemo(
    () => (typeof tag === "string" ? makePath(filter, tag) : makePath(filter, tag.name)),
    [tag, filter]
  );

  const { data: community } = getCommunityCache(tag as string).useClientQuery();

  if (type === "link") {
    const props = Object.assign(
      {},
      { children: <Badge>{children}</Badge> },
      {
        href,
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          const newLoc =
            typeof tag === "string" ? makePath(filter, tag) : makePath(filter, tag.name);
          router.push(newLoc);
        }
      }
    );

    return <Link {...props} />;
  } else if (type === "span") {
    const props = Object.assign({}, children.props);

    if (typeof tag === "string") {
      props.title = i18next.t("tag.unmoderated");
      if (community) {
        props.children = community.title;
        props.title = i18next.t("tag.moderated");
      }
    } else {
      props.children = tag.title;
      props.title = i18next.t("tag.moderated");
    }

    return createElement("span", props);
  } else {
    return <></>;
  }
}
