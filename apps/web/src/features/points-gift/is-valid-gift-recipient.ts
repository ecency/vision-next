// Client-side shape check for a Points gift recipient. This only gates the obvious
// Hive account-name shape so we never mint a PaymentIntent for a clearly malformed
// name; the backend still verifies the account actually exists before crediting it.
//
// Hive account-name rules mirrored here: total length 3-16, one or more dot-separated
// segments, each segment starts with a letter, contains only [a-z0-9-], is at least 3
// chars, has no leading/trailing hyphen and no double hyphen. A leading "@" and
// surrounding whitespace are tolerated (the caller may pass either form).
export function isValidGiftRecipient(raw: string): boolean {
  if (typeof raw !== "string") {
    return false;
  }
  const name = raw.trim().replace(/^@/, "").toLowerCase();
  if (name.length < 3 || name.length > 16) {
    return false;
  }
  return name.split(".").every((segment) => {
    if (segment.length < 3) {
      return false;
    }
    if (!/^[a-z]/.test(segment)) {
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(segment)) {
      return false;
    }
    if (segment.includes("--")) {
      return false;
    }
    if (segment.startsWith("-") || segment.endsWith("-")) {
      return false;
    }
    return true;
  });
}
