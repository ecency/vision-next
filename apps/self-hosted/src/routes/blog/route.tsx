import { createFileRoute } from '@tanstack/react-router';
import { BlogLayout } from '@/features/blog';
import { BlogPostsList } from '@/features/blog/components/blog-posts-list';

export const Route = createFileRoute('/blog')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      filter: (search.filter as string) || 'posts',
    };
  },
});

function RouteComponent() {
  const { filter } = Route.useSearch();
  return (
    <BlogLayout>
      <BlogPostsList filter={filter} />
    </BlogLayout>
  );
}
