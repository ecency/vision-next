import { TAG_MENTION_SPAN_REGEX, USER_MENTION_SPAN_REGEX } from "../extensions";

export function convertAllExtensionsToText(content: string) {
  const mentions = Array.from(content.matchAll(USER_MENTION_SPAN_REGEX));
  const tags = Array.from(content.matchAll(TAG_MENTION_SPAN_REGEX));

  mentions.forEach(([mention]) => {
    const el = document.createElement("span");
    el.innerHTML = mention;
    const rawUsername = "@" + (el.firstChild as HTMLElement)?.dataset["id"];
    content.replace(mention, rawUsername);
  });

  tags.forEach(([tag]) => {
    const el = document.createElement("span");
    el.innerHTML = tag;
    const rawUsername = "#" + (el.firstChild as HTMLElement)?.dataset["id"];
    content.replace(tag, rawUsername);
  });
  return content;
}
