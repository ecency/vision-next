import { NextRequest, NextResponse } from "next/server";

/**
 * "Agentic web" read-only endpoints. Appending a format extension to the
 * canonical (bare) post URL returns that post in a clean, token-efficient form
 * for LLMs / agents / research tools, instead of the JS-heavy SPA HTML:
 *
 *   /@author/:permlink.md                → Markdown (front matter + body)
 *   /@author/:permlink.json              → structured JSON (post)
 *   /@author/:permlink.discussion.json   → JSON (full comment thread)
 *
 * Only the bare `/@author/:permlink` form is an agent endpoint — that's the
 * canonical post URL (see generate-entry-metadata / selfUrl). The community form
 * `/:category/@author/:permlink.<ext>` is deliberately NOT matched, so there is
 * a single agent URL per post (no alternate/duplicate surface).
 *
 * Implemented as a middleware rewrite (mirrors the rss.xml and social-bot
 * rewrites) so a single Route Handler under the existing entry tree serves the
 * response. Middleware runs before next.config rewrites; we inject the default
 * `created` category so the rewritten path flows through the existing
 * `/:category/:author/:permlink/:sub → /entry/...` rewrite — no config change.
 */

// Public extension → internal sub-route segment under entry/[category]/[author]/[permlink]/.
// Ordered most-specific-first: `.discussion.json` must be tested before `.json`.
const AGENT_EXTENSIONS: ReadonlyArray<readonly [string, string]> = [
  [".discussion.json", "agent-discussion"],
  [".md", "agent-md"],
  [".json", "agent-json"]
];

// The canonical bare post URL: /@author/:permlink. On-chain permlinks are
// `[a-z0-9_-]+` (lowercase alnum, hyphen, underscore — never a dot), so
// stripping a known trailing extension is unambiguous.
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

    // Only the canonical bare form is an agent endpoint. Anything else (a
    // community-form post URL, or an unrelated path like /foo.json) is left to
    // normal routing — one agent URL per post, no alternate surface.
    if (!BARE_FORM.test(base)) return null;

    // /@author/:permlink → /created/@author/:permlink/agent-*
    // `created` is the default category next.config uses for the bare form, so
    // the existing /:category/:author/:permlink/:sub rewrite resolves it.
    const url = request.nextUrl.clone();
    url.pathname = `/created${base}/${sub}`;
    return NextResponse.rewrite(url);
  }

  return null;
}
