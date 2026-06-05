import { NextRequest, NextResponse } from "next/server";

/**
 * "Agentic web" read-only endpoints. Appending a format extension to any public
 * post URL returns that post in a clean, token-efficient form for LLMs / agents
 * / research tools, instead of the JS-heavy SPA HTML:
 *
 *   /:category/@author/:permlink.md                → Markdown (front matter + body)
 *   /:category/@author/:permlink.json              → structured JSON (post)
 *   /:category/@author/:permlink.discussion.json   → JSON (full comment thread)
 *
 * The bare `/@author/:permlink.<ext>` form is supported too.
 *
 * Implemented as a middleware rewrite (mirrors the rss.xml and social-bot
 * rewrites) so a single Route Handler under the existing entry tree serves the
 * response. Middleware runs before next.config rewrites, so the rewritten
 * `/.../:permlink/agent-*` path flows through the existing
 * `/:category/:author/:permlink/:sub → /entry/...` rewrite — no config change.
 */

// Public extension → internal sub-route segment under entry/[category]/[author]/[permlink]/.
// Ordered most-specific-first: `.discussion.json` must be tested before `.json`.
const AGENT_EXTENSIONS: ReadonlyArray<readonly [string, string]> = [
  [".discussion.json", "agent-discussion"],
  [".md", "agent-md"],
  [".json", "agent-json"]
];

// Post URL forms. On-chain permlinks are `[a-z0-9_-]+` (lowercase alnum, hyphen,
// underscore — never a dot), so stripping a known trailing extension is
// unambiguous.
//   /:category/@author/:permlink   (community / category form)
const CATEGORY_FORM = /^\/[^/]+\/@[^/]+\/[a-z0-9_-]+$/i;
//   /@author/:permlink             (bare form)
const BARE_FORM = /^\/@[^/]+\/[a-z0-9_-]+$/i;

/**
 * If the request targets an agent-readable post endpoint, returns the rewrite to
 * the internal Route Handler; otherwise null (leave routing untouched).
 */
export function handleAgentReadableRewrite(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;

  for (const [ext, sub] of AGENT_EXTENSIONS) {
    if (!path.endsWith(ext)) continue;

    const base = path.slice(0, -ext.length);
    let target: string | null = null;

    if (CATEGORY_FORM.test(base)) {
      // /:category/@author/:permlink → /:category/@author/:permlink/agent-*
      target = `${base}/${sub}`;
    } else if (BARE_FORM.test(base)) {
      // /@author/:permlink → /created/@author/:permlink/agent-*
      // `created` is the default category next.config uses for the bare form,
      // so the existing /:category/:author/:permlink/:sub rewrite resolves it.
      target = `/created${base}/${sub}`;
    }

    // Matched an extension but not a post URL (e.g. /foo.json) — don't hijack it.
    if (!target) return null;

    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  return null;
}
