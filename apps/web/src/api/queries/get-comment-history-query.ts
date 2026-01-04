import { getCommentHistoryQueryOptions, CommentHistory } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Entry } from "@/entities";

export type { CommentHistory };

export function useGetCommentHistoryQuery(entry: Entry, onlyMeta = false) {
  const options = getCommentHistoryQueryOptions(entry.author, entry.permlink, onlyMeta);
  return useQuery(options);
}
