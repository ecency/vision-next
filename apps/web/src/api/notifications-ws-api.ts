import defaults from "@/defaults";
import { ActiveUser, WsNotification } from "@/entities";
import { NotifyTypes } from "@/enums";
import i18next from "i18next";
import { playNotificationSound, requestNotificationPermission } from "@/utils";
import { info } from "@/features/shared/feedback/feedback-events";
import logo from "@/assets/img/logo-circle.svg";

declare var window: Window & {
  nws?: WebSocket;
};

const BURST_WINDOW_MS = 500;

export class NotificationsWebSocket {
  private activeUser: ActiveUser | null = null;
  private hasNotifications = false;
  private hasUiNotifications = false;
  private onMessageCallback: (() => void) | null = null;
  private enabledNotifyTypes: NotifyTypes[] = [];
  private isConnected = false;
  private isConnecting = false;
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingMessages: string[] = [];
  private burstTimer: ReturnType<typeof setTimeout> | null = null;

  private static getBody(data: WsNotification) {
    const { source } = data;
    switch (data.type) {
      case "vote":
        return i18next.t("notification.voted", { source });
      case "mention":
        return data.extra.is_post === 1
          ? i18next.t("notification.mention-post", { source })
          : i18next.t("notification.mention-comment", { source });
      case "favorites":
        return i18next.t("notification.favorite", { source });
      case "bookmarks":
        return i18next.t("notification.bookmark", { source });
      case "follow":
        return i18next.t("notification.followed", { source });
      case "reply":
        return i18next.t("notification.replied", { source });
      case "reblog":
        return i18next.t("notification.reblogged", { source });
      case "transfer":
        return i18next.t("notification.transfer", { source, amount: data.extra.amount });
      case "delegations":
        return i18next.t("notification.delegations", { source, amount: data.extra.amount });
      case "checkins": {
        const count = Number(data.extra?.count ?? 0);
        return i18next.t("notification.checkins", {
          count,
          suffix: count === 1 ? "" : "s"
        });
      }
      case "checkin": {
        const count = Number(data.extra?.count ?? 0);
        return i18next.t("notification.checkins", {
          count,
          suffix: count === 1 ? "" : "s"
        });
      }
      case "payouts": {
        const amount = data.extra?.amount;
        const amountUsd = data.extra?.amount_usd;
        const title = data.extra?.title;
        const body = amountUsd && amount
          ? i18next.t("notification.payouts-amount-usd", { amount_usd: amountUsd, amount })
          : amount
            ? i18next.t("notification.payouts-amount", { amount })
            : i18next.t("notification.payouts");

        return title ? i18next.t("notification.payouts-title", { body, title }) : body;
      }
      case "monthly-posts": {
        const count = Number(data.extra?.count ?? 0);
        return i18next.t("notification.monthly-posts", {
          count,
          suffix: count === 1 ? "" : "s"
        });
      }
      case "monthly_posts": {
        const count = Number(data.extra?.count ?? 0);
        return i18next.t("notification.monthly-posts", {
          count,
          suffix: count === 1 ? "" : "s"
        });
      }
      case "weekly_earnings": {
        const total = data.extra?.total_usd ?? "0";
        return i18next.t("notification.weekly-earnings-short", { total });
      }
      default:
        return "";
    }
  }

  public async connect() {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    if (!this.activeUser) {
      this.disconnect();
      return;
    }

    if (window.nws !== undefined) {
      return;
    }

    this.isConnecting = true;

    if ("Notification" in window) {
      try {
        await requestNotificationPermission();
      } catch {
        // The permission prompt can throw in some environments (sandboxed
        // iframe, extension conflicts). Permission isn't required for the
        // socket, and swallowing here keeps the rejection from leaving
        // isConnecting stuck true — which would block every future connect().
      }
    }

    // Re-check after the async permission prompt: the user may have logged out,
    // or another connect() call may have already created the socket.
    const user = this.activeUser;
    if (!user || window.nws !== undefined) {
      this.isConnecting = false;
      return;
    }

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${defaults.nwsServer}/ws?user=${user.username}`);
    } catch (error) {
      // The constructor can throw synchronously (e.g. a malformed URL). Reset
      // the flag so a later attempt can still reconnect instead of being
      // short-circuited by the isConnecting guard.
      this.isConnecting = false;
      console.error("nws failed to connect", error);
      return;
    }
    // Track the socket this instance created so disconnect() only ever tears
    // down its own connection — never another wrapper's (e.g. NotificationHandler).
    this.socket = socket;
    window.nws = socket;
    socket.onopen = () => {
      console.log("nws connected");
      this.isConnecting = false;
      this.isConnected = true;
    };
    socket.onmessage = (e) => this.onMessageReceive(e);
    socket.onclose = () => {
      console.log("nws disconnected");

      this.isConnected = false;
      this.isConnecting = false;
      if (this.socket === socket) {
        this.socket = null;
      }
      if (window.nws === socket) {
        window.nws = undefined;
      }

      // A deliberate disconnect() detaches this handler, so reaching here always
      // means an unintended close — a network drop or a server-side close,
      // including a clean close frame on server restart. Reconnect while we
      // still have an active user; logout/switch clears it so this won't fire.
      if (this.activeUser) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    console.log("nws trying to reconnect");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  public disconnect() {
    if (this.burstTimer) {
      clearTimeout(this.burstTimer);
      this.burstTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingMessages.length = 0;
    this.isConnecting = false;

    const socket = this.socket;
    if (socket) {
      // Only tear down the socket THIS instance created. A secondary wrapper
      // (e.g. NotificationHandler) never owns `this.socket`, so it can no longer
      // close the global provider's live connection. Detaching the handlers
      // first stops this deliberate close from triggering the reconnect path,
      // and clearing the shared ref keeps a socket caught mid-CONNECTING from
      // being orphaned (an orphaned `window.nws` would block every future
      // connect()).
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      try {
        socket.close();
      } catch {
        // ignore — socket may already be closing/closed
      }
      if (window.nws === socket) {
        window.nws = undefined;
      }
      this.socket = null;
    }
    this.isConnected = false;
  }

  public withActiveUser(activeUser: ActiveUser | null) {
    this.activeUser = activeUser;
    return this;
  }

  public withToggleUi(
    toggle: (type: "login" | "notifications", value?: boolean) => void
  ) {
    this.toggleUiProp = toggle;
    return this;
  }

  public setHasNotifications(has: boolean) {
    this.hasNotifications = has;
    return this;
  }

  public withCallbackOnMessage(cb: () => void) {
    this.onMessageCallback = cb;
    return this;
  }

  public setHasUiNotifications(has: boolean) {
    this.hasUiNotifications = has;
    return this;
  }

  public setEnabledNotificationsTypes(value: NotifyTypes[]) {
    this.enabledNotifyTypes = value;
    return this;
  }

  public getNotificationType(value: string): NotifyTypes | null {
    switch (value) {
      case "vote":
        return NotifyTypes.VOTE;
      case "mention":
        return NotifyTypes.MENTION;
      case "follow":
        return NotifyTypes.FOLLOW;
      case "reply":
        return NotifyTypes.COMMENT;
      case "reblog":
        return NotifyTypes.RE_BLOG;
      case "transfer":
        return NotifyTypes.TRANSFERS;
      case "favorites":
        return NotifyTypes.FAVORITES;
      case "bookmarks":
        return NotifyTypes.BOOKMARKS;
      default:
        // Types without a user-facing settings toggle (delegations, checkins,
        // payouts, monthly-posts, weekly-earnings) have no per-type opt-out, so
        // they're treated as always-allowed — still gated by the global toggle.
        return null;
    }
  }

  private toggleUiProp: (type: "login" | "notifications", value?: boolean) => void = () => {};

  private async flushPendingNotifications() {
    const messages = this.pendingMessages.splice(0);
    if (messages.length === 0) return;

    const toastBody =
      messages.length === 1
        ? messages[0]
        : i18next.t("notifications.new-notifications-batch", { count: messages.length });

    const permissionGranted =
      "Notification" in window && Notification.permission === "granted";

    // The websocket only fires while the tab is open, and desktop browsers/OSes
    // routinely suppress page-created OS notifications for a focused tab — so an
    // OS notification here would fire into the void. Use it only when the tab is
    // actually backgrounded; in the foreground show the in-app toast, which
    // renders reliably. Delivery is already gated upstream by the user's
    // settings (allows_notify + per-type), so reaching here means they opted in
    // — the in-app toast doesn't need OS permission, it's in-page feedback.
    const inBackground = typeof document !== "undefined" && document.hidden;

    if (permissionGranted && inBackground) {
      // `new Notification` can throw on some mobile browsers (requires a service
      // worker); the caller's `.catch` handles that gracefully.
      const notification = new Notification(i18next.t("notification.popup-title"), {
        body: toastBody,
        icon: logo
      });
      notification.onclick = () => {
        window.focus();
        if (!this.hasUiNotifications) {
          this.toggleUiProp("notifications");
        }
      };
    } else {
      info(toastBody);
    }

    // Play the sound only when OS permission was granted, so we don't add sound
    // for users who declined notifications at the browser level.
    if (permissionGranted) {
      playNotificationSound();
    }
  }

  private queueNotification(msg: string) {
    this.pendingMessages.push(msg);

    // Start a fixed-window timer on the first message only.
    // Subsequent messages within the window are batched without resetting the timer.
    if (!this.burstTimer) {
      this.burstTimer = setTimeout(() => {
        this.burstTimer = null;
        this.flushPendingNotifications().catch((e) => console.warn("notification flush failed", e));
      }, BURST_WINDOW_MS);
    }
  }

  private async onMessageReceive(evt: MessageEvent) {
    let data: WsNotification;
    try {
      const parsed: unknown = JSON.parse(evt.data);
      if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
        return;
      }
      data = parsed as WsNotification;
    } catch {
      return;
    }

    // Always trigger data refresh regardless of notification display settings
    try {
      await Promise.resolve(this.onMessageCallback?.());
    } catch (error) {
      console.error("notifications websocket callback failed", error);
    }

    const msg = NotificationsWebSocket.getBody(data);
    const messageNotifyType = this.getNotificationType(data.type);
    // For a toggle-able type, notify only when it's in the user's enabled set.
    // An empty/unset list means "not configured" → allow all (a full opt-out is
    // handled by the global toggle via hasNotifications), so existing users
    // whose saved notify_types is still [] aren't silenced. Types without a
    // toggle (messageNotifyType === null) have no per-type opt-out and pass.
    const allowedToNotify =
      messageNotifyType !== null && this.enabledNotifyTypes.length > 0
        ? this.enabledNotifyTypes.includes(messageNotifyType)
        : true;

    if (!msg || !this.hasNotifications || !allowedToNotify) {
      return;
    }

    this.queueNotification(msg);
  }
}
