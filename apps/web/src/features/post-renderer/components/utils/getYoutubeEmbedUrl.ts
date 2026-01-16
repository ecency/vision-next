export function getYoutubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    let videoId = "";

    if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    } else if (u.pathname.startsWith("/shorts/")) {
      videoId = u.pathname.split("/shorts/")[1];
    } else if (u.pathname.startsWith("/embed/")) {
      videoId = u.pathname.split("/embed/")[1];
    } else {
      videoId = u.searchParams.get("v") ?? "";
    }

    if (!videoId) {
      return "";
    }

    const params = new URLSearchParams();
    const startParam =
      u.searchParams.get("t") ||
      u.searchParams.get("start") ||
      u.searchParams.get("time_continue");

    if (startParam) {
      const seconds = parseTime(startParam);
      if (seconds) {
        params.set("start", seconds.toString());
      }
    }

    const listParam = u.searchParams.get("list");
    if (listParam) {
      params.set("list", listParam);
    }

    params.set("rel", "0");
    params.set("modestbranding", "1");

    const query = params.toString();
    return `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ""}`;
  } catch {
    return "";
  }
}

function parseTime(value: string): number | undefined {
  const re = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const match = value.match(re);
  if (match && (match[1] || match[2] || match[3])) {
    const h = parseInt(match[1] || "0", 10);
    const m = parseInt(match[2] || "0", 10);
    const s = parseInt(match[3] || "0", 10);
    return h * 3600 + m * 60 + s;
  }
  const asInt = parseInt(value, 10);
  return Number.isNaN(asInt) ? undefined : asInt;
}
