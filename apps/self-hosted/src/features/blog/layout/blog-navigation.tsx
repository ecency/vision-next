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
    <div className="max-w-3xl mx-auto border-b border-gray-200 pb-4 mb-8">
      <div className="flex items-center gap-4 mb-6">
        {blogLogo && (
          <img
            src={blogLogo}
            alt={blogTitle}
            className="h-10 w-10 object-contain"
          />
        )}
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily:
              '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            color: "rgba(0, 0, 0, 0.84)",
          }}
        >
          {blogTitle}
        </h1>
      </div>

      <nav className="flex gap-6 pt-4">
        {availableFilters.map((filter) => {
          const isActive = currentFilter === filter;
          return (
            <Link
              key={filter}
              to="/blog"
              search={{ filter }}
              className={clsx(
                "text-sm font-normal transition-opacity pb-2 border-b-2",
                isActive
                  ? "border-black text-black"
                  : "border-transparent text-gray-600 hover:text-black hover:border-gray-300"
              )}
              style={{
                fontFamily:
                  '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
              }}
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
