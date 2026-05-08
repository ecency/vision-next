import { NextRequest, NextResponse } from "next/server";
import { EcencyConfigManager } from "@/config";
import { safeDecodeURIComponent } from "@/utils";

export async function POST(request: NextRequest) {
  const isEnabled = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.plausible.enabled
  );
  if (!isEnabled) {
    return Response.json({ status: 404 });
  }

  const { url, date_range: dateRange = "all", metrics, dimensions } = await request.json();

  if (!url) {
    return Response.json({ status: 400 });
  }

  const statsHost = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.plausible.host
  );

  let response: Response;
  try {
    response = await fetch(`${statsHost}/api/v2/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EcencyConfigManager.getConfigValue(
          ({ visionFeatures }) => visionFeatures.plausible.apiKey
        )}`
      },
      body: JSON.stringify({
        site_id: EcencyConfigManager.getConfigValue(
          ({ visionFeatures }) => visionFeatures.plausible.siteId
        ),
        metrics,
        filters: [["contains", "event:page", [safeDecodeURIComponent(url)]]],
        dimensions,
        date_range: dateRange
      }),
      cache: "default",
      // Plausible's /api/v2/query has historically blocked on its DB pool
      // (DBConnection.ConnectionError); a hung fetch here would pile up Node
      // connection slots the same way /pl/api/event used to. Bound it.
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json({}, { status: isTimeout ? 504 : 502 });
  }

  try {
    return NextResponse.json(await response.json());
  } catch (e) {
    return NextResponse.json({}, { status: 400 });
  }
}
