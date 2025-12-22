"use client";

import { InstanceConfigManager } from "@/core";
import { Link, useLocation } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo } from "react";

export function BlogNavigation() {
  const location = useLocation();
  const currentFilter = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("filter") || "posts";
  }, [location.search]);

  const blogTitle = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.meta.title
  );

  const blogLogo = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.meta.logo
  );

  const availableFilters = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.postsFilters || ["posts"]
  );

  const filterLabels: Record<string, string> = {
    blog: "Blog",
    posts: "Posts",
    comments: "Comments",
    replies: "Replies",
  };

  return (
    <div className="col-span-2 mb-6">
      <div className="flex items-center gap-4 mb-6">
        {blogLogo && (
          <img
            src={blogLogo}
            alt={blogTitle}
            className="h-12 w-12 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {blogTitle}
        </h1>
      </div>

      <nav className="flex gap-2 flex-wrap">
        {availableFilters.map((filter) => {
          const isActive = currentFilter === filter;
          return (
            <Link
              key={filter}
              to="/blog"
              search={{ filter }}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
