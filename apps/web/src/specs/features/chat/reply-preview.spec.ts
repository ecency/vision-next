import { describe, expect, it } from "vitest";
import { resolveReplyPreview } from "@/features/chat/components/reply-preview";
import type { MattermostPost } from "@/features/chat/mattermost-api";

/**
 * Regression coverage for the bug where a threaded reply quoted ITSELF instead
 * of the message it replied to: when the root post was outside the loaded
 * window, the preview fell back to the current post's own text.
 */

function makePost(overrides: Partial<MattermostPost> & { id: string }): MattermostPost {
  return {
    id: overrides.id,
    message: "",
    user_id: "",
    channel_id: "c1",
    create_at: 0,
    ...overrides
  } as unknown as MattermostPost;
}

const helpers = {
  getDecodedDisplayMessage: (post: MattermostPost) => post.message,
  getDisplayName: (post: MattermostPost) => `@${post.user_id}`,
  normalizeUsername: (username?: string | null) =>
    username ? username.replace(/^@/, "") : undefined
};

describe("resolveReplyPreview", () => {
  it("never quotes the message itself when the root/parent post is not loaded", () => {
    // The reported bug: a reply whose root post is outside the loaded window.
    const reply = makePost({
      id: "reply1",
      user_id: "artgirl",
      message: "Hello @ecency any help for this? The 3 buttons are still not showing",
      root_id: "root-not-loaded",
      props: {
        parent_id: "parent-not-loaded",
        parent_username: "ecency",
        parent_message: "Sorry to hear that, which browser are you on?"
      }
    });

    const result = resolveReplyPreview(reply, new Map(), new Map(), helpers);

    expect(result.parentUsername).toBe("ecency");
    expect(result.parentMessage).toBe("Sorry to hear that, which browser are you on?");
    // Crucially, it must NOT echo the reply's own text.
    expect(result.parentMessage).not.toBe(reply.message);
  });

  it("prefers the explicit parent_id over the chronological thread heuristic", () => {
    const reply = makePost({
      id: "reply1",
      user_id: "artgirl",
      message: "thanks!",
      root_id: "root1",
      props: { parent_id: "real-parent" }
    });
    const realParent = makePost({ id: "real-parent", user_id: "ecency", message: "the actual answer" });
    const heuristicParent = makePost({ id: "other", user_id: "someone", message: "an unrelated earlier message" });

    const postsById = new Map([[realParent.id, realParent]]);
    const parentPostById = new Map([[reply.id, heuristicParent]]);

    const result = resolveReplyPreview(reply, postsById, parentPostById, helpers);

    expect(result.parentUsername).toBe("@ecency");
    expect(result.parentMessage).toBe("the actual answer");
  });

  it("falls back to the chronological heuristic when no explicit parent_id is present", () => {
    const reply = makePost({ id: "reply1", user_id: "artgirl", message: "thanks!", root_id: "root1" });
    const heuristicParent = makePost({ id: "prev", user_id: "ecency", message: "previous message in thread" });

    const result = resolveReplyPreview(reply, new Map(), new Map([[reply.id, heuristicParent]]), helpers);

    expect(result.parentUsername).toBe("@ecency");
    expect(result.parentMessage).toBe("previous message in thread");
  });

  it("uses the captured parent props (not the heuristic neighbor) when parent_id is set but the parent post isn't loaded", () => {
    // Deep in a long thread: the real parent scrolled out of the loaded window,
    // but an unrelated earlier reply IS loaded and sits in the heuristic map.
    // The explicit parent_id must win → fall through to the captured props,
    // never the neighbor.
    const reply = makePost({
      id: "reply1",
      user_id: "artgirl",
      message: "thanks for the help!",
      root_id: "root1",
      props: {
        parent_id: "real-parent-not-loaded",
        parent_username: "ecency",
        parent_message: "try clearing your cache"
      }
    });
    const heuristicNeighbor = makePost({ id: "neighbor", user_id: "someoneelse", message: "an unrelated earlier reply" });

    const result = resolveReplyPreview(reply, new Map(), new Map([[reply.id, heuristicNeighbor]]), helpers);

    expect(result.parentUsername).toBe("ecency");
    expect(result.parentMessage).toBe("try clearing your cache");
    expect(result.parentMessage).not.toBe(heuristicNeighbor.message);
  });

  it("guards against bad data where parent_id points at the post itself", () => {
    const reply = makePost({
      id: "reply1",
      user_id: "artgirl",
      message: "self referencing body",
      root_id: "root1",
      props: { parent_id: "reply1" }
    });
    const postsById = new Map([[reply.id, reply]]);

    const result = resolveReplyPreview(reply, postsById, new Map(), helpers);

    // No usable parent info → empty preview rather than quoting itself.
    expect(result.parentMessage).toBeUndefined();
    expect(result.parentUsername).toBeUndefined();
  });
});
