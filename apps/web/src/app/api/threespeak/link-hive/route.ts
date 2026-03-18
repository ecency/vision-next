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

/**
 * Links an uploaded 3Speak video to a published Hive post/comment.
 *
 * This tells the 3Speak embed service which Hive content the video belongs to,
 * enabling it to appear in 3Speak's special feeds (e.g. Shorts feed).
 *
 * Called after the Hive broadcast succeeds.
 */
export async function POST(req: NextRequest) {
  const { embedEndpoint, apiKey } = getConfig();

  if (!apiKey) {
    return Response.json({ error: "3Speak integration not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { permlink, hive_author, hive_permlink, hive_title, hive_body, hive_tags } = body;

    // Resolve authenticated user from cookie (web) or code token (mobile)
    const activeUser = await resolveUser(req, body);
    if (!activeUser) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!permlink || !hive_author || !hive_permlink) {
      return Response.json(
        { error: "permlink, hive_author, and hive_permlink are required" },
        { status: 400 }
      );
    }

    // Only the video owner can link their video
    if (hive_author !== activeUser) {
      return Response.json({ error: "hive_author must match the logged-in user" }, { status: 403 });
    }

    const res = await fetch(`${embedEndpoint}/video/${permlink}/hive`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hive_author,
        hive_permlink,
        hive_title: hive_title || undefined,
        hive_body: hive_body || undefined,
        hive_tags: hive_tags || undefined
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[3Speak] Hive link failed: ${res.status} ${text}`);
      return Response.json({ error: "Failed to link video to Hive post" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    console.error("[3Speak] Hive link endpoint error:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
