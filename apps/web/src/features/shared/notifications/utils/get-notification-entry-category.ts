import { ApiNotification } from "@/entities";
import { isCommunity } from "@/utils";

type JsonLike = { tags?: unknown } | undefined | null;

function extractTags(source: JsonLike): string[] | undefined {
  if (!source) {
    return undefined;
  }

  const tags = (source as any).tags;
  if (!Array.isArray(tags)) {
    return undefined;
  }

  return tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0);
}

function tryParseJsonMetadata(json: unknown): JsonLike {
  if (!json) {
    return undefined;
  }

  if (typeof json === "string") {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === "object") {
        return parsed as JsonLike;
      }
    } catch (_error) {
      return undefined;
    }
  }

  if (typeof json === "object") {
    return json as JsonLike;
  }

  return undefined;
}

export function getNotificationEntryCategory(notification: ApiNotification): string | undefined {
  const metadataTags = extractTags((notification as any).metadata);
  if (metadataTags && metadataTags.length > 0) {
    return metadataTags.find(isCommunity) ?? metadataTags[0];
  }

  const jsonMetadataTags = extractTags(tryParseJsonMetadata((notification as any).json_metadata));
  if (jsonMetadataTags && jsonMetadataTags.length > 0) {
    return jsonMetadataTags.find(isCommunity) ?? jsonMetadataTags[0];
  }

  if ("parent_permlink" in notification && isCommunity(notification.parent_permlink)) {
    return notification.parent_permlink;
  }

  return undefined;
}
