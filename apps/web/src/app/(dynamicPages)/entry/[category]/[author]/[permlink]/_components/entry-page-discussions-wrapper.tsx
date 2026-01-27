"use client";

import { Suspense } from "react";
import { Entry } from "@/entities";
import { EntryPageDiscussions } from "./entry-page-discussions";
import { useQuery } from "@tanstack/react-query";
import { getDiscussionsQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  entry: Entry;
  category: string;
}

function DiscussionsLoader({ entry, category }: Props) {
  const { username: activeUsername } = useActiveAccount();

  // Prefetch discussions on client-side with activeUsername
  useQuery(getDiscussionsQueryOptions(entry, "created", true, activeUsername));

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
  return (
    <Suspense fallback={<DiscussionsSkeleton />}>
      <DiscussionsLoader entry={entry} category={category} />
    </Suspense>
  );
}
