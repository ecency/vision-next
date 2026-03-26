import { CONFIG, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { filterDmcaEntry } from "../utils/filter-dmca-entries";
import { verifyPostOnAlternateNode } from "@/modules/bridge/verify-on-alternate-node";

export function getPostQueryOptions(
  author: string,
  permlink?: string,
  observer = "",
  num?: number
) {
  const cleanPermlink = permlink?.trim();
  const entryPath = `/@${author}/${cleanPermlink ?? ""}`;

  return queryOptions({
    queryKey: QueryKeys.posts.entry(entryPath),
    queryFn: async () => {
      if (!cleanPermlink || cleanPermlink === "undefined") {
        return null;
      }

      // Snapshot the current node before the call so failover
      // can't change which node we exclude during verification
      const primaryNode = CONFIG.hiveClient.currentAddress;

      const response = await CONFIG.hiveClient.call("bridge", "get_post", {
        author,
        permlink: cleanPermlink,
        observer,
      });

      if (!response) {
        // Primary node returned null — verify on alternate nodes
        // to guard against sync lag returning null for valid posts
        const verified = await verifyPostOnAlternateNode(author, cleanPermlink, observer, primaryNode);
        if (!verified) {
          return null;
        }
        const verifiedEntry = num !== undefined ? { ...verified, num } as Entry : verified as Entry;
        return filterDmcaEntry(verifiedEntry);
      }

      const entry = num !== undefined ? { ...response, num } as Entry : response as Entry;
      return filterDmcaEntry(entry);
    },
    enabled:
      !!author &&
      !!permlink &&
      permlink.trim() !== "" &&
      permlink.trim() !== "undefined",
  });
}
