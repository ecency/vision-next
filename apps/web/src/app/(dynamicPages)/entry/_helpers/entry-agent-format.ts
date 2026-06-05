import defaults from "@/defaults";
import type { Entry } from "@/entities";

/**
 * Pure formatters for the agent-readable post endpoints. Deliberately free of
 * data-fetching / Redis imports so the output contract is trivially unit-tested.
 */

export function selfUrl(entry: Pick<Entry, "author" | "permlink">): string {
  return `${defaults.base}/@${entry.author}/${entry.permlink}`;
}

// YAML scalars/sequences via JSON: YAML is a superset of JSON for these, so a
// JSON-encoded value is always a valid (and correctly escaped) YAML node.
function yamlLine(key: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return `${key}: ${JSON.stringify(value)}`;
  }
  return `${key}: ${JSON.stringify(value)}`;
}

function appName(app: unknown): string | undefined {
  if (typeof app === "string") return app;
  if (app && typeof app === "object") {
    const name = (app as { name?: unknown }).name;
    if (typeof name === "string") return name;
  }
  return undefined;
}

/**
 * The post as a self-contained Markdown document: YAML front matter + the raw
 * on-chain body. The body is intentionally NOT re-rendered to HTML — raw Hive
 * markdown is the most token-efficient form for LLMs to process.
 */
export function renderEntryMarkdown(entry: Entry): string {
  const tags = Array.isArray(entry.json_metadata?.tags) ? entry.json_metadata?.tags : undefined;
  const isComment = !!entry.parent_author;

  const front = [
    yamlLine("title", entry.title || undefined),
    yamlLine("author", `@${entry.author}`),
    yamlLine("permlink", entry.permlink),
    yamlLine("type", isComment ? "comment" : "post"),
    yamlLine("community", entry.community || undefined),
    yamlLine("community_title", entry.community_title || undefined),
    yamlLine("category", entry.category || undefined),
    yamlLine("tags", tags),
    yamlLine("app", appName(entry.json_metadata?.app)),
    yamlLine("created", entry.created),
    yamlLine("updated", entry.updated || entry.last_update || undefined),
    yamlLine("payout", entry.payout),
    yamlLine("canonical_url", selfUrl(entry))
  ].filter(Boolean);

  const heading = entry.title ? `# ${entry.title}\n\n` : "";
  return `---\n${front.join("\n")}\n---\n\n${heading}${entry.body}\n`;
}
