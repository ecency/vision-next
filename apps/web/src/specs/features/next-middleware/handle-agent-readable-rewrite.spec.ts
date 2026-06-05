import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { handleAgentReadableRewrite } from "@/features/next-middleware";

function requestFor(rawPath: string) {
  return new NextRequest(`https://ecency.com${rawPath}`);
}

// NextResponse.rewrite encodes the internal destination in this header.
function rewriteTarget(rawPath: string): string | null {
  const res = handleAgentReadableRewrite(requestFor(rawPath));
  if (!res) return null;
  const header = res.headers.get("x-middleware-rewrite");
  if (!header) return null;
  return new URL(header, "https://ecency.com").pathname;
}

describe("handleAgentReadableRewrite", () => {
  it("rewrites .md on the bare /@author/permlink form via the default `created` category", () => {
    expect(rewriteTarget("/@alice/my-post.md")).toBe("/created/@alice/my-post/agent-md");
  });

  it("rewrites .json on the bare form to the agent-json sub-route", () => {
    expect(rewriteTarget("/@alice/my-post.json")).toBe("/created/@alice/my-post/agent-json");
  });

  it("prefers .discussion.json over .json (most-specific extension first)", () => {
    expect(rewriteTarget("/@alice/my-post.discussion.json")).toBe(
      "/created/@alice/my-post/agent-discussion"
    );
  });

  it("matches permlinks containing underscores", () => {
    expect(rewriteTarget("/@alice/re-bob-my_post-20240601.md")).toBe(
      "/created/@alice/re-bob-my_post-20240601/agent-md"
    );
  });

  it("does NOT treat the community form as an agent endpoint (single canonical URL per post)", () => {
    expect(handleAgentReadableRewrite(requestFor("/hive-101010/@alice/my-post.md"))).toBeNull();
    expect(
      handleAgentReadableRewrite(requestFor("/hive-101010/@alice/my-post.discussion.json"))
    ).toBeNull();
  });

  it("leaves a normal post URL (no extension) untouched", () => {
    expect(handleAgentReadableRewrite(requestFor("/hive-101010/@alice/my-post"))).toBeNull();
    expect(handleAgentReadableRewrite(requestFor("/@alice/my-post"))).toBeNull();
  });

  it("does not hijack a non-post path that happens to end in .json/.md", () => {
    expect(handleAgentReadableRewrite(requestFor("/sitemap.json"))).toBeNull();
    expect(handleAgentReadableRewrite(requestFor("/foo/bar.md"))).toBeNull();
    expect(handleAgentReadableRewrite(requestFor("/llms.txt"))).toBeNull();
  });
});
