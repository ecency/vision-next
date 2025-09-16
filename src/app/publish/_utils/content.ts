export function extractPublishContentText(content?: string | null): string {
  if (!content) {
    return "";
  }

  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasPublishContent(content?: string | null): boolean {
  if (!content) {
    return false;
  }

  if (extractPublishContentText(content).length > 0) {
    return true;
  }

  return /<(img|video|audio|iframe|embed|object|source|canvas)\b/i.test(content);
}
