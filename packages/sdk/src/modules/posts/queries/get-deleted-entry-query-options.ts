import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { CommentHistory } from "../types/comment-history";

function makeEntryPath(author: string, permlink: string): string {
  const cleanAuthor = author?.trim();
  const cleanPermlink = permlink?.trim();

  if (!cleanAuthor || !cleanPermlink) {
    throw new Error("Invalid entry path: author and permlink are required");
  }

  // Normalize by removing any leading @ or / characters
  const normalizedAuthor = cleanAuthor.replace(/^@+/, "");
  const normalizedPermlink = cleanPermlink.replace(/^\/+/, "");

  if (!normalizedAuthor || !normalizedPermlink) {
    throw new Error("Invalid entry path: author and permlink cannot be empty after normalization");
  }

  return `@${normalizedAuthor}/${normalizedPermlink}`;
}

export interface DeletedEntry {
  body: string;
  title: string;
  tags: string[];
}

export function getDeletedEntryQueryOptions(author: string, permlink: string) {
  const cleanPermlink = permlink?.trim();
  const cleanAuthor = author?.trim();
  const isValid =
    !!cleanAuthor && !!cleanPermlink && cleanPermlink !== "undefined";

  const entryPath = isValid ? makeEntryPath(cleanAuthor, cleanPermlink) : "";

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
    enabled: isValid,
  });
}
