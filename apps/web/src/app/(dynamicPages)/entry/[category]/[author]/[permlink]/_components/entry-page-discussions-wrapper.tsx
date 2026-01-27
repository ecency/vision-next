import { Suspense } from "react";
import { Entry } from "@/entities";
import { EntryPageDiscussions } from "./entry-page-discussions";
import { prefetchQuery } from "@/core/react-query";
import { getDiscussionsQueryOptions } from "@ecency/sdk";

interface Props {
  entry: Entry;
  category: string;
  activeUsername?: string;
}

async function DiscussionsServerLoader({ entry, activeUsername }: Omit<Props, "category">) {
  await prefetchQuery(getDiscussionsQueryOptions(entry, "created", true, activeUsername));
  return null;
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

export function EntryPageDiscussionsWrapper({ entry, category, activeUsername }: Props) {
  return (
    <Suspense fallback={<DiscussionsSkeleton />}>
      <DiscussionsServerLoader entry={entry} activeUsername={activeUsername} />
      <EntryPageDiscussions entry={entry} category={category} />
    </Suspense>
  );
}
