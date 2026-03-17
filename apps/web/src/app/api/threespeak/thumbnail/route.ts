import { NextRequest } from "next/server";
import { EcencyConfigManager } from "@/config";

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

  try {
    const { permlink, thumbnail_url } = await req.json();

    if (!permlink || !thumbnail_url) {
      return Response.json({ error: "permlink and thumbnail_url are required" }, { status: 400 });
    }

    const res = await fetch(`${embedEndpoint}/video/${permlink}/thumbnail`, {
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
