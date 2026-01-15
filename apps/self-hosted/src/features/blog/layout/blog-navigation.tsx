"use client";

import { InstanceConfigManager } from "@/core";
import { Link, useLocation } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo } from "react";

export function BlogNavigation() {
  const location = useLocation();
  const currentFilter = useMemo(() => {
    if (typeof location.search === "string") {
      const searchParams = new URLSearchParams(location.search);
      return searchParams.get("filter") || "posts";
    }
    if (
      location.search &&
      typeof location.search === "object" &&
      "filter" in location.search
    ) {
      return (location.search.filter as string) || "posts";
    }
    return "posts";
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
    <div className="max-w-3xl mx-auto border-b border-theme pb-3 sm:pb-4 mb-6 sm:mb-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        {blogLogo && (
          <img
            src={blogLogo}
            alt={blogTitle}
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          />
        )}
        <h1 className="text-xl sm:text-2xl font-bold heading-theme">
          {blogTitle}
        </h1>
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
                "text-sm font-normal transition-theme pb-2 border-b-2 font-theme-ui",
                isActive
                  ? "border-theme-strong text-theme-primary"
                  : "border-transparent text-theme-muted hover:text-theme-primary hover:border-theme"
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
