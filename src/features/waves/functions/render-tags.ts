import { MutableRefObject } from "react";

export function renderTags(renderAreaRef: MutableRefObject<HTMLElement | null>) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLLinkElement>(".markdown-tag-link")
    .forEach((element) => {
      element.href = `/trending/${element.dataset.tag}`;
      element.target = "_blank";
    });
}
