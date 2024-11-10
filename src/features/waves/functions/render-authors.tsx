import React, { MutableRefObject } from "react";
import { hydrateRoot } from "react-dom/client";
import { UserAvatar } from "@/features/shared";

export function renderAuthors(renderAreaRef: MutableRefObject<HTMLElement | null>) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLLinkElement>(".markdown-author-link")
    .forEach((element) => {
      const { author } = element.dataset;
      if (author) {
        element.href = `/@${author}`;
        element.target = "_blank";
        hydrateRoot(
          element,
          <>
            <UserAvatar size="xsmall" username={author} />
            <span>{author}</span>
          </>
        );
      }
    });
}
