export function safeDecodeURIComponent(value: string | undefined | null): string {
  if (typeof value !== "string") {
    if (value != null) {
      console.warn("safeDecodeURIComponent expects a string", value);
    }
    return "";
  }

  if (!value.includes("%")) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.warn("Failed to decode URI component", value, error);
    return value;
  }
}
