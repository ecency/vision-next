import { NextRequest } from "next/server";
import { EcencyConfigManager } from "@/config";

export async function GET(request: NextRequest) {
  const isEnabled = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.plausible.enabled
  );
  if (!isEnabled) {
    return Response.json({ status: 404 });
  }

  const url = request.nextUrl.searchParams.get("url");
  const dateRange = request.nextUrl.searchParams.get("dateRange") ?? "all";

  if (!url) {
    return Response.json({ status: 400 });
  }

  const statsHost = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.plausible.host
  );

  return fetch(`${statsHost}/api/v2/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EcencyConfigManager.getConfigValue(
        ({ visionFeatures }) => visionFeatures.plausible.apiKey
      )}))}`
    },
    body: JSON.stringify({
      site_id: EcencyConfigManager.getConfigValue(
        ({ visionFeatures }) => visionFeatures.plausible.siteId
      ),
      metrics: ["visitors", "pageviews"],
      filters: [["contains", "event:page", [url]]],
      date_range: dateRange
    }),
    cache: "default"
  });
}
