'use client';

import { Link, useLocation } from '@tanstack/react-router';
import clsx from 'clsx';
import { useMemo } from 'react';
import { InstanceConfigManager } from '@/core';
import { UserMenu, CreatePostButton } from '@/features/auth';
import { useInstanceConfig, useCommunityData } from '../hooks/use-instance-config';
import { SearchInput } from '../components/search-input';

export function BlogNavigation() {
  const location = useLocation();
  const { isCommunityMode } = useInstanceConfig();
  const { data: community } = useCommunityData();

  const currentFilter = useMemo(() => {
    if (typeof location.search === 'string') {
      const searchParams = new URLSearchParams(location.search);
      return searchParams.get('filter') || (isCommunityMode ? 'trending' : 'posts');
    }
    if (
      location.search &&
      typeof location.search === 'object' &&
      'filter' in location.search
    ) {
      return (location.search.filter as string) || (isCommunityMode ? 'trending' : 'posts');
    }
    return isCommunityMode ? 'trending' : 'posts';
  }, [location.search, isCommunityMode]);

  const blogTitle = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.meta.title,
  );

  const blogLogo = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.meta.logo,
  );

  const availableFilters = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.postsFilters || ['posts'],
  );

  // Use community title if available and in community mode
  const displayTitle = isCommunityMode && community?.title ? community.title : blogTitle;

  // Use community avatar from image proxy if no custom logo
  const displayLogo = useMemo(() => {
    if (blogLogo) return blogLogo;
    if (isCommunityMode && community?.name) {
      const proxyBase = InstanceConfigManager.getConfigValue(
        ({ configuration }) => configuration.general.imageProxy || 'https://images.ecency.com',
      );
      return `${proxyBase}/u/${community.name}/avatar/medium`;
    }
    return null;
  }, [blogLogo, isCommunityMode, community?.name]);

  // Blog filters
  const blogFilterLabels: Record<string, string> = {
    blog: 'Blog',
    posts: 'Posts',
    comments: 'Comments',
    replies: 'Replies',
  };

  // Community filters
  const communityFilterLabels: Record<string, string> = {
    trending: 'Trending',
    hot: 'Hot',
    new: 'New',
    payout: 'Payout',
    muted: 'Muted',
  };

  // Use configured filters for both modes
  const filterLabels = isCommunityMode ? communityFilterLabels : blogFilterLabels;

  return (
    <div className="max-w-3xl mx-auto border-b border-theme pb-3 sm:pb-4 mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {displayLogo && (
            <img
              src={displayLogo}
              alt={displayTitle}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full"
            />
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold heading-theme">
              {displayTitle}
            </h1>
            {isCommunityMode && community?.about && (
              <p className="text-xs sm:text-sm text-theme-muted mt-0.5 line-clamp-1">
                {community.about}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput />
          <CreatePostButton />
          <UserMenu />
        </div>
      </div>

      <nav className="flex gap-4 sm:gap-6 pt-3 sm:pt-4 overflow-x-auto">
        {availableFilters.map((filter) => {
          const isActive = currentFilter === filter;
          return (
            <Link
              key={filter}
              to="/blog"
              search={{ filter }}
              className={clsx(
                'text-sm font-normal transition-theme pb-2 border-b-2 font-theme-ui whitespace-nowrap',
                isActive
                  ? 'border-theme-strong text-theme-primary'
                  : 'border-transparent text-theme-muted hover:text-theme-primary hover:border-theme',
              )}
            >
              {filterLabels[filter] ||
                filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
