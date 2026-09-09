import { describe, expect, it } from "vitest";
import { buildCommentOp } from "./content";

const meta = { tags: ["ecency"], app: "ecency/3.0.0-vision" };

describe("buildCommentOp", () => {
  it("builds a reply operation", () => {
    const [name, payload] = buildCommentOp(
      "alice",
      "re-bob-20260909t120000000z",
      "bob",
      "my-post",
      "",
      "hello",
      meta
    ) as any;

    expect(name).toBe("comment");
    expect(payload).toMatchObject({
      author: "alice",
      parent_author: "bob",
      parent_permlink: "my-post",
      body: "hello"
    });
    expect(payload.json_metadata).toBe(JSON.stringify(meta));
  });

  it("keeps the empty parent_permlink of a root post, which is not 'missing'", () => {
    expect(() =>
      buildCommentOp("alice", "my-post", "", "", "Title", "body", meta)
    ).not.toThrow();
  });

  // This builder is the single validation point for create, update and
  // cross-post. A per-hook copy would only cover one of the three.
  it.each([
    ["author", ["", "p", "", "hive-125125", "", "body"]],
    ["permlink", ["alice", "", "", "hive-125125", "", "body"]],
    ["body", ["alice", "p", "", "hive-125125", "", ""]]
  ])("names %s when it is missing", (field, args) => {
    expect(() => buildCommentOp(...(args as [any, any, any, any, any, any]), meta)).toThrow(
      `[SDK][buildCommentOp] Missing required parameters: ${field}`
    );
  });

  it("names every missing field at once", () => {
    expect(() => buildCommentOp("", "", "", undefined as any, "", "", meta)).toThrow(
      "[SDK][buildCommentOp] Missing required parameters: author, permlink, parentPermlink, body"
    );
  });
});
