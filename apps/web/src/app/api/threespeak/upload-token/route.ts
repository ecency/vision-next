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
    const { owner, isShort } = await req.json();

    if (!owner || typeof owner !== "string") {
      return Response.json({ error: "owner is required" }, { status: 400 });
    }

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
        allowed_origins: [
          "https://ecency.com",
          "https://alpha.ecency.com"
        ]
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
