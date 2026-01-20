import { createFileRoute } from '@tanstack/react-router';
import { BlogLayout } from '@/features/blog';
import { SearchResults } from '@/features/blog/components/search-results';
import { t } from '@/core';

export const Route = createFileRoute('/search')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || '',
    };
  },
});

function RouteComponent() {
  const { q } = Route.useSearch();

  return (
    <BlogLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold heading-theme">{t('search')}</h1>
      </div>
      <SearchResults query={q} />
    </BlogLayout>
  );
}
