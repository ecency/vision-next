import * as tus from "tus-js-client";
import { EcencyConfigManager } from "@/config";
import { VideoUploadResult, ThreeSpeakEmbedVideo } from "./types";

function getEmbedEndpoint(): string {
  return EcencyConfigManager.getConfigValue(
    ({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.embedEndpoint
  ) as string;
}

function getApiKey(): string {
  const key = EcencyConfigManager.getConfigValue(
    ({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.apiKey
  ) as string | undefined;
  if (!key) {
    throw new Error("[3Speak Embed] Missing THREESPEAK_EMBED_API_KEY");
  }
  return key;
}

/**
 * Extract the permlink from an embed URL.
 * Handles formats like:
 *   https://play.3speak.tv/embed?v=user/abcd1234
 *   @user/abcd1234
 */
function extractPermlink(embedUrl: string): string {
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
  // Last segment fallback
  return embedUrl.split("/").pop() ?? "";
}

/**
 * Upload a video file via the TUS resumable upload protocol.
 * Returns the embed URL and permlink.
 */
export function uploadVideoEmbed(
  file: File,
  owner: string,
  isShort: boolean,
  progressCallback: (percentage: number) => void
): Promise<VideoUploadResult> {
  const endpoint = getEmbedEndpoint();
  const apiKey = getApiKey();

  return new Promise<VideoUploadResult>((resolve, reject) => {
    let embedUrl = "";

    const upload = new tus.Upload(file, {
      endpoint: `${endpoint}/uploads`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        "X-API-Key": apiKey
      },
      metadata: {
        filename: file.name,
        owner,
        frontend_app: "ecency",
        short: isShort ? "true" : "false"
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
          resolve({
            embedUrl,
            permlink: extractPermlink(embedUrl)
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
 */
export async function getVideoMetadata(permlink: string): Promise<ThreeSpeakEmbedVideo> {
  const endpoint = getEmbedEndpoint();
  const response = await fetch(`${endpoint}/video/${permlink}`, {
    headers: {
      "X-API-Key": getApiKey()
    }
  });

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
 * Set a custom thumbnail for a video.
 */
export async function setVideoThumbnail(permlink: string, thumbnailUrl: string): Promise<void> {
  const endpoint = getEmbedEndpoint();
  const response = await fetch(`${endpoint}/video/${permlink}/thumbnail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey()
    },
    body: JSON.stringify({ thumbnail_url: thumbnailUrl })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`[3Speak Embed] Failed to set thumbnail: ${response.status}`);
    (err as any).status = response.status;
    (err as any).responseText = text;
    throw err;
  }
}
