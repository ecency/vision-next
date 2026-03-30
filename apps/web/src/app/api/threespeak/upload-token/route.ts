import { NextRequest } from "next/server";
import { EcencyConfigManager } from "@/config";
import { resolveUser } from "../resolve-user";

function getConfig() {
  const embedEndpoint = EcencyConfigManager.getConfigValue(
    ({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.embedEndpoint
  ) as string;
  const apiKey = EcencyConfigManager.getConfigValue(
    ({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.serverApiKey
  ) as string | undefined;
  return { embedEndpoint, apiKey };
}

export async function POST(req: NextRequest) {
  const { embedEndpoint, apiKey } = getConfig();

  if (!apiKey) {
    return Response.json({ error: "3Speak integration not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { owner, isShort } = body;

    // Resolve authenticated user from cookie (web) or code token (mobile)
    const activeUser = await resolveUser(req, body);
    if (!activeUser) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!owner || typeof owner !== "string" || owner !== activeUser) {
      return Response.json({ error: "owner must match the logged-in user" }, { status: 403 });
    }

    // Mobile clients authenticate via body.code (HiveSigner token) and
    // don't send a browser Origin header, so skip the origin restriction.
    // Web clients use cookie auth and need origin enforcement.
    const isMobileClient = typeof body.code === "string" && body.code.length > 0;

    const res = await fetch(`${embedEndpoint}/uploads/token`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        owner,
        frontend_app: "ecency",
        short: !!isShort,
        allowed_origins: isMobileClient
          ? []
          : ["https://ecency.com", "https://alpha.ecency.com"]
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[3Speak] Token request failed: ${res.status} ${text}`);
      return Response.json({ error: "Failed to obtain upload token" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data, { status: 201 });
  } catch (e) {
    console.error("[3Speak] Token endpoint error:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
