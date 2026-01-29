import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
    ]
  };
}
