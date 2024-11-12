import React, { MutableRefObject } from "react";
import { hydrateRoot } from "react-dom/client";
import { TwitterTweetEmbed } from "react-twitter-embed";

export function renderTweets(renderAreaRef: MutableRefObject<HTMLElement | null>) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLDivElement>(".twitter-tweet")
    .forEach((element) => {
      const link = element.querySelector("p")?.innerText;

      if (link) {
        const parts = link.split("/");
        const id = parts[parts.length - 1].replace(/\?.*/, "");
        hydrateRoot(element, <TwitterTweetEmbed tweetId={id} />);
      }
    });
}
