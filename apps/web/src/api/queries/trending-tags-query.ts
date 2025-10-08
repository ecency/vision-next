import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { TrendingTag } from "@/entities";
import { isCommunity } from "@/utils";

type TagsPage = string[];                 // each page is a list of tag names
type TagsCursor = { afterTag: string };   // we paginate by last tag name

export const getTrendingTagsQuery = (limit = 250) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<TagsPage, TagsCursor>({
        queryKey: [QueryIdentifiers.TRENDING_TAGS],
        staleTime: Infinity,
        refetchOnMount: true,
        initialPageParam: { afterTag: "" } as TagsCursor,
        initialData: { pages: [], pageParams: [] },

        // annotate pageParam to avoid implicit-any
        queryFn: async ({ pageParam }: { pageParam: TagsCursor }) =>
            client.database
                .call("get_trending_tags", [pageParam.afterTag, limit])
                .then((tags: TrendingTag[]) =>
                    tags
                        .filter((x) => x.name !== "")
                        .filter((x) => !isCommunity(x.name))
                        .map((x) => x.name)
                ),

        getNextPageParam: (
            lastPage: TagsPage
        ): TagsCursor | undefined => {
            const last = lastPage?.[lastPage.length - 1];
            return last ? { afterTag: last } : undefined;
        },
    });
