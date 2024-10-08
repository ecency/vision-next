import i18next from "i18next";
import { CommunityListItem } from "@/app/communities/_components/community-list-item";
import { getCommunitiesQuery } from "@/api/queries";
import { CommunitiesListSearch } from "@/app/communities/_components/communities-list-search";
import { CommunitiesListSortSelector } from "@/app/communities/_components/communities-list-sort-selector";
import { CommunityListItemAnimatedLayout } from "@/app/communities/_components/community-list-item-animated-layout";
import { SafeAnimatePresence } from "@/features/framer-motion";
import { getCommunityCache } from "@/core/caches";

interface Props {
  sort: string;
  query: string;
}

export async function CommunitiesList({ sort, query }: Props) {
  let list = getCommunitiesQuery(sort, query).getData();
  const ecencyCommunity =
    list?.find((x) => x.name === "hive-125125") ??
    (await getCommunityCache("hive-125125").prefetch());

  if (ecencyCommunity) {
    list = [ecencyCommunity, ...(list?.filter((x) => x.name !== "hive-125125") ?? [])];
  }

  return (
    <>
      <div className="list-form">
        <div className="search">
          <CommunitiesListSearch sort={sort} query={query} />
        </div>
        <div className="sort">
          <CommunitiesListSortSelector sort={sort} query={query} />
        </div>
      </div>
      <div className="list-items">
        {list?.length === 0 && (
          <div className="no-results">{i18next.t("communities.no-results")}</div>
        )}
        <SafeAnimatePresence mode="popLayout">
          {list?.map((x, i) => (
            <CommunityListItemAnimatedLayout key={x.name} i={i}>
              <CommunityListItem community={x} />
            </CommunityListItemAnimatedLayout>
          ))}
        </SafeAnimatePresence>
      </div>
    </>
  );
}
