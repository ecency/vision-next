/**
 * Converts HEIC/HEIF image files to JPEG for browser compatibility.
 * iPhone cameras save photos in HEIC format by default, which most
 * image servers and browsers don't handle well.
 *
 * If the file is not HEIC/HEIF, it is returned as-is.
 */

const HEIC_TYPES = ["image/heic", "image/heif"];
const HEIC_EXTENSIONS = [".heic", ".heif"];

export function isHeicFile(file: File): boolean {
  if (HEIC_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  return HEIC_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92
    });

    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    const newName = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
    return new File([resultBlob], newName, { type: "image/jpeg" });
  } catch (e) {
    console.error("[HEIC] Conversion failed, uploading original file:", e);
    return file;
  }
}
