import { describe, expect, it } from "vitest";
import { mergeThreadPosts } from "@/features/chat/components/thread-merge";
import type { MattermostPost } from "@/features/chat/mattermost-api";

/**
 * Regression coverage for the bug where the thread panel only showed messages
 * already loaded in the channel buffer (e.g. just the most recent reply),
 * hiding the rest of the conversation. The panel now merges the full
 * server-fetched thread with the local buffer.
 */

function makePost(id: string, createAt: number, overrides: Partial<MattermostPost> = {}): MattermostPost {
  return {
    id,
    create_at: createAt,
    message: `msg-${id}`,
    user_id: "u",
    channel_id: "c1",
    root_id: "",
    ...overrides
  } as unknown as MattermostPost;
}

describe("mergeThreadPosts", () => {
  it("includes thread posts fetched from the server that are absent from the local buffer", () => {
    const root = makePost("root", 1);
    const reply1 = makePost("r1", 2, { root_id: "root" });
    const reply2 = makePost("r2", 3, { root_id: "root" });
    // Local buffer only has the latest reply (the reported symptom).
    const local = [reply2];

    const result = mergeThreadPosts("root", [root, reply1, reply2], local);

    expect(result.map((p) => p.id)).toEqual(["root", "r1", "r2"]);
  });

  it("returns posts sorted oldest to newest and de-duplicated", () => {
    const root = makePost("root", 100);
    const reply = makePost("r1", 50, { root_id: "root" }); // intentionally out of order / older
    const result = mergeThreadPosts("root", [root, reply], [root, reply]);

    expect(result.map((p) => p.id)).toEqual(["r1", "root"]);
    expect(result).toHaveLength(2);
  });

  it("lets the local copy override the server copy (fresher websocket edit)", () => {
    const serverReply = makePost("r1", 2, { root_id: "root", message: "stale" });
    const localReply = makePost("r1", 2, { root_id: "root", message: "edited live" });

    const result = mergeThreadPosts("root", [makePost("root", 1), serverReply], [localReply]);

    expect(result.find((p) => p.id === "r1")?.message).toBe("edited live");
  });

  it("includes optimistic local thread posts not yet returned by the server", () => {
    const result = mergeThreadPosts(
      "root",
      [makePost("root", 1)],
      [makePost("pending", 5, { root_id: "root", message: "sending..." })]
    );

    expect(result.map((p) => p.id)).toEqual(["root", "pending"]);
  });

  it("ignores local posts that are not part of the thread", () => {
    const result = mergeThreadPosts(
      "root",
      [makePost("root", 1)],
      [makePost("unrelated", 2, { root_id: "other-thread" })]
    );

    expect(result.map((p) => p.id)).toEqual(["root"]);
  });
});
