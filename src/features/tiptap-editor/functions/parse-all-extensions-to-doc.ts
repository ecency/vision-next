import { TAG_MENTION_PURE_REGEX, USER_MENTION_PURE_REGEX } from "../extensions";

export function parseAllExtensionsToDoc(value?: string) {
  return value
    ?.replace(
      USER_MENTION_PURE_REGEX,
      (match) => `<span data-type="mention" data-id=${match.replace("@", "")}></span>`
    )
    ?.replace(
      TAG_MENTION_PURE_REGEX,
      (match) => `<span data-type="tag" data-id=${match.replace("#", "")} /></span>`
    );
}
