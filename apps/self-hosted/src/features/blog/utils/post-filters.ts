import { InstanceConfigManager } from '@/core';

/**
 * The instance's configured post filters, e.g. ['trending', 'hot'] for a
 * community or ['posts', 'blog'] for a personal blog.
 */
export function getConfiguredPostsFilters(): string[] {
  const filters = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.postsFilters,
  );
  return filters && filters.length > 0 ? filters : ['posts'];
}

/**
 * Clamp a requested filter to the configured list. Landing pages and stale
 * bookmarks may carry a filter the owner removed (or the hardcoded historic
 * default); those must resolve to the instance's FIRST configured filter, not
 * to a feed the owner disabled.
 */
export function resolvePostsFilter(requested: unknown): string {
  const configured = getConfiguredPostsFilters();
  return typeof requested === 'string' && configured.includes(requested)
    ? requested
    : configured[0];
}
