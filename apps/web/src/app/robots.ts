import { MetadataRoute } from "next";
import defaults from "@/defaults";

export default function robots(): MetadataRoute.Robots {
  // AI crawlers/agents are intentionally allowed (see also the Cloudflare WAF):
  // public Hive content is open, and we publish agent-readable endpoints
  // (/@author/permlink.md|.json) advertised via /llms.txt. So no per-AI-bot
  // Disallow rules here — only the genuinely non-public/interactive paths.
  return {
    sitemap: `${defaults.base}/sitemap.xml`,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/draft/", "/publish/", "/signup/", "/auth/", "/wallet/setup-external"]
      }
    ]
  };
}
