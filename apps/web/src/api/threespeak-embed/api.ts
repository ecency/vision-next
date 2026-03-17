import * as tus from "tus-js-client";
import { EcencyConfigManager } from "@/config";
import { VideoUploadResult, ThreeSpeakEmbedVideo } from "./types";

function getEmbedEndpoint(): string {
  return EcencyConfigManager.getConfigValue(
    ({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.embedEndpoint
  ) as string;
}

/**
 * Request a short-lived upload token from our backend proxy.
 * The server-side API key never reaches the browser.
 */
async function requestUploadToken(
  owner: string,
  isShort: boolean
): Promise<{ token: string; upload_url: string }> {
  const response = await fetch("/api/threespeak/upload-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, isShort })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`[3Speak Embed] Failed to get upload token: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Extract the permlink from an embed URL.
 * Handles formats like:
 *   https://play.3speak.tv/embed?v=user/abcd1234
 *   @user/abcd1234
 */
export function extractPermlink(embedUrl: string): string {
  // Try ?v=user/permlink format
  const vParam = embedUrl.match(/[?&]v=([^&]+)/);
  if (vParam?.[1]) {
    const parts = vParam[1].split("/");
    const permlink = parts[parts.length - 1];
    if (permlink) return permlink;
  }
  // Try @user/permlink format
  const atFormat = embedUrl.match(/@[^/]+\/([a-zA-Z0-9]+)/);
  if (atFormat?.[1]) {
    return atFormat[1];
  }
  // Last segment fallback — strip query params
  const lastSegment = embedUrl.split("/").pop() ?? "";
  return lastSegment.split("?")[0].split("#")[0];
}

/**
 * Upload a video file via the TUS resumable upload protocol.
 * Obtains a short-lived upload token from the backend, then uploads directly to 3Speak.
 */
export async function uploadVideoEmbed(
  file: File,
  owner: string,
  isShort: boolean,
  progressCallback: (percentage: number) => void
): Promise<VideoUploadResult> {
  // Get upload token from our server (API key stays server-side)
  const { token, upload_url } = await requestUploadToken(owner, isShort);

  // Fall back to config endpoint if upload_url not provided
  const endpoint = upload_url || `${getEmbedEndpoint()}/uploads`;

  return new Promise<VideoUploadResult>((resolve, reject) => {
    let embedUrl = "";

    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        Authorization: `Bearer ${token}`
      },
      metadata: {
        filename: file.name
      },
      onError(error: Error) {
        reject(error);
      },
      onProgress(bytesUploaded: number, bytesTotal: number) {
        const percentage = Number(((bytesUploaded / bytesTotal) * 100).toFixed(2));
        progressCallback(percentage);
      },
      onSuccess() {
        if (embedUrl) {
          const permlink = extractPermlink(embedUrl);
          if (!permlink) {
            reject(
              new Error("[3Speak Embed] Upload succeeded but the permlink could not be extracted")
            );
            return;
          }
          resolve({
            embedUrl,
            permlink
          });
        } else {
          reject(new Error("[3Speak Embed] Upload succeeded but no embed URL was returned"));
        }
      },
      onAfterResponse(_req: any, res: any) {
        const headerUrl = res.getHeader?.("x-embed-url") || res.getHeader?.("X-Embed-URL");
        if (headerUrl) {
          embedUrl = headerUrl;
        }
      }
    });

    upload.start();
  });
}

/**
 * Get video metadata by permlink.
 * This endpoint is public on 3Speak (no API key needed).
 */
export async function getVideoMetadata(permlink: string): Promise<ThreeSpeakEmbedVideo> {
  const endpoint = getEmbedEndpoint();
  const response = await fetch(`${endpoint}/video/${permlink}`);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`[3Speak Embed] Failed to get video metadata: ${response.status}`);
    (err as any).status = response.status;
    (err as any).responseText = text;
    throw err;
  }

  return response.json();
}

/**
 * Set a custom thumbnail for a video via our backend proxy.
 * The API key stays server-side.
 */
export async function setVideoThumbnail(permlink: string, thumbnailUrl: string): Promise<void> {
  const response = await fetch("/api/threespeak/thumbnail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permlink, thumbnail_url: thumbnailUrl })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`[3Speak Embed] Failed to set thumbnail: ${response.status}`);
    (err as any).status = response.status;
    (err as any).responseText = text;
    throw err;
  }
}
