import { QueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    mmWebSocket?: MattermostWebSocket;
  }
}

interface MattermostWSEvent {
  event: string;
  data: {
    channel_id?: string;
    user_id?: string;
    post?: any;
    post_id?: string;
    [key: string]: any;
  };
  broadcast: {
    channel_id?: string;
    user_id?: string;
    [key: string]: any;
  };
  seq?: number;
}

export class MattermostWebSocket {
  private ws: WebSocket | null = null;
  private channelId: string | null = null;
  private token: string | null = null;
  private connectionState: "disconnected" | "connecting" | "connected" | "error" = "disconnected";
  private queryClient: QueryClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private onConnectionChangeCallback: ((active: boolean) => void) | null = null;
  private onTypingCallback: ((userId: string) => void) | null = null;
  private typingThrottle = new Map<string, number>();
  private readonly TYPING_THROTTLE_MS = 3000;
  private isConnected = false;

  // Builder pattern methods
  public withChannel(channelId: string): this {
    this.channelId = channelId;
    return this;
  }

  public withToken(token: string): this {
    this.token = token;
    return this;
  }

  public withQueryClient(client: QueryClient): this {
    this.queryClient = client;
    return this;
  }

  public onConnectionChange(callback: (active: boolean) => void): this {
    this.onConnectionChangeCallback = callback;
    return this;
  }

  public onTyping(callback: (userId: string) => void): this {
    this.onTypingCallback = callback;
    return this;
  }

  // Connection management
  public async connect(): Promise<void> {
    if (this.isConnected || this.connectionState === "connecting") {
      return;
    }

    if (!this.token) {
      console.error("Cannot connect to Mattermost WebSocket: no token provided");
      return;
    }

    this.connectionState = "connecting";

    try {
      const wsUrl = `/api/mattermost/websocket?token=${this.token}`;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const fullUrl = `${protocol}//${window.location.host}${wsUrl}`;

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log("Mattermost WebSocket connected");
        this.isConnected = true;
        this.connectionState = "connected";
        this.reconnectAttempts = 0;
        this.onConnectionChangeCallback?.(true);

        // Start ping interval to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: MattermostWSEvent = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("Mattermost WebSocket error:", error);
        this.connectionState = "error";
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log("Max reconnect attempts reached, falling back to polling");
          this.onConnectionChangeCallback?.(false);
        }
      };

      this.ws.onclose = (evt: CloseEvent) => {
        console.log("Mattermost WebSocket disconnected");
        this.isConnected = false;
        this.connectionState = "disconnected";
        this.stopPingInterval();

        if (!evt.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Auto-reconnect after 2 seconds
          console.log("Attempting to reconnect...");
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 2000);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.onConnectionChangeCallback?.(false);
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.connectionState = "error";
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onConnectionChangeCallback?.(false);
      }
    }
  }

  public disconnect(): void {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop ping interval
    this.stopPingInterval();

    // Close WebSocket
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.connectionState = "disconnected";
    this.onConnectionChangeCallback?.(false);
  }

  // Event handlers
  private handleMessage(message: MattermostWSEvent): void {
    switch (message.event) {
      case "hello":
        this.handleHello(message);
        break;
      case "posted":
        this.handlePosted(message);
        break;
      case "post_edited":
        this.handlePostEdited(message);
        break;
      case "post_deleted":
        this.handlePostDeleted(message);
        break;
      case "typing":
        this.handleTyping(message);
        break;
      case "reaction_added":
      case "reaction_removed":
        this.handleReaction(message);
        break;
      case "channel_viewed":
        this.handleChannelViewed(message);
        break;
      case "user_added":
      case "user_removed":
        this.handleUserChange(message);
        break;
      default:
        // Log unknown events for debugging
        // console.log("Unknown WebSocket event:", message.event);
        break;
    }
  }

  private handleHello(message: MattermostWSEvent): void {
    console.log("Mattermost WebSocket authenticated");
  }

  private handlePosted(message: MattermostWSEvent): void {
    const channelId = message.broadcast?.channel_id;
    if (!channelId || !this.queryClient) return;

    // Invalidate queries to trigger refetch
    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-posts-infinite", channelId]
    });

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-unread"]
    });

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-channels"]
    });
  }

  private handlePostEdited(message: MattermostWSEvent): void {
    const channelId = message.broadcast?.channel_id;
    if (!channelId || !this.queryClient) return;

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-posts-infinite", channelId]
    });
  }

  private handlePostDeleted(message: MattermostWSEvent): void {
    const channelId = message.broadcast?.channel_id;
    if (!channelId || !this.queryClient) return;

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-posts-infinite", channelId]
    });

    // Also invalidate pinned posts in case a pinned message was deleted
    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-pinned-posts", channelId]
    });
  }

  private handleTyping(message: MattermostWSEvent): void {
    const userId = message.data?.user_id;
    if (!userId || !this.onTypingCallback) return;

    this.onTypingCallback(userId);
  }

  private handleReaction(message: MattermostWSEvent): void {
    const channelId = message.broadcast?.channel_id;
    if (!channelId || !this.queryClient) return;

    // Invalidate queries for optimistic reaction updates
    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-posts-infinite", channelId]
    });
  }

  private handleChannelViewed(message: MattermostWSEvent): void {
    const channelId = message.data?.channel_id;
    if (!channelId || !this.queryClient) return;

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-unread"]
    });
  }

  private handleUserChange(message: MattermostWSEvent): void {
    const channelId = message.broadcast?.channel_id;
    if (!channelId || !this.queryClient) return;

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-posts-infinite", channelId]
    });

    this.queryClient.invalidateQueries({
      queryKey: ["mattermost-channels"]
    });
  }

  // Utility methods
  public sendTyping(channelId: string): void {
    if (!this.ws || this.connectionState !== "connected") return;

    const lastSent = this.typingThrottle.get(channelId);
    const now = Date.now();

    if (lastSent && now - lastSent < this.TYPING_THROTTLE_MS) {
      return; // Throttle typing events
    }

    this.typingThrottle.set(channelId, now);

    const payload = {
      action: "user_typing",
      seq: Date.now(),
      data: {
        channel_id: channelId,
        parent_id: ""
      }
    };

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to send typing event:", error);
    }
  }

  // Keep connection alive with periodic pings
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.connectionState === "connected") {
        try {
          this.ws.send(JSON.stringify({ action: "ping" }));
        } catch (error) {
          console.error("Failed to send ping:", error);
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
