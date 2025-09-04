import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { makeEntryPath } from "@/utils";
import { commentHistory } from "@/api/private-api";

export const getDeletedEntryQuery = (author: string, permlink: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.DELETED_ENTRY, makeEntryPath("", author, permlink?.trim() ?? "")],
    queryFn: async () => {
      const cleanPermlink = permlink?.trim();
      if (!author || !cleanPermlink || cleanPermlink === "undefined") {
        return null;
      }
      const history = await commentHistory(author, cleanPermlink);
      const { body, title, tags } = history.list[0];
      return {
        body,
        title,
        tags
      };
    },
    enabled: !!author && !!permlink && permlink.trim() !== "" && permlink.trim() !== "undefined"
  });
