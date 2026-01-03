"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { getPostQueryOptions } from "@ecency/sdk";
import { BlogPostHeader } from "./blog-post-header";
import { BlogPostBody } from "./blog-post-body";
import { BlogPostFooter } from "./blog-post-footer";
import { BlogPostDiscussion } from "./blog-post-discussion";
import { BlogLayout } from "../layout/blog-layout";

export function BlogPostPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });

  // Handle both URL patterns: /:category/:author/:permlink and /:author/:permlink
  const author = (params.author as string)?.replace("@", "") || "";
  const permlink = (params.permlink as string) || "";
  const category = (params.category as string) || "created";
  const isRawContent = search?.raw !== undefined;

  const {
    data: entry,
    isLoading,
    error,
  } = useQuery(getPostQueryOptions(author, permlink));

  if (isLoading) {
    return (
      <BlogLayout>
        <div 
          className="text-center py-12"
          style={{ color: 'rgba(0, 0, 0, 0.54)' }}
        >
          Loading post...
        </div>
      </BlogLayout>
    );
  }

  if (error || !entry) {
    return (
      <BlogLayout>
        <div 
          className="text-center py-12"
          style={{ color: 'rgba(0, 0, 0, 0.54)' }}
        >
          Post not found.
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <article className="space-y-4 sm:space-y-6">
        <BlogPostHeader entry={entry} />
        <BlogPostBody entry={entry} isRawContent={isRawContent} />
        <BlogPostFooter entry={entry} />
        <BlogPostDiscussion
          entry={entry}
          category={category}
          isRawContent={isRawContent}
        />
      </article>
    </BlogLayout>
  );
}
