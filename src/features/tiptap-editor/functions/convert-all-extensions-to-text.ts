import { TAG_MENTION_SPAN_REGEX, USER_MENTION_SPAN_REGEX } from "../extensions";

export function convertAllExtensionsToText(content: string) {
  return content
    .replace(USER_MENTION_SPAN_REGEX, (match: string) => {
      const el = document.createElement("span");
      el.innerHTML = match;
      return "@" + (el.firstChild as HTMLElement)?.dataset["id"];
    })
    .replace(TAG_MENTION_SPAN_REGEX, (match: string) => {
      const el = document.createElement("span");
      el.innerHTML = match;
      return "#" + (el.firstChild as HTMLElement)?.dataset["id"];
    });
}
