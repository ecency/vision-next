import { NextRequest, NextResponse } from "next/server";
import { EcencyConfigManager } from "@/config";
import { safeDecodeURIComponent } from "@/utils";

// Escape regex metacharacters so a page path is matched literally — an author like
// `peak.snaps` must not let `.` match an arbitrary character.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(request: NextRequest) {
  const isEnabled = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.plausible.enabled
  );
  if (!isEnabled) {
    return Response.json({ status: 404 });
  }

  const {
    url,
    date_range: dateRange = "all",
    metrics,
    dimensions,
    filterBy = "event:page"
  } = await request.json();

  if (!url) {
    return Response.json({ status: 400 });
  }

  // Restrict the filter dimension to a known allow-list — `event:page` (viewed
  // the page anywhere in the visit) or `visit:entry_page` (landed on it).
  const filterDimension = ["event:page", "visit:entry_page"].includes(filterBy)
    ? filterBy
    : "event:page";

  // Build the page filter. A trailing-slash URL is a prefix query — e.g. profile
  // insights sends `/@user/` to pull every page under that user — so keep a
  // substring `contains`. A full permlink is an exact page: use an end-anchored
  // `matches` so we still catch every recorded shape (bare, `/hive-123/@…`,
  // `/tag/@…`) that ENDS in the canonical `/@author/permlink`, without overmatching
  // a longer sibling permlink (`/@a/p` must not match `/@a/p-2`). Plausible's
  // `matches` maps to ClickHouse `multiMatchAny` (unanchored regex), so escape the
  // path and anchor the tail with `$`.
  // Plausible stores the pathname only, so strip any query string / fragment (e.g.
  // a comment permalink's `#@author/permlink`) before matching what's recorded.
  const page = safeDecodeURIComponent(url).split(/[?#]/)[0];

  // A bare profile prefix (`/@user` or `/@user/`) would aggregate every page under a creator --
  // that is the paid Insights view and must go through the auth-gated /api/profile-insights.
  // Reject it here so this public proxy only ever serves a single exact page (per-post
  // entry-stats). A permlink never matches this shape, so entry-stats is unaffected.
  if (/^\/@[a-z0-9.-]+\/?$/i.test(page)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const pageFilter = page.endsWith("/")
    ? ["contains", filterDimension, [page]]
    : ["matches", filterDimension, [`${escapeRegExp(page)}$`]];

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
        filters: [pageFilter],
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
    const body = await response.json();
    // Forward Plausible's status instead of always returning 200. Previously a
    // Plausible error (e.g. invalid date range, unknown dimension) reached the
    // client as 200 with an `{ error }` body, so the SDK's `response.ok` guard
    // never fired and the UI silently rendered 0. Propagating the status lets it
    // surface/retry the same way it does for the 504/502 timeout cases above.
    return NextResponse.json(body, { status: response.ok ? 200 : response.status });
  } catch (e) {
    // The same AbortSignal that bounds the fetch also bounds the body read,
    // so response.json() can throw TimeoutError or AbortError if the cap fires
    // mid-stream. Classify those as 504; treat anything else as a transport
    // failure (502) rather than a 400 client error.
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      return NextResponse.json({}, { status: 504 });
    }
    return NextResponse.json({}, { status: 502 });
  }
}
