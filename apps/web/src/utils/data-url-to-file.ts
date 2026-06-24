/**
 * Convert a base64 data URL (e.g. the PNG emitted by the DecentMemes widget via
 * `postMessage`) into a `File` suitable for the Ecency image-upload pipeline,
 * which expects a `File` rather than a raw `Blob`.
 */
export async function dataUrlToFile(dataUrl: string, filename = "meme.png"): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const type = blob.type || "image/png";
  // Strip any path components a widget might include in the suggested name.
  const base = (filename || "meme.png").split(/[\\/]+/).pop() || "meme.png";
  const safeName = /\.[a-z0-9]+$/i.test(base) ? base : `${base}.png`;
  return new File([blob], safeName, { type });
}
