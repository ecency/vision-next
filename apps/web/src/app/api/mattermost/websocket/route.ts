import { NextRequest } from "next/server";

export const runtime = "edge";

const MATTERMOST_TOKEN_COOKIE = "mm_pat";
const TOKEN_QUERY_PARAM = "token";

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getMattermostWebsocketUrl() {
  const base = requireEnv(process.env.MATTERMOST_BASE_URL, "MATTERMOST_BASE_URL");
  const baseUrl = new URL(base);
  baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}/websocket`;
  return baseUrl.toString();
}

function buildAuthenticationChallenge(token: string) {
  return JSON.stringify({
    seq: 1,
    action: "authentication_challenge",
    data: { token }
  });
}

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice("bearer ".length).trim();
  }

  const queryToken = request.nextUrl.searchParams.get(TOKEN_QUERY_PARAM);
  if (queryToken) {
    return queryToken;
  }

  return request.cookies.get(MATTERMOST_TOKEN_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  if (request.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const token = getToken(request);

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { 0: client, 1: server } = new WebSocketPair();
  const downstream = client as WebSocket;

  let upstream: WebSocket;
  try {
    upstream = new WebSocket(getMattermostWebsocketUrl());
  } catch (error) {
    console.error("MM websocket: failed to connect upstream", error);
    return new Response("Chat service unavailable", { status: 502 });
  }

  const closeBoth = (code = 1011, reason = "websocket error") => {
    try {
      downstream.close(code, reason);
    } catch (error) {
      console.error("MM websocket: failed closing downstream", error);
    }

    try {
      upstream.close(code, reason);
    } catch (error) {
      console.error("MM websocket: failed closing upstream", error);
    }
  };

  downstream.accept();

  downstream.addEventListener("message", (event) => {
    try {
      upstream.send(event.data);
    } catch (error) {
      console.error("MM websocket: unable to forward client message", error);
      closeBoth(1011, "forward error");
    }
  });

  downstream.addEventListener("close", (event) => {
    try {
      upstream.close(event.code, event.reason);
    } catch (error) {
      console.error("MM websocket: failed closing upstream after client close", error);
    }
  });

  downstream.addEventListener("error", (event) => {
    console.error("MM websocket: client socket error", event);
    closeBoth(1011, "client error");
  });

  upstream.addEventListener("open", () => {
    try {
      upstream.send(buildAuthenticationChallenge(token));
    } catch (error) {
      console.error("MM websocket: unable to send auth challenge", error);
      closeBoth(1011, "auth error");
    }
  });

  upstream.addEventListener("message", (event) => {
    try {
      downstream.send(event.data);
    } catch (error) {
      console.error("MM websocket: unable to forward upstream message", error);
      closeBoth(1011, "forward error");
    }
  });

  upstream.addEventListener("close", (event) => {
    try {
      downstream.close(event.code, event.reason);
    } catch (error) {
      console.error("MM websocket: failed closing downstream after upstream close", error);
    }
  });

  upstream.addEventListener("error", (event) => {
    console.error("MM websocket: upstream socket error", event);
    closeBoth(1011, "upstream error");
  });

  return new Response(null, { status: 101, webSocket: server });
}
