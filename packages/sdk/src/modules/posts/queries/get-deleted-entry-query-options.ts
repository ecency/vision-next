import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { CommentHistory } from "../types/comment-history";

function makeEntryPath(category: string, author: string, permlink: string) {
  return `${category}/@${author}/${permlink}`;
}

export interface DeletedEntry {
  body: string;
  title: string;
  tags: string[];
}

export function getDeletedEntryQueryOptions(author: string, permlink: string) {
  const cleanPermlink = permlink?.trim();
  const entryPath = makeEntryPath("", author, cleanPermlink ?? "");

  return queryOptions({
    queryKey: ["posts", "deleted-entry", entryPath],
    queryFn: async ({ signal }) => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/comment-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author,
          permlink: cleanPermlink || "",
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comment history: ${response.status}`);
      }

      return response.json() as Promise<CommentHistory>;
    },
    select: (history): DeletedEntry | null => {
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
    enabled:
      !!author && !!cleanPermlink && cleanPermlink !== "undefined",
  });
}
