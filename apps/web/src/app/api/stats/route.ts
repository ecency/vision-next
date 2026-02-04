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

  const response = await fetch(`${statsHost}/api/v2/query`, {
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
    cache: "default"
  });

  try {
    return NextResponse.json(await response.json());
  } catch (e) {
    return NextResponse.json({}, { status: 400 });
  }
}
