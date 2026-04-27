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

/** Permlinks are alphanumeric + hyphens, max 255 chars. */
const PERMLINK_RE = /^[a-zA-Z0-9-]{1,255}$/;

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
    const permlink = body.permlink as string | undefined;
    const hiveAuthor = body.hive_author as string | undefined;
    const hivePermlink = body.hive_permlink as string | undefined;
    const hiveTitle = body.hive_title as string | undefined;
    const hiveBody = body.hive_body as string | undefined;
    const hiveTags = body.hive_tags as string[] | undefined;

    // Resolve authenticated user via HiveSigner /api/me
    const auth = await resolveUser(req, body);
    if (!auth.ok) {
      return unauthorizedResponse(auth.reason);
    }

    if (!permlink || !hiveAuthor || !hivePermlink) {
      return Response.json(
        { error: "permlink, hive_author, and hive_permlink are required" },
        { status: 400 }
      );
    }

    if (!PERMLINK_RE.test(permlink)) {
      return Response.json({ error: "Invalid permlink format" }, { status: 400 });
    }

    // Only the video owner can link their video
    if (hiveAuthor !== auth.username) {
      return Response.json({ error: "hive_author must match the logged-in user" }, { status: 403 });
    }

    const res = await fetch(
      `${embedEndpoint}/video/${encodeURIComponent(permlink)}/hive`,
      {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hive_author: hiveAuthor,
          hive_permlink: hivePermlink,
          hive_title: hiveTitle || undefined,
          hive_body: hiveBody || undefined,
          hive_tags: hiveTags || undefined
        }),
        signal: AbortSignal.timeout(10_000)
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[3Speak] Hive link failed: ${res.status} ${text}`);
      return Response.json({ error: "Failed to link video to Hive post" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      console.error("[3Speak] Hive link upstream timeout");
      return Response.json({ error: "Upstream timeout" }, { status: 504 });
    }
    console.error("[3Speak] Hive link endpoint error:", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
