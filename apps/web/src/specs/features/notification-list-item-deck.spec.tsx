import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiNotification } from "@/entities";

// The row previously gated five behaviors on a `deck` field that nothing ever
// set, so deck columns silently got the wrong ones. These lock in what a deck
// row actually does, so the flag cannot rot back into a no-op.

const toggleUiProp = vi.fn();
const mutateAsync = vi.fn();

vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: any) => selector({ toggleUiProp })
}));

vi.mock("@/api/sdk-mutations", () => ({
  useMarkNotificationsMutation: () => ({ mutateAsync })
}));

vi.mock("@/features/shared", () => ({
  // Stand in for the real link so a click drives the row's afterClick handler.
  ProfileLink: ({ children, afterClick }: any) => (
    <button type="button" onClick={afterClick}>
      {children}
    </button>
  ),
  UserAvatar: () => <span />,
  // Pulled in by the per-type row components (e.g. NotificationReplyType).
  EntryLink: ({ children }: any) => <span>{children}</span>
}));

vi.mock("@ecency/render-helper", async () => ({
  ...(await vi.importActual("@ecency/render-helper")),
  proxifyImageSrc: (url: string) => url
}));

// The global @/utils mock only exports random/getAccessToken; the per-type row
// components reach for more than that.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// eslint-disable-next-line import/first
import { NotificationListItem } from "@/features/shared/notifications/notification-list-item";

const reply = {
  id: "rr-1",
  type: "reply",
  source: "alice",
  read: 0,
  timestamp: "2026-07-13T10:00:00+00:00",
  ts: 1,
  gk: "today",
  gkf: false,
  author: "alice",
  permlink: "re-post",
  title: "",
  body: "nice post",
  json_metadata: "{}",
  metadata: {},
  parent_author: "bob",
  parent_permlink: "post",
  parent_title: "The post",
  parent_img_url: "https://images.ecency.com/p/cover.jpg"
} as unknown as ApiNotification;

const renderRow = (isDeck: boolean) =>
  render(<NotificationListItem notification={reply} isDeck={isDeck} />);

describe("NotificationListItem in a deck column", () => {
  beforeEach(() => {
    toggleUiProp.mockClear();
    mutateAsync.mockClear();
  });

  it("drops the thumbnail, which the narrow column cannot spare the width for", () => {
    expect(renderRow(true).container.querySelector(".item-image")).toBeNull();
    expect(renderRow(false).container.querySelector(".item-image")).not.toBeNull();
  });

  it("uses compact padding and a narrow control column", () => {
    const deck = renderRow(true).container;
    expect(deck.querySelector(".item-inner")?.className).toContain("p-2");
    expect(deck.querySelector(".item-control")?.className).toContain("item-control-deck");

    const normal = renderRow(false).container;
    expect(normal.querySelector(".item-inner")?.className).not.toContain("p-2");
    expect(normal.querySelector(".item-control")?.className).not.toContain("item-control-deck");
  });

  it("still highlights an unread row, which the old dead flag would have removed", () => {
    expect(renderRow(true).container.querySelector(".list-item")?.className).toContain("not-read");
  });

  it("still offers the mark-read dot, which the old dead flag would have removed", () => {
    const dot = renderRow(true).container.querySelector(".mark-read");
    expect(dot).not.toBeNull();

    fireEvent.click(dot!);
    expect(mutateAsync).toHaveBeenCalledWith({ id: "rr-1" });
  });

  // The row's outer div carries role="button" for the select checkbox, so reach
  // for the real <button> the mocked ProfileLink renders.
  const clickSourceLink = (container: HTMLElement) =>
    fireEvent.click(container.querySelectorAll("button")[0]);

  it("still marks the notification read on click, which the old dead flag would have stopped", () => {
    clickSourceLink(renderRow(true).container);
    expect(mutateAsync).toHaveBeenCalledWith({ id: "rr-1" });
  });

  it("does not pop the navbar notifications dropdown open on top of the deck", () => {
    clickSourceLink(renderRow(true).container);
    expect(toggleUiProp).not.toHaveBeenCalled();
  });

  it("still toggles the dropdown outside a deck, where the row lives inside it", () => {
    clickSourceLink(renderRow(false).container);
    expect(toggleUiProp).toHaveBeenCalledWith("notifications");
  });
});
