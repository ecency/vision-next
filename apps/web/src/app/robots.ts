import { MetadataRoute } from "next";
import defaults from "@/defaults";

export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${defaults.base}/sitemap.xml`,
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
    ]
  };
}
