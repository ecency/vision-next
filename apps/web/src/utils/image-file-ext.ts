const IMAGE_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif"
};

/**
 * Resolve a file extension for an image MIME type.
 *
 * Used when building an upload `File` from a `Blob` (e.g. a pasted clipboard
 * image) that has no name of its own. The Ecency image server rejects uploads
 * whose filename has no valid image extension, so callers must supply one.
 * Falls back to `png` for unknown/empty types.
 */
export function extForImageType(type: string | undefined | null): string {
  return IMAGE_MIME_EXT[(type ?? "").toLowerCase()] ?? "png";
}
