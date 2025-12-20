import { NextRequest } from "next/server";
import { WebSocket } from "ws";
import type { WebSocketServer } from "ws";

const MATTERMOST_TOKEN_COOKIE = "mm_pat" as const;
const TOKEN_QUERY_PARAM = "token" as const;

// Allowed origins for CORS - configurable via env
function getAllowedOrigins(): string[] {
  const defaultOrigins: (string | undefined)[] = [
    "https://ecency.com",
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_APP_BASE
  ];

  if (process.env.MATTERMOST_WS_ALLOWED_ORIGINS) {
    const customOrigins = process.env.MATTERMOST_WS_ALLOWED_ORIGINS
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    return [...defaultOrigins, ...customOrigins].filter((o): o is string => Boolean(o));
  }

  return defaultOrigins.filter((o): o is string => Boolean(o));
}

const ALLOWED_ORIGINS = getAllowedOrigins();

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getMattermostWebsocketUrl(): string {
  const base = requireEnv(process.env.MATTERMOST_BASE_URL, "MATTERMOST_BASE_URL");
  const baseUrl = new URL(base);
  baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}/websocket`;
  return baseUrl.toString();
}

function buildAuthenticationChallenge(token: string): string {
  return JSON.stringify({
    seq: 1,
    action: "authentication_challenge",
    data: { token }
  });
}

function getToken(request: NextRequest): string | undefined {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }

  // Check query parameter
  const queryToken = request.nextUrl.searchParams.get(TOKEN_QUERY_PARAM);
  if (queryToken) {
    return queryToken;
  }

  // Check cookie
  return request.cookies.get(MATTERMOST_TOKEN_COOKIE)?.value;
}

function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    // Same-origin requests don't have Origin header
    return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
}

export function UPGRADE(
  client: WebSocket,
  request: NextRequest,
  server: WebSocketServer
): void {
  // Check origin for CORS
  if (!checkOrigin(request)) {
    console.log("MM websocket: origin not allowed", request.headers.get("origin"));
    client.close(1008, "Origin not allowed");
    return;
  }

  // Get authentication token
  const token = getToken(request);
  if (!token) {
    console.log("MM websocket: no token provided");
    client.close(1008, "Unauthorized");
    return;
  }

  // Connect to upstream Mattermost WebSocket
  let upstream: WebSocket;
  try {
    upstream = new WebSocket(getMattermostWebsocketUrl());
  } catch (error) {
    console.error("MM websocket: failed to connect upstream", error);
    client.close(1011, "Chat service unavailable");
    return;
  }

  const closeBoth = (code = 1011, reason = "websocket error") => {
    try {
      client.close(code, reason);
    } catch (error) {
      console.error("MM websocket: failed closing downstream", error);
    }

    try {
      upstream.close(code, reason);
    } catch (error) {
      console.error("MM websocket: failed closing upstream", error);
    }
  };

  // Client -> Upstream forwarding
  client.on("message", (data, isBinary) => {
    try {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(data, { binary: isBinary });
      }
    } catch (error) {
      console.error("MM websocket: unable to forward client message", error);
      closeBoth(1011, "forward error");
    }
  });

  client.on("close", (code, reason) => {
    try {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.close(code, reason);
      }
    } catch (error) {
      console.error("MM websocket: failed closing upstream after client close", error);
    }
  });

  client.on("error", (error) => {
    console.error("MM websocket: client socket error", error);
    closeBoth(1011, "client error");
  });

  // Upstream -> Client forwarding
  upstream.on("open", () => {
    try {
      // Send authentication challenge with token
      upstream.send(buildAuthenticationChallenge(token));
    } catch (error) {
      console.error("MM websocket: unable to send auth challenge", error);
      closeBoth(1011, "auth error");
    }
  });

  upstream.on("message", (data, isBinary) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    } catch (error) {
      console.error("MM websocket: unable to forward upstream message", error);
      closeBoth(1011, "forward error");
    }
  });

  upstream.on("close", (code, reason) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.close(code, reason);
      }
    } catch (error) {
      console.error("MM websocket: failed closing downstream after upstream close", error);
    }
  });

  upstream.on("error", (error) => {
    console.error("MM websocket: upstream socket error", error);
    closeBoth(1011, "upstream error");
  });
}
