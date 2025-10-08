import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { getPost } from "@/api/bridge";
import { makeEntryPath } from "@/utils";

export const getPostQuery = (
  author: string,
  permlink?: string,
  observer = "",
  num?: number
) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryFn: () => {
      const cleanPermlink = permlink?.trim();
      return !cleanPermlink || cleanPermlink === "undefined"
        ? Promise.resolve(null)
        : getPost(author, cleanPermlink, observer, num);
    },
    queryKey: [QueryIdentifiers.ENTRY, makeEntryPath("", author, permlink?.trim() ?? "")],
    enabled: !!author && !!permlink && permlink.trim() !== "" && permlink.trim() !== "undefined"
  });
