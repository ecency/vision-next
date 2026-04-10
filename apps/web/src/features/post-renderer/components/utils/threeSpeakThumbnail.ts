/**
 * Injects a thumbnail image into a 3Speak video embed element
 * if one doesn't already exist.
 *
 * Looks through the post's json_metadata.image array for a suitable
 * thumbnail, preferring images that reference the same video ID or
 * come from known 3Speak CDN domains.
 */
export function injectThreeSpeakThumbnail(
  element: HTMLElement,
  images?: string[]
): void {
  if (!images?.length) return;
  if (element.querySelector(".video-thumbnail")) return;

  const stringImages = images.filter((img): img is string => typeof img === "string");
  if (!stringImages.length) return;

  const embedSrc = element.dataset.embedSrc ?? "";
  const videoId = extractVideoId(embedSrc);

  const thumbnail = findBestThumbnail(stringImages, videoId);
  if (!thumbnail) return;

  const img = document.createElement("img");
  img.className = "no-replace video-thumbnail";
  img.alt = "";
  img.setAttribute("itemprop", "thumbnailUrl");
  img.src = thumbnail;

  const playBtn = element.querySelector(".markdown-video-play");
  if (playBtn) {
    element.insertBefore(img, playBtn);
  } else {
    element.appendChild(img);
  }
}

function extractVideoId(embedSrc: string): string {
  try {
    const url = new URL(embedSrc);
    return url.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
}

const THREESPEAK_CDN_PATTERNS = [
  "3speakcontent",
  "threespeakvideo",
  "3speak.tv",
  "3speak.co",
];

function findBestThumbnail(
  images: string[],
  videoId: string
): string | undefined {
  if (!images.length) return undefined;

  const safeVideoId = typeof videoId === "string" ? videoId : "";
  const permlink = safeVideoId.split("/")[1] ?? "";

  // Prefer image that matches the video permlink
  if (permlink) {
    const match = images.find((img) => typeof img === "string" && img.includes(permlink));
    if (match) return match;
  }

  // Then prefer images from 3Speak CDN
  const cdnMatch = images.find((img) =>
    typeof img === "string" && THREESPEAK_CDN_PATTERNS.some((pattern) => img.includes(pattern))
  );
  if (cdnMatch) return cdnMatch;

  // Fall back to first image (likely the post thumbnail set during publish)
  return images[0];
}
