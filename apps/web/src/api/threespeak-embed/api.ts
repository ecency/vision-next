import * as tus from "tus-js-client";
import { EcencyConfigManager } from "@/config";
import * as ls from "@/utils/local-storage";
import { getAccessToken } from "@/utils/user-token";
import { VideoUploadResult, ThreeSpeakEmbedVideo } from "./types";

function getEmbedEndpoint(): string {
  return EcencyConfigManager.getConfigValue(
    ({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.embedEndpoint
  ) as string;
}

/**
 * Returns the active user's cached HiveSigner access token to send as `code`
 * to the 3Speak proxy routes. The server validates this against
 * https://hivesigner.com/api/me — never trust the bare cookie.
 *
 * Uses the synchronous cached read (which schedules a background refresh
 * if expiry is near) rather than blocking on `ensureValidToken`. A blocking
 * refresh would turn a transient HiveSigner outage into a hard "log in
 * again" prompt, even when the cached token is still acceptable upstream.
 *
 * Throws only when the user is not logged in at all; expired-token cases
 * are detected by the server's HS validation and returned as 401, which
 * callers may surface to the user as a normal re-login prompt.
 */
function getThreeSpeakAuthCode(): string {
  const username = ls.get("active_user");
  if (!username) {
    const err = new Error("[3Speak] Not logged in");
    (err as any).status = 401;
    throw err;
  }
  const token = getAccessToken(username);
  if (!token) {
    const err = new Error("[3Speak] No HiveSigner token available — please log in again");
    (err as any).status = 401;
    throw err;
  }
  return token;
}

/**
 * Request a short-lived upload token from our backend proxy.
 * The server-side API key never reaches the browser.
 */
async function requestUploadToken(
  owner: string,
  isShort: boolean
): Promise<{ token: string; upload_url: string }> {
  const code = getThreeSpeakAuthCode();
  const response = await fetch("/api/threespeak/upload-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, isShort, code })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`[3Speak Embed] Failed to get upload token: ${response.status} ${text}`);
    (err as any).status = response.status;
    throw err;
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

const MB = 1024 * 1024;

/**
 * Choose chunk size and parallelism based on the file size.
 *
 * Parallel uploads use the TUS Concatenation extension (supported by the
 * 3Speak tusd backend): the file is split into N parts uploaded concurrently,
 * then stitched server-side. Small files skip parallelism — there is no
 * throughput gain and it avoids zero-length parts. Chunk size is kept modest
 * so peak in-flight memory stays around chunkSize × parallelUploads.
 */
export function getUploadTuning(size: number): { chunkSize: number; parallelUploads: number } {
  if (size <= 10 * MB) return { chunkSize: 5 * MB, parallelUploads: 1 };
  if (size <= 500 * MB) return { chunkSize: 10 * MB, parallelUploads: 3 };
  return { chunkSize: 20 * MB, parallelUploads: 3 };
}

/**
 * Upload a video file via the TUS resumable upload protocol.
 *
 * Tries the size-tuned settings first (parallel for files > 10MB). Parallel
 * uploads depend on the 3Speak tusd backend supporting the Concatenation
 * extension AND returning X-Embed-URL on the final concat response; if that
 * assumption doesn't hold the parallel attempt fails, so we retry once on the
 * proven sequential path (with a fresh token) rather than failing outright.
 */
export async function uploadVideoEmbed(
  file: File,
  owner: string,
  isShort: boolean,
  progressCallback: (percentage: number) => void
): Promise<VideoUploadResult> {
  const { chunkSize, parallelUploads } = getUploadTuning(file.size);

  try {
    return await uploadOnce(file, owner, isShort, chunkSize, parallelUploads, progressCallback);
  } catch (err) {
    if (parallelUploads > 1) {
      console.warn("[3Speak Embed] Parallel upload failed; retrying sequentially.", err);
      progressCallback(0);
      return uploadOnce(file, owner, isShort, chunkSize, 1, progressCallback);
    }
    throw err;
  }
}

/**
 * Perform a single TUS upload attempt with an explicit chunk size / parallelism.
 * Obtains a fresh short-lived upload token, then uploads directly to 3Speak.
 */
async function uploadOnce(
  file: File,
  owner: string,
  isShort: boolean,
  chunkSize: number,
  parallelUploads: number,
  progressCallback: (percentage: number) => void
): Promise<VideoUploadResult> {
  // Get upload token from our server (API key stays server-side)
  const { token, upload_url } = await requestUploadToken(owner, isShort);

  // Fall back to config endpoint if upload_url not provided
  const endpoint = upload_url || `${getEmbedEndpoint()}/uploads`;

  return new Promise<VideoUploadResult>((resolve, reject) => {
    // With parallelUploads the partial creation responses each carry their own
    // X-Embed-URL; the canonical one is on the final concatenation request
    // (Upload-Concat: final). Prefer it, falling back to the last-seen URL so
    // the sequential path (parallelUploads = 1) keeps its previous behaviour.
    let embedUrl = "";
    let finalEmbedUrl = "";

    const upload = new tus.Upload(file, {
      endpoint,
      chunkSize,
      parallelUploads,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        Authorization: `Bearer ${token}`
      },
      metadata: {
        filename: file.name
      },
      onError(error: Error) {
        // Stop any still-in-flight parallel parts so they don't keep uploading
        // while the caller retries sequentially.
        upload.abort().catch(() => {});
        reject(error);
      },
      onProgress(bytesUploaded: number, bytesTotal: number) {
        const percentage = Number(((bytesUploaded / bytesTotal) * 100).toFixed(2));
        progressCallback(percentage);
      },
      onSuccess() {
        // The canonical embed URL is the one returned by the final
        // concatenation request (Upload-Concat: final). In parallel mode we
        // REQUIRE it: partial creation responses carry their own non-canonical
        // URLs, so falling back to one would link the post to a transient
        // partial resource. The sequential path has no concat step, so the
        // last-seen URL (the final PATCH) is canonical and used as the fallback.
        if (parallelUploads > 1 && !finalEmbedUrl) {
          reject(
            new Error(
              "[3Speak Embed] Parallel upload finished without an X-Embed-URL on the final " +
                "concatenation response; refusing to fall back to a partial-upload URL."
            )
          );
          return;
        }
        const resolvedUrl = finalEmbedUrl || embedUrl;
        if (resolvedUrl) {
          const permlink = extractPermlink(resolvedUrl);
          if (!permlink) {
            reject(
              new Error("[3Speak Embed] Upload succeeded but the permlink could not be extracted")
            );
            return;
          }
          resolve({
            embedUrl: resolvedUrl,
            permlink
          });
        } else {
          reject(new Error("[3Speak Embed] Upload succeeded but no embed URL was returned"));
        }
      },
      onAfterResponse(req: any, res: any) {
        const headerUrl = res.getHeader?.("x-embed-url") || res.getHeader?.("X-Embed-URL");
        if (!headerUrl) {
          return;
        }
        // Prefer the embed URL from the final concatenation request; partial
        // creation responses (Upload-Concat: partial) may carry their own.
        const concat = String(req.getHeader?.("Upload-Concat") ?? "");
        if (concat.startsWith("final")) {
          finalEmbedUrl = headerUrl;
        }
        embedUrl = headerUrl;
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
  const code = getThreeSpeakAuthCode();
  const response = await fetch("/api/threespeak/thumbnail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permlink, thumbnail_url: thumbnailUrl, code })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`[3Speak Embed] Failed to set thumbnail: ${response.status}`);
    (err as any).status = response.status;
    (err as any).responseText = text;
    throw err;
  }
}

/**
 * Links an uploaded video to a published Hive post/comment.
 * This enables the video to appear in 3Speak's special feeds (e.g. Shorts).
 *
 * Should be called after the Hive broadcast succeeds — fire-and-forget is fine
 * since this is a non-critical metadata update.
 */
export interface LinkVideoToHiveParams {
  /** Video permlink (from the embed URL, NOT the Hive post permlink) */
  videoPermlink: string;
  hiveAuthor: string;
  hivePermlink: string;
  hiveTitle?: string;
  hiveBody?: string;
  hiveTags?: string[];
}

export async function linkVideoToHive(params: LinkVideoToHiveParams): Promise<void> {
  try {
    const code = getThreeSpeakAuthCode();
    const response = await fetch("/api/threespeak/link-hive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permlink: params.videoPermlink,
        hive_author: params.hiveAuthor,
        hive_permlink: params.hivePermlink,
        hive_title: params.hiveTitle,
        hive_body: params.hiveBody,
        hive_tags: params.hiveTags,
        code
      })
    });

    if (!response.ok) {
      console.error(`[3Speak] Failed to link video to Hive: ${response.status}`);
    }
  } catch (e) {
    // Non-critical — video still works, just won't appear in 3Speak feeds
    console.error("[3Speak] linkVideoToHive error:", e);
  }
}
