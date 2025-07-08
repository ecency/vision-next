import { CommunitiesListSearch } from "@/app/communities/_components/communities-list-search";
import { CommunitiesListSortSelector } from "@/app/communities/_components/communities-list-sort-selector";
import { CommunityCard } from "@/app/discover/@communities/_components/community-card";
import { CommunityCardAnimated } from "@/app/discover/@communities/_components/community-card-animated";
import { getCommunityCache } from "@/core/caches";
import { getQueryClient } from "@/core/react-query";
import { Communities, getCommunitiesQueryOptions } from "@ecency/sdk";
import i18next from "i18next";

interface Props {
  sort: string;
  query: string;
}

export async function CommunitiesList({ sort, query }: Props) {
  let list = getQueryClient().getQueryData<Communities>(
    getCommunitiesQueryOptions(sort, query).queryKey
  );

  const ecencyCommunity =
    list?.find((x) => x.name === "hive-125125") ??
    (await getCommunityCache("hive-125125").prefetch());

  if (ecencyCommunity) {
    list = [ecencyCommunity, ...(list?.filter((x) => x.name !== "hive-125125") ?? [])];
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <CommunitiesListSearch sort={sort} query={query} />
        <div>
          <CommunitiesListSortSelector sort={sort} query={query} />
        </div>
      </div>
      <div className="list-items">
        {list?.length === 0 && (
          <div className="no-results">{i18next.t("communities.no-results")}</div>
        )}
        <div className="grid grid-cols-12 gap-4 mt-4">
          {list?.map((x, i) => (
            <CommunityCardAnimated
              className="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-3"
              key={x.name}
              i={i}
            >
              <CommunityCard i={i} community={x} />
            </CommunityCardAnimated>
          ))}
        </div>
      </div>
    </>
  );
}
