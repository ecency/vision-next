"use client";

import { useQuery } from "@tanstack/react-query";
import { Entry } from "@ecency/sdk";
import { CONFIG } from "@ecency/sdk";
import { BlogDiscussionList } from "./blog-discussion-list";
import { useMemo, useState } from "react";
import { UilComment } from "@tooni/iconscout-unicons-react";

interface Props {
  entry: Entry;
  category: string;
  isRawContent?: boolean;
}

type SortOrder = "trending" | "author_reputation" | "votes" | "created";

function sortDiscussions(
  entry: Entry,
  discussions: Entry[],
  order: SortOrder
): Entry[] {
  const isPinned = (a: Entry) =>
    entry.json_metadata?.pinned_reply === `${a.author}/${a.permlink}`;

  const sortFunctions = {
    trending: (a: Entry, b: Entry) => {
      if (a.net_rshares < 0) return 1;
      if (b.net_rshares < 0) return -1;
      const aPayout =
        typeof a.pending_payout_value === "string"
          ? parseFloat(a.pending_payout_value) || 0
          : a.pending_payout_value || 0;
      const bPayout =
        typeof b.pending_payout_value === "string"
          ? parseFloat(b.pending_payout_value) || 0
          : b.pending_payout_value || 0;
      return bPayout - aPayout;
    },
    author_reputation: (a: Entry, b: Entry) => {
      return (b.author_reputation || 0) - (a.author_reputation || 0);
    },
    votes: (a: Entry, b: Entry) => {
      return (b.active_votes?.length || 0) - (a.active_votes?.length || 0);
    },
    created: (a: Entry, b: Entry) => {
      if (a.net_rshares < 0) return 1;
      if (b.net_rshares < 0) return -1;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    },
  };

  const sorted = [...discussions].sort(sortFunctions[order]);
  const pinnedIndex = sorted.findIndex((i) => isPinned(i));
  if (pinnedIndex >= 0) {
    const pinned = sorted[pinnedIndex];
    sorted.splice(pinnedIndex, 1);
    sorted.unshift(pinned);
  }
  return sorted;
}

export function BlogPostDiscussion({ entry, category, isRawContent }: Props) {
  const [order, setOrder] = useState<SortOrder>("created");
  const entryData = entry.original_entry || entry;

  const { data: allComments = [], isLoading } = useQuery({
    queryKey: ["discussions", entryData.author, entryData.permlink, order],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "get_discussion",
        {
          author: entryData.author,
          permlink: entryData.permlink,
          observer: entryData.author,
        }
      );

      if (response && typeof response === "object") {
        const comments = Object.values(response) as Entry[];
        return sortDiscussions(entryData, comments, order);
      }
      return [];
    },
    enabled: !!entryData.author && !!entryData.permlink,
  });

  const topLevelComments = useMemo(
    () =>
      allComments.filter(
        (x) =>
          x.parent_author === entryData.author &&
          x.parent_permlink === entryData.permlink
      ),
    [allComments, entryData]
  );

  if (isLoading) {
    return (
      <div className="mb-8">
        <div 
          className="text-center py-8"
          style={{ color: 'rgba(0, 0, 0, 0.54)' }}
        >
          Loading comments...
        </div>
      </div>
    );
  }

  if (topLevelComments.length === 0) {
    return (
      <div className="mb-8">
        <div 
          className="text-center py-8"
          style={{ color: 'rgba(0, 0, 0, 0.54)' }}
        >
          No comments yet.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <UilComment className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.54)' }} />
          <h2 
            className="text-xl font-semibold"
            style={{ 
              fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
              color: 'rgba(0, 0, 0, 0.84)'
            }}
          >
            {topLevelComments.length}{" "}
            {topLevelComments.length === 1 ? "Comment" : "Comments"}
          </h2>
        </div>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as SortOrder)}
          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-opacity hover:opacity-70"
          style={{ 
            backgroundColor: 'white',
            color: 'rgba(0, 0, 0, 0.84)',
            fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
          }}
        >
          <option value="trending">Trending</option>
          <option value="author_reputation">Reputation</option>
          <option value="votes">Votes</option>
          <option value="created">Newest</option>
        </select>
      </div>

      <BlogDiscussionList
        discussionList={allComments}
        parent={entryData}
        root={entryData}
        isRawContent={isRawContent}
      />
    </div>
  );
}
