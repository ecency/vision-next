import { prefetchQuery } from "@/core/react-query";
import { getDiscussionQueryOptions } from "@ecency/sdk";
import {
  AGENT_CACHE_CONTROL,
  agentNotFound,
  loadIndexableEntry,
  selfUrl
} from "@/app/(dynamicPages)/entry/_helpers/agent-readable";

// Reached via the middleware rewrite of `/@author/permlink.discussion.json`.
// Serves the full comment thread (bridge.get_discussion map) as JSON.
export const dynamic = "force-dynamic"; // handler runs; CDN caches via headers

interface Props {
  params: Promise<{ category: string; author: string; permlink: string }>;
}

export async function GET(_request: Request, { params }: Props): Promise<Response> {
  try {
    const { author, permlink } = await params;

    // Gate on the root post: if the post itself is suppressed, so is its thread.
    const loaded = await loadIndexableEntry(author, permlink);
    if (!loaded) return agentNotFound();

    const discussion = await prefetchQuery(
      getDiscussionQueryOptions(loaded.entry.author, loaded.entry.permlink)
    );

    const body = JSON.stringify({
      type: "discussion",
      canonical_url: selfUrl(loaded.entry),
      source: "hive_bridge",
      content: discussion ?? {}
    });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": AGENT_CACHE_CONTROL,
        // Alternate representation of the HTML post — keep it out of the search
        // index (no duplicate-content competition). Agents fetching the URL
        // still get the content; X-Robots-Tag only governs indexing.
        "X-Robots-Tag": "noindex"
      }
    });
  } catch {
    return agentNotFound();
  }
}
