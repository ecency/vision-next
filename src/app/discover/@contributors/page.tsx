import { DiscoverContributors } from "@/app/discover/_components";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

export default async function ContributorPage() {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <div className="popular-users">
        <DiscoverContributors />
      </div>
    </HydrationBoundary>
  );
}
