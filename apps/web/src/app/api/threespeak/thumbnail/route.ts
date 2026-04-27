import { NextRequest } from "next/server";
import { EcencyConfigManager } from "@/config";
import { resolveUser, unauthorizedResponse } from "../resolve-user";

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
    const { permlink, thumbnail_url } = body;

    // Resolve authenticated user via HiveSigner /api/me
    const auth = await resolveUser(req, body);
    if (!auth.ok) {
      return unauthorizedResponse(auth.reason);
    }

    if (!permlink || !thumbnail_url) {
      return Response.json({ error: "permlink and thumbnail_url are required" }, { status: 400 });
    }

    const res = await fetch(`${embedEndpoint}/video/${encodeURIComponent(permlink as string)}/thumbnail`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ thumbnail_url })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[3Speak] Thumbnail update failed: ${res.status} ${text}`);
      return Response.json({ error: "Failed to set thumbnail" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    console.error("[3Speak] Thumbnail endpoint error:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
