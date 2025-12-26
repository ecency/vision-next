import { createFileRoute } from "@tanstack/react-router";
import { BlogPostPage } from "@/features/blog/components/blog-post-page";

export const Route = createFileRoute("/$author/$permlink")({
  component: BlogPostPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      raw: search.raw !== undefined ? true : undefined,
    };
  },
});

