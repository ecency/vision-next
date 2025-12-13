import { BlogLayout } from "@/features/blog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BlogLayout>Hello "/blog"!</BlogLayout>;
}
