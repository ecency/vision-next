/**
 * Image formats accepted for upload.
 *
 * Kept in sync with the image server's accepted content types. Uploaded files are
 * stored as-is; the image proxy negotiates the delivery format (AVIF/WebP/original)
 * per request, so accepting a modern source format here costs nothing on delivery.
 */
export const ACCEPTED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "svg",
  "heic",
  "heif"
] as const;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/heic",
  "image/heif"
] as const;

/**
 * Value for a file input `accept` attribute. Extensions are listed alongside the
 * MIME types because some browsers report an empty type for AVIF and HEIC files.
 */
export const IMAGE_UPLOAD_ACCEPT = [
  ...ACCEPTED_IMAGE_MIME_TYPES,
  ...ACCEPTED_IMAGE_EXTENSIONS.map((ext) => `.${ext}`)
].join(", ");

export function isAcceptedImageFilename(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return !!ext && (ACCEPTED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAcceptedImageFile(file: File): boolean {
  return (
    (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase()) ||
    isAcceptedImageFilename(file.name)
  );
}
