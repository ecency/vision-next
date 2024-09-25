import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { getPromotedEntriesQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { FeedContent } from "../_components";
import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { generateFeedMetadata } from "@/app/(dynamicPages)/feed/[...sections]/_helpers";

interface Props {
  params: { sections: string[] };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateFeedMetadata(props.params.sections[0], props.params.sections[1]);
}

export default async function FeedPage({
  params: {
    sections: [filter = "hot", tag = ""]
  }
}: Props) {
  const cookiesStore = cookies();

  const observer = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
  await prefetchGetPostsFeedQuery(filter, tag, 20, observer);
  await getPromotedEntriesQuery().prefetch();

  return <FeedContent tag={tag} filter={filter} observer={observer} />;
}
