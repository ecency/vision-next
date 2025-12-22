import { BlogLayout } from "@/features/blog";
import { createFileRoute } from "@tanstack/react-router";
import { BlogPostsList } from "@/features/blog/components/blog-posts-list";

export const Route = createFileRoute("/blog")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <BlogLayout>
      <BlogPostsList />
    </BlogLayout>
  );
}
