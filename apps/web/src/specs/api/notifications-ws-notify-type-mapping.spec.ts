import { describe, expect, it } from "vitest";
import { NotificationsWebSocket } from "@/api/notifications-ws-api";
import { NotifyTypes } from "@/enums";

/**
 * Every notification type that has a user-facing settings toggle must map to a
 * NotifyTypes value here. getNotificationType() returning null means "no
 * per-type opt-out", and the delivery gate treats null as always-allowed — so
 * an unmapped toggle-able type silently ignores the user turning it off.
 */
describe("NotificationsWebSocket.getNotificationType", () => {
  const ws = new NotificationsWebSocket();

  const TOGGLEABLE: [string, NotifyTypes][] = [
    ["vote", NotifyTypes.VOTE],
    ["mention", NotifyTypes.MENTION],
    ["follow", NotifyTypes.FOLLOW],
    ["reply", NotifyTypes.COMMENT],
    ["reblog", NotifyTypes.RE_BLOG],
    ["transfer", NotifyTypes.TRANSFERS],
    ["favorites", NotifyTypes.FAVORITES],
    ["bookmarks", NotifyTypes.BOOKMARKS],
    ["scheduled_published", NotifyTypes.SCHEDULED_PUBLISHED],
    ["delegations", NotifyTypes.DELEGATIONS],
    ["payouts", NotifyTypes.PAYOUTS],
    ["account_update", NotifyTypes.ACCOUNT_UPDATE],
    ["weekly_earnings", NotifyTypes.WEEKLY_EARNINGS]
  ];

  it.each(TOGGLEABLE)("maps %s to its NotifyTypes value", (wireType, expected) => {
    expect(ws.getNotificationType(wireType)).toBe(expected);
  });

  it("covers every type exposed in the settings dropdown", () => {
    // ALL_NOTIFY_TYPES is what the settings UI renders toggles for; each one
    // must be reachable from some wire type, otherwise its toggle is inert.
    const mapped = new Set(TOGGLEABLE.map(([, type]) => type));
    const missing = Object.values(NotifyTypes)
      .filter((t) => t !== NotifyTypes.ALLOW_NOTIFY && typeof t === "number")
      .filter((t) => !mapped.has(t as NotifyTypes));
    expect(missing).toEqual([]);
  });

  it("returns null for types with no per-type toggle", () => {
    // These are intentionally always-allowed, gated only by the global switch.
    expect(ws.getNotificationType("checkins")).toBeNull();
    expect(ws.getNotificationType("monthly_posts")).toBeNull();
    expect(ws.getNotificationType("spin")).toBeNull();
    expect(ws.getNotificationType("inactive")).toBeNull();
  });
});

/**
 * getBody() returning "" makes the delivery path drop the notification, so a
 * toggle-able type without a body branch is silently undeliverable even when
 * the user has it enabled. i18next is mocked to echo the key.
 */
describe("NotificationsWebSocket body for account_update", () => {
  const getBody = (extra: unknown) =>
    (NotificationsWebSocket as any).getBody({ type: "account_update", source: "alice", extra });

  it("is never empty, even with no extra", () => {
    expect(getBody(undefined)).toBe("notifications.account-update-str");
  });

  it("ranks a changed key above a granted authority", () => {
    const body = getBody({
      keys_changed: ["owner"],
      accounts_granted: [{ authority: "posting", account: "bob" }]
    });
    expect(body).toBe("notifications.account-update-owner-key");
  });

  it.each([
    ["owner", "notifications.account-update-owner-key"],
    ["active", "notifications.account-update-active-key"],
    ["posting", "notifications.account-update-posting-key"]
  ])("maps a changed %s key to its own message", (key, expected) => {
    expect(getBody({ keys_changed: [key] })).toBe(expected);
  });

  it.each([
    ["owner", "notifications.account-update-owner-authority"],
    ["active", "notifications.account-update-active-authority"],
    ["posting", "notifications.account-update-posting-authority"]
  ])("maps a granted %s authority to its own message", (authority, expected) => {
    expect(getBody({ accounts_granted: [{ authority, account: "bob" }] })).toBe(expected);
  });
});
