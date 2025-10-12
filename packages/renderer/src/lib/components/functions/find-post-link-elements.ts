const MARKDOWN_SCOPE_SELECTOR = ".markdown-view:not(.markdown-view-pure) a";

const ECENCY_HOSTNAMES = new Set([
  "ecency.com",
  "www.ecency.com",
  "peakd.com",
  "www.peakd.com",
  "hive.blog",
  "www.hive.blog",
]);

function normalizeDisplayText(text: string) {
  return text
    .trim()
    .replace(/^https?:\/\/(www\.)?(ecency\.com|peakd\.com|hive\.blog)/i, "")
    .replace(/^\/+/, "")
    .split("?")[0]
    .replace(/#@.*$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

export function findPostLinkElements(container: HTMLElement) {
  const anchors = Array.from(
    container.querySelectorAll<HTMLAnchorElement>(MARKDOWN_SCOPE_SELECTOR),
  );

  return anchors.filter((anchor) => {
    if (anchor.dataset.postLinkChecked === "true") {
      return anchor.classList.contains("markdown-post-link");
    }

    anchor.dataset.postLinkChecked = "true";

    if (anchor.classList.contains("markdown-post-link")) {
      return true;
    }

    const rawHref = anchor.getAttribute("href") ?? "";
    if (!rawHref) {
      return false;
    }

    try {
      const url = new URL(rawHref, "https://ecency.com");
      if (url.protocol && !/^https?:$/.test(url.protocol)) {
        return false;
      }

      if (url.hostname && url.hostname !== "" && !ECENCY_HOSTNAMES.has(url.hostname)) {
        // Only enhance Ecency links or relative links
        return false;
      }

      if (url.hash.startsWith("#@")) {
        // Comment links should stay untouched
        return false;
      }

      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2) {
        return false;
      }

      const permlink = decodeURIComponent(pathParts.pop() ?? "");
      const author = decodeURIComponent(pathParts.pop() ?? "");

      if (!author.startsWith("@") || !permlink) {
        return false;
      }

      const isCommunityPath =
        pathParts.length === 0 ||
        (pathParts.length === 1 && pathParts[0].toLowerCase().startsWith("hive-"));

      if (!isCommunityPath) {
        return false;
      }

      const normalizedDisplay = normalizeDisplayText(anchor.innerText);
      const normalizedTarget = `${author}/${permlink}`.toLowerCase();
      const communitySegment =
        pathParts.length === 1 ? decodeURIComponent(pathParts[0]).toLowerCase() : undefined;

      const expectedDisplays = new Set([normalizedTarget]);
      if (communitySegment) {
        expectedDisplays.add(`${communitySegment}/${normalizedTarget}`);
      }

      const matchesDisplay =
        anchor.innerText.trim() === rawHref.trim() ||
        expectedDisplays.has(normalizedDisplay);

      if (!matchesDisplay) {
        return false;
      }

      anchor.classList.add("markdown-post-link");
      return true;
    } catch {
      return false;
    }
  });
}
