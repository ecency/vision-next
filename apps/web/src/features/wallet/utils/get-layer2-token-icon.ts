export function getLayer2TokenIcon(metadata?: string | null) {
  if (!metadata) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(metadata);
    if (parsed && typeof parsed.icon === "string" && parsed.icon.trim().length > 0) {
      return parsed.icon as string;
    }
  } catch (e) {
    // Swallow JSON parsing issues and fall back to default rendering.
  }

  return undefined;
}
