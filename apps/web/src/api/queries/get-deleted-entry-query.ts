import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { makeEntryPath } from "@/utils";
import { getCommentHistoryQueryOptions } from "@ecency/sdk";

export const getDeletedEntryQuery = (author: string, permlink: string) => {
  const cleanPermlink = permlink?.trim();
  const isEnabled =
    !!author && !!cleanPermlink && cleanPermlink !== "" && cleanPermlink !== "undefined";

  return EcencyQueriesManager.generateClientServerQuery({
    ...getCommentHistoryQueryOptions(author, cleanPermlink || ""),
    queryKey: [QueryIdentifiers.DELETED_ENTRY, makeEntryPath("", author, cleanPermlink ?? "")],
    select: (history) => {
      if (!history?.list?.[0]) {
        return null;
      }
      const { body, title, tags } = history.list[0];
      return {
        body,
        title,
        tags,
      };
    },
    enabled: isEnabled,
  });
};
