"use client";

import { useState } from "react";
import { Entry } from "@/entities";
import { EntryPageDiscussions } from "./entry-page-discussions";
import { useQuery } from "@tanstack/react-query";
import { getDiscussionsQueryOptions, SortOrder } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import i18next from "i18next";
import { Button } from "@/features/ui";
import { UilComment } from "@tooni/iconscout-unicons-react";

interface Props {
  entry: Entry;
  category: string;
}

function DiscussionsLoader({ entry, category }: Props) {
  const { username: activeUsername } = useActiveAccount();

  const { isLoading, isError, refetch } = useQuery(getDiscussionsQueryOptions(entry, SortOrder.created, true, activeUsername ?? undefined));

  if (isLoading) {
    return <DiscussionsSkeleton />;
  }

  if (isError) {
    return (
      <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-4 my-4 flex justify-center">
        <Button icon={<UilComment />} onClick={() => refetch()}>
          {i18next.t("discussion.load-error", { defaultValue: "Failed to load comments. Tap to retry" })}
        </Button>
      </div>
    );
  }

  return <EntryPageDiscussions entry={entry} category={category} />;
}

function DiscussionsSkeleton() {
  return (
    <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-2 md:p-3">
      <div className="w-full rounded-lg animate-pulse h-[80px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey mb-4" />
      <div className="w-full rounded-lg animate-pulse h-[120px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey mb-4" />
      <div className="w-full rounded-lg animate-pulse h-[120px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
    </div>
  );
}

export function EntryPageDiscussionsWrapper({ entry, category }: Props) {
  const { activeUser } = useActiveAccount();
  const [showDiscussions, setShowDiscussions] = useState(false);

  const commentCount = entry.children;

  // Auto-load for logged-in users, manual load for anonymous
  if (!activeUser && !showDiscussions) {
    return commentCount > 0 ? (
      <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-4 my-4 flex justify-center">
        <Button
          icon={<UilComment />}
          onClick={() => setShowDiscussions(true)}
        >
          {i18next.t("discussion.reveal-comments", { n: commentCount, defaultValue: "Show {{n}} comments" })}
        </Button>
      </div>
    ) : null;
  }

  return <DiscussionsLoader entry={entry} category={category} />;
}
