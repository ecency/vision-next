export function sanitizeWalletUsername(
  username?: string | string[] | null
): string {
  if (Array.isArray(username)) {
    username = username[0];
  }

  if (typeof username !== "string") {
    return "";
  }

  return username
    .trim()
    .replace(/^@+/, "")
    .replace(/%40/gi, "")
    .toLowerCase();
}
