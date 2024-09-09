import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { Entry, SearchResult } from "@/entities";
import { search } from "@/api/search-api";
import { isCommunity } from "@/utils";

function buildQuery(entry: Entry, retry = 3) {
  const { json_metadata, permlink } = entry;

  let q = "*";
  q += ` -dporn type:post`;
  let tags;
  // 3 tags and decrease until there is enough relevant posts
  if (json_metadata && json_metadata.tags && Array.isArray(json_metadata.tags)) {
    tags = json_metadata.tags
      .filter((x) => x && x !== "")
      .filter((x) => !isCommunity(x))
      .filter((x, ind) => ind < +retry)
      .join(",");
  }
  // check to make sure tags are not empty
  if (tags && tags.length > 0) {
    q += ` tag:${tags}`;
  } else {
    // no tags in post, try with permlink
    const fperm = permlink.split("-");
    tags = fperm
      .filter((x: string) => x !== "")
      .filter((x: string) => !/^-?\d+$/.test(x))
      .filter((x: string) => x.length > 2)
      .join(",");
    q += ` tag:${tags}`;
  }
  return q;
}

export const getSimilarEntriesQuery = (entry: Entry) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.SIMILAR_ENTRIES, entry.author, entry.permlink, buildQuery(entry)],
    queryFn: async () => {
      const response = await search(buildQuery(entry), "newest", "0", undefined, undefined);

      const rawEntries: SearchResult[] = response.results.filter(
        (r) => r.permlink !== entry.permlink && r.tags.indexOf("nsfw") === -1
      );

      let entries: SearchResult[] = [];

      rawEntries.forEach((x) => {
        if (entries.find((y) => y.author === x.author) === undefined) {
          entries.push(x);
        }
      });
      return entries.slice(0, 3);
    }
  });
