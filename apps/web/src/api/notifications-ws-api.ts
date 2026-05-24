import defaults from "@/defaults";
import { ActiveUser, WsNotification } from "@/entities";
import { NotifyTypes } from "@/enums";
import i18next from "i18next";
import { playNotificationSound, requestNotificationPermission } from "@/utils";
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
      await requestNotificationPermission();
    }

    // Re-check after the async permission prompt: the user may have logged out,
    // or another connect() call may have already created the socket.
    const user = this.activeUser;
    if (!user || window.nws !== undefined) {
      this.isConnecting = false;
      return;
    }

    const socket = new WebSocket(`${defaults.nwsServer}/ws?user=${user.username}`);
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

    // Respect the browser notification permission. If the user hasn't granted
    // it, stay completely silent — no popup, no sound, no auto-opening the
    // notifications panel. The unread-count badge already refreshed in the
    // background via the on-message callback. Forcing in-app toasts or sounds
    // on people who declined notifications would annoy exactly the users who
    // opted out. We read the current permission here (set once at connect time)
    // rather than re-requesting it, so a message never triggers a prompt.
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const toastBody =
      messages.length === 1
        ? messages[0]
        : i18next.t("notifications.new-notifications-batch", { count: messages.length });

    playNotificationSound();

    // `new Notification` can throw on some mobile browsers (requires a service
    // worker); the caller's `.catch` handles that gracefully.
    const notification = new Notification(i18next.t("notification.popup-title"), {
      body: toastBody,
      icon: logo
    });

    notification.onclick = () => {
      if (!this.hasUiNotifications) {
        this.toggleUiProp("notifications");
      }
    };
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
    // For a type the user can toggle, notify only if it's in their enabled set
    // — so an empty set means "none", not "all". Types without a toggle
    // (messageNotifyType === null) have no per-type opt-out and are allowed.
    const allowedToNotify =
      messageNotifyType !== null
        ? this.enabledNotifyTypes.includes(messageNotifyType)
        : true;

    if (!msg || !this.hasNotifications || !allowedToNotify) {
      return;
    }

    this.queueNotification(msg);
  }
}
