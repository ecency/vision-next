import { MetadataRoute } from "next";
import { getServerAppBase } from "@/utils/server-app-base";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getServerAppBase();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/draft/",
          "/publish/",
          "/signup/",
          "/auth/",
          "/wallet/setup-external"
        ]
      },
      {
        userAgent: "GPTBot",
        disallow: "/"
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/"
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
