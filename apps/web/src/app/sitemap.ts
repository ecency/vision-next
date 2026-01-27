import { MetadataRoute } from "next";
import { getServerAppBase } from "@/utils/server-app-base";
import { getQueryClient } from "@/core/react-query";
import { getCommunitiesQueryOptions, getTrendingTagsQueryOptions } from "@ecency/sdk";
import { getPostsFeedQuery } from "@/api/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getServerAppBase();
  const queryClient = getQueryClient();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2024-01-01"),
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${baseUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: `${baseUrl}/witnesses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7
    },
    {
      url: `${baseUrl}/proposals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date("2024-01-01"),
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date("2024-01-01"),
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];

  // Dynamic routes - Top communities (limit 50)
  let communityRoutes: MetadataRoute.Sitemap = [];
  try {
    const communities = await queryClient.fetchQuery(
      getCommunitiesQueryOptions("rank", "", 50)
    );
    communityRoutes = communities.slice(0, 50).map((community) => ({
      url: `${baseUrl}/created/${community.name}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.7
    }));
  } catch (e) {
    console.error("Sitemap: Failed to fetch communities", e);
  }

  // Dynamic routes - Top tags (limit 30)
  let tagRoutes: MetadataRoute.Sitemap = [];
  try {
    const tags = await queryClient.fetchInfiniteQuery(getTrendingTagsQueryOptions());
    const topTags = tags.pages?.[0]?.slice(0, 30) || [];
    tagRoutes = topTags.map((tag) => ({
      url: `${baseUrl}/trending/${tag.tag}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.6
    }));
  } catch (e) {
    console.error("Sitemap: Failed to fetch tags", e);
  }

  // Dynamic routes - Top trending posts (limit 100)
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPostsFeedQuery("trending", "", 100);
    if (posts?.pages?.[0]) {
      postRoutes = posts.pages[0].slice(0, 100).map((post) => ({
        url: `${baseUrl}${post.url}`,
        lastModified: new Date(post.updated || post.created),
        changeFrequency: "daily" as const,
        priority: 0.6
      }));
    }
  } catch (e) {
    console.error("Sitemap: Failed to fetch posts", e);
  }

  return [...staticRoutes, ...communityRoutes, ...tagRoutes, ...postRoutes];
}

export const revalidate = 3600; // Revalidate every hour
