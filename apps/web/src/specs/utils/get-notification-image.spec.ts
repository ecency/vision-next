import { describe, expect, it, vi } from "vitest";
import { getNotificationImage } from "@/features/shared/notifications/utils";

vi.mock("@ecency/render-helper", () => ({
  proxifyImageSrc: (url: string, w: number, h: number) => `proxy(${w}x${h}):${url}`
}));

const IMG = "https://images.ecency.com/p/original.jpg";

const notification = (props: Record<string, unknown>) => props as any;

describe("getNotificationImage", () => {
  it("uses the parent post image for a reply, which is the post that was replied to", () => {
    const url = getNotificationImage(
      notification({
        type: "reply",
        parent_img_url: IMG,
        img_url: "https://images.ecency.com/p/the-reply-itself.jpg"
      })
    );

    expect(url).toBe(`proxy(96x96):${IMG}`);
  });

  it.each(["mention", "reblog", "scheduled_published", "favorites", "payouts"])(
    "uses img_url for a %s",
    (type) => {
      expect(getNotificationImage(notification({ type, img_url: IMG }))).toBe(`proxy(96x96):${IMG}`);
    }
  );

  it("uses the parent post image for a bookmark, i.e. the post that was bookmarked", () => {
    // A bookmarks notification fires when someone comments on a post you saved,
    // so the useful image is the saved post's, not the comment's.
    const url = getNotificationImage(
      notification({
        type: "bookmarks",
        parent_img_url: IMG,
        img_url: "https://images.ecency.com/p/the-comment.jpg"
      })
    );

    expect(url).toBe(`proxy(96x96):${IMG}`);
  });

  it("shows no thumbnail for votes, which would just repeat the user's own post", () => {
    expect(getNotificationImage(notification({ type: "vote", img_url: IMG }))).toBeNull();
    expect(getNotificationImage(notification({ type: "unvote", img_url: IMG }))).toBeNull();
  });

  it("shows no thumbnail for types that carry no post image", () => {
    expect(getNotificationImage(notification({ type: "follow" }))).toBeNull();
    expect(getNotificationImage(notification({ type: "transfer", amount: "1.000 HIVE" }))).toBeNull();
  });

  it("handles a missing or null image, which the API allows on every type", () => {
    expect(getNotificationImage(notification({ type: "mention", img_url: null }))).toBeNull();
    expect(getNotificationImage(notification({ type: "reply", parent_img_url: null }))).toBeNull();
    expect(getNotificationImage(notification({ type: "mention" }))).toBeNull();
  });

  it("proxies the raw url down rather than fetching the full-size original", () => {
    // The API returns the post's json_metadata image, which can be many MB.
    expect(getNotificationImage(notification({ type: "mention", img_url: IMG }))).toContain(
      "proxy(96x96)"
    );
  });

  it("survives a malformed notification", () => {
    expect(getNotificationImage(null as any)).toBeNull();
    expect(getNotificationImage(undefined as any)).toBeNull();
    expect(getNotificationImage(notification({}))).toBeNull();
    expect(
      getNotificationImage(notification({ type: "mention", img_url: { nested: "object" } }))
    ).toBeNull();
  });
});
