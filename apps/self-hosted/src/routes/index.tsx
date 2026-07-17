import { createFileRoute, Navigate } from '@tanstack/react-router';
import { resolvePostsFilter } from '@/features/blog/utils/post-filters';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  // Land on the instance's FIRST configured filter (e.g. trending for a
  // community), not a hardcoded one the owner may have removed.
  return (
    <Navigate
      to="/blog"
      search={{ filter: resolvePostsFilter(undefined) }}
      replace
    />
  );
}
