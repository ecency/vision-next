import {
  agentNotFound,
  agentResponse,
  loadIndexableEntry,
  renderEntryMarkdown
} from "@/app/(dynamicPages)/entry/_helpers/agent-readable";

// Reached via the middleware rewrite of `/@author/permlink.md`. Serves the post
// as a clean Markdown document (YAML front matter + raw on-chain body).
export const dynamic = "force-dynamic"; // handler runs; CDN caches via headers

interface Props {
  params: Promise<{ category: string; author: string; permlink: string }>;
}

export async function GET(_request: Request, { params }: Props): Promise<Response> {
  try {
    const { author, permlink } = await params;
    const loaded = await loadIndexableEntry(author, permlink);
    if (!loaded) return agentNotFound();

    return agentResponse(renderEntryMarkdown(loaded.entry), "text/markdown; charset=utf-8");
  } catch {
    return agentNotFound();
  }
}
