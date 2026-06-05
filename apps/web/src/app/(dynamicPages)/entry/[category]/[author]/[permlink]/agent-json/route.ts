import {
  agentNotFound,
  agentResponse,
  loadIndexableEntry,
  selfUrl
} from "@/app/(dynamicPages)/entry/_helpers/agent-readable";

// Reached via the middleware rewrite of `/@author/permlink.json`. Serves the
// post as structured JSON in a small, stable envelope.
export const dynamic = "force-dynamic"; // handler runs; CDN caches via headers

interface Props {
  params: Promise<{ category: string; author: string; permlink: string }>;
}

export async function GET(_request: Request, { params }: Props): Promise<Response> {
  try {
    const { author, permlink } = await params;
    const loaded = await loadIndexableEntry(author, permlink);
    if (!loaded) return agentNotFound();

    const body = JSON.stringify({
      type: loaded.entry.parent_author ? "comment" : "post",
      canonical_url: selfUrl(loaded.entry),
      source: loaded.source,
      content: loaded.entry
    });

    return agentResponse(body, "application/json; charset=utf-8");
  } catch {
    return agentNotFound();
  }
}
