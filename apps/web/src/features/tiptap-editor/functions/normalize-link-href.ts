/**
 * Normalizes a user-entered link target before it is validated/applied.
 *
 * Writers routinely type bare domains like `ecency.com`. Without a scheme the
 * URL validation rejects them, which made adding a link feel broken. We only
 * prepend `https://` when there is no scheme and the value isn't already an
 * in-page anchor, root-relative path or protocol-relative URL.
 */
export function normalizeLinkHref(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  if (hasScheme || trimmed.startsWith("//") || trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
